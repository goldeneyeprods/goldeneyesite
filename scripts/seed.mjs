// ============================================================================
//  npm run db:seed
//
//  Cadastra TODOS os eventos do config/site.ts, com seus lotes, e os
//  operadores de portaria. Rodar de novo é seguro: só atualiza o que mudou,
//  e nunca mexe em quantidade já vendida.
//
//  Roda com --experimental-strip-types (ver package.json), então consegue
//  importar o config/site.ts direto — sem duplicar os dados em outro lugar.
// ============================================================================

import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'

import { eventos } from '../config/site.ts'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

// Carrega o .env.local sem depender de pacote externo
try {
  const env = readFileSync(join(raiz, '.env.local'), 'utf8')
  for (const linha of env.split('\n')) {
    const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  console.error('⚠  .env.local não encontrado. Copie o .env.example primeiro.')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('⚠  DATABASE_URL não configurada no .env.local')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false })

// ---- Trava da Lei 12.933/13, evento por evento ------------------------------
// Falha ANTES de escrever qualquer coisa: melhor não cadastrar nada do que
// deixar metade dos eventos fora da lei. A conta é por fase, porque a meia e
// a inteira de uma fase dividem a mesma quantidade: o que vale é quanto da
// fase pode ser vendido como meia.
for (const ev of eventos) {
  if (ev.lotes.length === 0) continue

  const fases = new Map()
  for (const l of ev.lotes) {
    const f = fases.get(l.fase) ?? { total: 0, meia: 0 }
    f.total = Math.max(f.total, l.quantidade)
    if (l.tipo === 'meia') f.meia += l.quantidade
    fases.set(l.fase, f)
  }
  const total = [...fases.values()].reduce((s, f) => s + f.total, 0)
  const meia = [...fases.values()].reduce((s, f) => s + Math.min(f.meia, f.total), 0)
  const pct = (meia / total) * 100

  if (pct < 40) {
    console.error(
      `
⚠  "${ev.nome}" tem só ${pct.toFixed(1)}% de meia-entrada ` +
        `(${meia} de ${total}).
` +
        `   A Lei 12.933/2013 exige no mínimo 40%.
` +
        `   Ajuste as quantidades em config/site.ts e rode de novo.
`
    )
    process.exit(1)
  }
  for (const l of ev.lotes.filter((l) => l.tipo === 'inteira')) {
    const meiaDaFase = ev.lotes.find((m) => m.tipo === 'meia' && m.fase === l.fase)
    // A entrada solidária é inteira + doação: a regra vale sem a doação.
    const semDoacao = l.precoCentavos - (l.doacaoCentavos ?? 0)
    if (meiaDaFase && Math.abs(meiaDaFase.precoCentavos * 2 - semDoacao) > 1) {
      console.error(`
⚠  "${l.nome}": a meia tem que ser metade da inteira.
`)
      process.exit(1)
    }
  }
  console.log(
    `✓ ${ev.nome}: meia-entrada em todos os lotes, limitada na venda a 40% de ` +
      `cada lote (lib/lotes.ts) — dentro da lei`
  )
}

// ---- Eventos e lotes --------------------------------------------------------
const idsPorSlug = new Map()

