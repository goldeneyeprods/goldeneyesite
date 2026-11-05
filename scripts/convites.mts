// ============================================================================
//  CONVITES ESPECIAIS — ingressos de cortesia emitidos pela produção
//
//    npx tsx scripts/convites.mts --para voce@exemplo.com "Fulane de Tal:2" "Ciclane:1"
//    (opcional: --evento <slug>, padrão corujao-acido; --forcar emite de novo
//     para um nome que já tem convite)
//
//  Cada convidado vira um pedido pago de R$ 0, com ingressos meia no nome dele,
//  saídos do lote "Convite Especial" (cortesia: fora das fases e da cota de
//  meia, mas ocupando lugar no teto do evento). O PDF de cada convidado vai
//  para o e-mail de --para, para a produção encaminhar.
// ============================================================================

import { readFileSync } from 'node:fs'

for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
}

const { sql } = await import('../lib/db.ts')
const { lerEstoque } = await import('../lib/lotes.ts')
const { gerarTokenIngresso, chaveLinkPedido } = await import('../lib/ticket.ts')
const { linkDoIngresso } = await import('../lib/url.ts')
const { enviarEmailConvite } = await import('../lib/email.ts')

const NOME_LOTE = 'Convite Especial'

// ---- argumentos --------------------------------------------------------------
const args = process.argv.slice(2)
const valor = (flag: string) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args.splice(i, 2)[1] : undefined
}
const para = valor('--para')
const slug = valor('--evento') ?? 'corujao-acido'
const forcar = args.includes('--forcar')
const convidados = args
  .filter((a) => !a.startsWith('--'))
  .map((a) => {
    const m = a.match(/^(.+?):(\d+)$/)
    if (!m) throw new Error(`Use "Nome:quantidade", veio "${a}"`)
    return { nome: m[1].trim(), qtd: Number(m[2]) }
  })

if (!para || !/^\S+@\S+\.\S+$/.test(para) || convidados.length === 0) {
  console.error('Uso: npx tsx scripts/convites.mts --para email "Nome:2" "Outro Nome:1"')
  process.exit(1)
}

// ---- emissão (uma transação; e-mail só depois) ------------------------------
const [evento] = await sql<
  { id: number; nome: string; data_inicio: Date; local_nome: string; endereco: string }[]
>`select id::int as id, nome, data_inicio, local_nome, endereco from eventos where slug = ${slug}`
if (!evento) throw new Error(`Evento ${slug} não existe`)

type Emitido = { pedidoId: string; nome: string; ingressos: { id: string; tokenQr: string }[] }

const emitidos = await sql.begin(async (tx) => {
  const estoque = await lerEstoque(tx, evento.id, { travar: true })

  let [lote] = await tx<{ id: number }[]>`
    select id::int as id from lotes
     where evento_id = ${evento.id} and cortesia
     order by id limit 1
       for update
  `
  if (!lote) {
    ;[lote] = await tx<{ id: number }[]>`
      insert into lotes (evento_id, nome, tipo, preco_centavos, quantidade_total,
                         ordem, fase, ativo, cortesia)
      values (${evento.id}, ${NOME_LOTE}, 'meia', 0, 0, 999, 999, false, true)
      returning id::int as id
    `
  }

  const jaTem = await tx<{ comprador_nome: string }[]>`
    select distinct p.comprador_nome
      from pedidos p join pedido_itens pi on pi.pedido_id = p.id
     where pi.lote_id = ${lote.id} and p.status = 'pago'
  `
  const repetidos = convidados.filter((c) =>
    jaTem.some((j) => j.comprador_nome.toLowerCase() === c.nome.toLowerCase())
  )
  if (repetidos.length && !forcar) {
    throw new Error(
      `Já têm convite: ${repetidos.map((r) => r.nome).join(', ')}. Use --forcar para emitir mais.`
    )
  }

  const total = convidados.reduce((s, c) => s + c.qtd, 0)
  if (total > estoque.restanteEvento) {
    throw new Error(`Só cabem mais ${estoque.restanteEvento} no evento; pedidos ${total}.`)
  }

  // O lote de cortesia cresce do tamanho exato do que foi emitido.
  await tx`
    update lotes
       set quantidade_total   = quantidade_total + ${total},
           quantidade_vendida = quantidade_vendida + ${total}
     where id = ${lote.id}
  `

  const lista: Emitido[] = []
  for (const c of convidados) {
    const [pedido] = await tx<{ id: string }[]>`
      insert into pedidos (evento_id, comprador_nome, comprador_email, comprador_cpf,
                           comprador_telefone, valor_total_centavos, status, pago_em)
      values (${evento.id}, ${c.nome}, ${para}, '', '', 0, 'pago', now())
      returning id
    `
    await tx`
      insert into pedido_itens (pedido_id, lote_id, quantidade, preco_unitario_centavos)
      values (${pedido.id}, ${lote.id}, ${c.qtd}, 0)
    `
    const ingressos: Emitido['ingressos'] = []
    for (let n = 0; n < c.qtd; n++) {
      const [ing] = await tx<{ id: string }[]>`
        insert into ingressos (pedido_id, evento_id, lote_id, tipo, titular_nome, titular_cpf, token_qr)
        values (${pedido.id}, ${evento.id}, ${lote.id}, 'meia', ${c.nome}, '', ${'temp-' + crypto.randomUUID()})
        returning id
      `
      const token = gerarTokenIngresso({ i: ing.id, e: evento.id, t: 'meia' })
      await tx`update ingressos set token_qr = ${token} where id = ${ing.id}`
      ingressos.push({ id: ing.id, tokenQr: token })
    }
    lista.push({ pedidoId: pedido.id, nome: c.nome, ingressos })
  }
  return lista
})

console.log(`✓ ${emitidos.length} convidado(s) gravados no banco.`)

// ---- e-mails ----------------------------------------------------------------
const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
}).format(new Date(evento.data_inicio))

for (const e of emitidos) {
  const link = linkDoIngresso(e.pedidoId, chaveLinkPedido(e.pedidoId))
  try {
    await enviarEmailConvite({
      para,
      convidado: e.nome,
      eventoNome: evento.nome,
      dataFormatada,
      local: evento.local_nome,
      endereco: evento.endereco,
      ingressos: e.ingressos.map((i) => ({
        id: i.id,
        tipo: 'meia' as const,
        titularNome: e.nome,
        tokenQr: i.tokenQr,
        convite: true,
      })),
      linkIngresso: link,
    })
    console.log(`  ✉ ${e.nome} (${e.ingressos.length}) — ${link}`)
  } catch (erro) {
    // O convite já vale; o link abre o QR mesmo sem o e-mail.
    console.error(`  ✗ e-mail de ${e.nome} falhou — o link vale assim mesmo: ${link}`, erro)
  }
}

await sql.end()
