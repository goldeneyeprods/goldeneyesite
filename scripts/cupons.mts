// ============================================================================
//  CUPONS DE DESCONTO — gera os códigos e o PDF dos cartões para imprimir
//
//    npx tsx scripts/cupons.mts --quantidade 50 --percentual 25
//    (opcional: --evento <slug>, padrão corujao-acido; --saida <pasta>,
//     padrão cupons/; --origem "texto" só para controle interno, não sai
//     no cartão)
//  Sai o PDF em duas versões com os mesmos códigos: escura (a da marca) e
//  clara (fundo branco, gasta menos tinta).
//
//  Cada código tem 6 caracteres sem letra ambígua (Y87TJ5), é único e vale
//  uma vez. O QR do cartão abre a página do evento com o cupom já preenchido.
//  Sai também um CSV com todos os códigos, para controle.
// ============================================================================

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { randomInt } from 'node:crypto'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'

for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
}

const { sql } = await import('../lib/db.ts')
const { ALFABETO_CUPOM, TAMANHO_CUPOM } = await import('../lib/cupons.ts')
const { DOMINIO_OFICIAL } = await import('../lib/url.ts')

// ---- argumentos --------------------------------------------------------------
const args = process.argv.slice(2)
const valor = (flag: string) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}
const quantidade = Number(valor('--quantidade') ?? 50)
const percentual = Number(valor('--percentual') ?? 25)
const origem = valor('--origem') ?? null
const slug = valor('--evento') ?? 'corujao-acido'
const pasta = valor('--saida') ?? 'cupons'

if (!(quantidade >= 1 && quantidade <= 500) || !(percentual >= 1 && percentual <= 100)) {
  console.error('Uso: npx tsx scripts/cupons.mts --quantidade 50 --percentual 25')
  process.exit(1)
}

const [evento] = await sql<
  { id: number; nome: string; data_inicio: Date; local_nome: string; abertura_portoes: Date }[]
>`select id::int as id, nome, data_inicio, local_nome, abertura_portoes from eventos where slug = ${slug}`
if (!evento) throw new Error(`Evento ${slug} não existe`)

// ---- códigos -----------------------------------------------------------------
function novoCodigo() {
  let c = ''
  for (let i = 0; i < TAMANHO_CUPOM; i++) c += ALFABETO_CUPOM[randomInt(ALFABETO_CUPOM.length)]
  return c
}

const codigos: string[] = []
// Insere um a um: se algum código já existir (chance mínima), sorteia outro.
while (codigos.length < quantidade) {
  const codigo = novoCodigo()
  const [ok] = await sql`
    insert into cupons (codigo, evento_id, percentual, origem, valido_ate)
    values (${codigo}, ${evento.id}, ${percentual}, ${origem}, ${evento.abertura_portoes})
    on conflict (codigo) do nothing
    returning id
  `
  if (ok) codigos.push(codigo)
}
console.log(`✓ ${codigos.length} cupons de ${percentual}% gravados para ${evento.nome}.`)

// ---- PDF: 10 cartões por folha A4, com linha de corte --------------------------
const fmt = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...o }).format(
    new Date(evento.data_inicio)
  )
const dataCurta = fmt({ day: '2-digit', month: '2-digit' })

async function gerarPdf(claro: boolean) {
const pdf = await PDFDocument.create()
const titulo = await pdf.embedFont(StandardFonts.TimesRomanBold)
const texto = await pdf.embedFont(StandardFonts.Helvetica)
const negrito = await pdf.embedFont(StandardFonts.HelveticaBold)
const mono = await pdf.embedFont(StandardFonts.CourierBold)

const ouro = rgb(0.79, 0.64, 0.29)
const fundo = claro ? rgb(1, 1, 1) : rgb(0.04, 0.024, 0.063)
const principal = claro ? rgb(0.1, 0.07, 0.12) : rgb(0.95, 0.93, 0.87)
const suave = claro ? rgb(0.4, 0.36, 0.45) : rgb(0.73, 0.68, 0.8)

const [L, A] = [595.28, 841.89]
const margem = 22
const [colunas, linhas] = [2, 5]
const [w, h] = [(L - margem * 2) / colunas, (A - margem * 2) / linhas]

for (let p = 0; p * colunas * linhas < codigos.length; p++) {
  const pagina = pdf.addPage([L, A])
  const daPagina = codigos.slice(p * colunas * linhas, (p + 1) * colunas * linhas)

  for (const [n, codigo] of daPagina.entries()) {
    const x = margem + (n % colunas) * w
    const y = A - margem - (Math.floor(n / colunas) + 1) * h

    pagina.drawRectangle({ x, y, width: w, height: h, color: fundo })
    // linha de corte tracejada
    pagina.drawRectangle({
      x, y, width: w, height: h,
      borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5, borderDashArray: [3, 3],
    })
    // moldura dourada fina por dentro
    pagina.drawRectangle({
      x: x + 8, y: y + 8, width: w - 16, height: h - 16,
      borderColor: ouro, borderWidth: 0.8,
    })

    const ex = x + 20
    pagina.drawText('GOLDEN EYE PRODS.', { x: ex, y: y + h - 32, size: 7.5, font: negrito, color: ouro })
    pagina.drawText(`${percentual}% OFF`, { x: ex, y: y + h - 64, size: 28, font: titulo, color: principal })
    pagina.drawText('em 1 ingresso do', { x: ex, y: y + h - 80, size: 8.5, font: texto, color: suave })
    pagina.drawText(evento.nome.toUpperCase(), { x: ex, y: y + h - 96, size: 13, font: titulo, color: ouro })
    pagina.drawText(`${dataCurta} · ${evento.local_nome} · Joinville`, {
      x: ex, y: y + h - 109, size: 7.5, font: texto, color: suave,
    })
    pagina.drawText(codigo, { x: ex, y: y + 30, size: 20, font: mono, color: principal })
    pagina.drawText('Uso único · goldeneyeprods.com', { x: ex, y: y + 18, size: 6.5, font: texto, color: suave })

    // QR: abre a compra com o cupom já aplicado
    const link = `${DOMINIO_OFICIAL}/eventos/${slug}?cupom=${codigo}#ingressos`
    const png = await QRCode.toBuffer(link, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
      color: { dark: '#0B0710', light: '#FFFFFF' },
    })
    const qr = await pdf.embedPng(png)
    const lado = 86
    pagina.drawRectangle({ x: x + w - lado - 26, y: y + (h - lado) / 2 - 4, width: lado + 8, height: lado + 8, color: rgb(1, 1, 1) })
    pagina.drawImage(qr, { x: x + w - lado - 22, y: y + (h - lado) / 2, width: lado, height: lado })
  }
}

return pdf.save()
}

mkdirSync(pasta, { recursive: true })
const sufixo = origem
  ? '-' + origem.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  : ''
const nome = `${slug}-cupons-${percentual}off${sufixo}`
writeFileSync(`${pasta}/${nome}-escuro.pdf`, await gerarPdf(false))
writeFileSync(`${pasta}/${nome}-claro.pdf`, await gerarPdf(true))
writeFileSync(
  `${pasta}/${nome}.csv`,
  'codigo;percentual;evento;origem;link\n' +
    codigos
      .map((c) => `${c};${percentual};${evento.nome};${origem ?? ''};${DOMINIO_OFICIAL}/eventos/${slug}?cupom=${c}`)
      .join('\n')
)
console.log(`✓ PDFs para imprimir: ${pasta}/${nome}-escuro.pdf e -claro.pdf`)
console.log(`✓ Lista: ${pasta}/${nome}.csv`)
await sql.end()
