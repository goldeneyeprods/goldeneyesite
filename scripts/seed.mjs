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
// deixar metade dos eventos fora da lei.
for (const ev of eventos) {
  if (ev.lotes.length === 0) continue

  const total = ev.lotes.reduce((s, l) => s + l.quantidade, 0)
  const meia = ev.lotes
    .filter((l) => l.tipo === 'meia')
    .reduce((s, l) => s + l.quantidade, 0)
  const pct = (meia / total) * 100

  if (pct < 40) {
    console.error(
      `\n⚠  "${ev.nome}" tem só ${pct.toFixed(1)}% de meia-entrada ` +
        `(${meia} de ${total}).\n` +
        `   A Lei 12.933/2013 exige no mínimo 40%.\n` +
        `   Ajuste as quantidades em config/site.ts e rode de novo.\n`
    )
    process.exit(1)
  }
  console.log(`✓ ${ev.nome}: ${pct.toFixed(1)}% de meia-entrada — dentro da lei`)
}

// ---- Eventos e lotes --------------------------------------------------------
const idsPorSlug = new Map()

for (const ev of eventos) {
  const [linha] = await sql`
    insert into eventos (
      slug, nome, subtitulo, descricao, data_inicio, abertura_portoes,
      local_nome, endereco, mapa_url, classificacao_etaria, capacidade,
      imagem_hero, ativo
    ) values (
      ${ev.slug}, ${ev.nome}, ${ev.subtitulo}, ${ev.descricao},
      ${ev.dataInicio}, ${ev.aberturaPortoes}, ${ev.local},
      ${ev.endereco}, ${ev.mapaLink}, ${ev.classificacaoEtaria},
      ${ev.capacidade}, ${ev.imagemHero ?? ev.cartaz ?? null}, true
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
      imagem_hero       = excluded.imagem_hero
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
               ordem            = ${lote.ordem}
         where id = ${existente.id}
      `
      console.log(`  ↻ ${lote.nome}`)
    } else {
      await sql`
        insert into lotes (evento_id, nome, tipo, preco_centavos, quantidade_total, ordem, ativo)
        values (${linha.id}, ${lote.nome}, ${lote.tipo}, ${lote.precoCentavos},
                ${lote.quantidade}, ${lote.ordem}, true)
      `
      console.log(`  + ${lote.nome}`)
    }
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