for (const ev of eventos) {
  const [linha] = await sql`
    insert into eventos (
      slug, nome, subtitulo, descricao, data_inicio, abertura_portoes,
      local_nome, endereco, mapa_url, classificacao_etaria, capacidade,
      imagem_hero, ingressos_a_venda, meia_solidaria, ativo
    ) values (
      ${ev.slug}, ${ev.nome}, ${ev.subtitulo}, ${ev.descricao},
      ${ev.dataInicio}, ${ev.aberturaPortoes}, ${ev.local},
      ${ev.endereco}, ${ev.mapaLink}, ${ev.classificacaoEtaria},
      ${ev.capacidade}, ${ev.imagemHero ?? ev.cartaz ?? null},
      ${ev.ingressosAVenda ?? null}, ${ev.meiaSolidaria ?? false}, true
    )
    on conflict (slug) do update set
      nome              = excluded.nome,
      subtitulo         = excluded.subtitulo,
      descricao         = excluded.descricao,
      data_inicio       = excluded.data_inicio,
      abertura_portoes  = excluded.abertura_portoes,
      local_nome        = excluded.local_nome,
      endereco          = excluded.endereco,
      mapa_url          = excluded.mapa_url,
      classificacao_etaria = excluded.classificacao_etaria,
      capacidade        = excluded.capacidade,
      imagem_hero       = excluded.imagem_hero,
      ingressos_a_venda = excluded.ingressos_a_venda,
      meia_solidaria    = excluded.meia_solidaria
    returning id, nome
  `
  idsPorSlug.set(ev.slug, linha.id)
  console.log(`\n→ Evento: ${linha.nome}  (/eventos/${ev.slug})`)

  for (const lote of ev.lotes) {
    const [existente] = await sql`
      select id, quantidade_vendida from lotes
       where evento_id = ${linha.id} and nome = ${lote.nome}
    `

    if (existente) {
      // Nunca mexemos em quantidade_vendida — isso apagaria vendas reais.
      if (lote.quantidade < existente.quantidade_vendida) {
        console.log(
          `  ⚠ "${lote.nome}": já foram vendidos ${existente.quantidade_vendida}, ` +
            `não dá para reduzir o total para ${lote.quantidade}. Mantido.`
        )
        continue
      }
      await sql`
        update lotes
           set preco_centavos   = ${lote.precoCentavos},
               quantidade_total = ${lote.quantidade},
               ordem            = ${lote.ordem},
               fase             = ${lote.fase},
               valido_ate       = ${lote.validoAte ?? null},
               doacao_centavos  = ${lote.doacaoCentavos ?? 0}
         where id = ${existente.id}
      `
      console.log(`  ↻ ${lote.nome}`)
    } else {
      await sql`
        insert into lotes (evento_id, nome, tipo, preco_centavos, quantidade_total,
                           ordem, fase, valido_ate, doacao_centavos, ativo)
        values (${linha.id}, ${lote.nome}, ${lote.tipo}, ${lote.precoCentavos},
                ${lote.quantidade}, ${lote.ordem}, ${lote.fase},
                ${lote.validoAte ?? null}, ${lote.doacaoCentavos ?? 0}, true)
      `
      console.log(`  + ${lote.nome}`)
    }
  }
}

// ---- Lotes que saíram do config ---------------------------------------------
// Lote renomeado ou removido no config/site.ts sai de venda (ativo = false).
// Não apagamos: pode ter venda ligada a ele, e o histórico precisa ficar.
for (const ev of eventos) {
  const eventoId = idsPorSlug.get(ev.slug)
  const nomes = ev.lotes.map((l) => l.nome)
  const desativados = await sql`
    update lotes set ativo = false
     where evento_id = ${eventoId} and ativo = true
       and not (nome = any(${sql.array(nomes)}::text[]))
    returning nome, quantidade_vendida
  `
  for (const d of desativados) {
    console.log(`  − ${d.nome} saiu de venda (${d.quantidade_vendida} vendido(s) mantido(s))`)
  }
}

// ---- Operadores da portaria -------------------------------------------------
// Só perguntamos para eventos que ainda vão acontecer e que vendem ingresso.
const futuros = eventos.filter(
  (e) => new Date(e.dataInicio) > new Date() && e.lotes.length > 0
)

for (const ev of futuros) {
  const eventoId = idsPorSlug.get(ev.slug)
  const [jaTem] = await sql`
    select count(*)::int as n from operadores where evento_id = ${eventoId}
  `

  if (jaTem.n > 0) {
    console.log(`\n✓ "${ev.nome}": ${jaTem.n} operador(es) já cadastrado(s).`)
    continue
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  console.log(`\n--- Operadores da portaria — ${ev.nome} ---`)
  console.log('Cada pessoa da portaria entra com o próprio nome e PIN.')
  console.log('Deixe o nome em branco para pular.\n')

  let n = 0
  for (;;) {
    const nome = (await rl.question('Nome do operador: ')).trim()
    if (!nome) break

    const pin = (await rl.question('PIN (4 a 8 dígitos): ')).trim()
    if (!/^\d{4,8}$/.test(pin)) {
      console.log('  ⚠ PIN inválido, tente de novo.\n')
      continue
    }

    const gate =
      (await rl.question('Portão [Portão Principal]: ')).trim() || 'Portão Principal'

    await sql`
      insert into operadores (evento_id, nome, pin_hash, gate, ativo)
      values (${eventoId}, ${nome}, ${bcrypt.hashSync(pin, 10)}, ${gate}, true)
    `
    console.log(`  ✓ ${nome} cadastrado\n`)
    n++
  }
  await rl.close()
  console.log(`✓ ${n} operador(es) cadastrado(s) para "${ev.nome}".`)
}

console.log('\n✓ Tudo pronto. Rode: npm run dev')
await sql.end()
