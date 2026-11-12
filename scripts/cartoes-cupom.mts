// ============================================================================
//  CARTÕES DE CUPOM — tamanho cartão de visita, cara de convite secreto
//
//    npx tsx scripts/cartoes-cupom.mts
//    (opcional: --evento <slug>, padrão corujao-acido; --percentual 25)
//
//  Usa os cupons que já existem no banco para o evento (os gerados pelo
//  scripts/cupons.mts), na ordem em que foram criados, numerados "Nº 07 / 50".
//
//  Frente: breu com textura, moldura dourada dupla, número do cartão, o
//  código no centro, o QR à direita (abre a compra com o cupom aplicado) e a
//  linha dourada no rodapé. Verso: os olhos da coruja do cartaz.
//
//  Sai em cupons/:
//    cartoes-grafica.pdf  9 x 5 cm + 3 mm de sangria, frente e verso de cada
//                         cartão em sequência (100 páginas para 50 cartões)
//    cartoes-a4.pdf       10 por folha A4 com marca de corte; folha da frente
//                         e depois a do verso, espelhada para frente e verso
//                         virando pela borda maior
// ============================================================================

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import sharp from 'sharp'

for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
}
const { sql } = await import('../lib/db.ts')
const { DOMINIO_OFICIAL } = await import('../lib/url.ts')

const args = process.argv.slice(2)
const valor = (f: string) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined)
const slug = valor('--evento') ?? 'corujao-acido'
const percentual = Number(valor('--percentual') ?? 25)

const [evento] = await sql<{ id: number; nome: string; data_inicio: Date; local_nome: string; cartaz: string | null }[]>`
  select id::int as id, nome, data_inicio, local_nome, null as cartaz from eventos where slug = ${slug}
`
if (!evento) throw new Error(`Evento ${slug} não existe`)
const cupons = await sql<{ codigo: string }[]>`
  select codigo from cupons
   where evento_id = ${evento.id} and percentual = ${percentual}
   order by id
`
if (cupons.length === 0) throw new Error('Nenhum cupom para esse evento. Rode antes o scripts/cupons.mts.')
await sql.end()

// ---- medidas (pontos) ---------------------------------------------------------
const mm = (n: number) => (n * 72) / 25.4
const W = mm(90)
const H = mm(50)
const S = mm(3) // sangria
const PW = W + 2 * S
const PH = H + 2 * S

// ---- cores --------------------------------------------------------------------
const OURO = rgb(0.788, 0.635, 0.29) // #C9A24A
const OURO_CLARO = rgb(0.91, 0.78, 0.48) // #E8C77A
const PAPIRO = rgb(0.953, 0.925, 0.867) // #F3ECDD
const LILAS = rgb(0.725, 0.682, 0.796) // #B9AECB
const BREU = '#0A0610'

// ---- imagens de fundo (300 dpi) -------------------------------------------------
const px = (n: number) => Math.round((n / 72) * 300)
const [IW, IH] = [px(PW), px(PH)]

/** Frente: breu, um brilho violeta muito discreto atrás do QR e grão de película. */
async function fundoFrente() {
  const brilho = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">
    <defs>
      <radialGradient id="g" cx="78%" cy="45%" r="55%">
        <stop offset="0" stop-color="#2a1745" stop-opacity="0.85"/>
        <stop offset="1" stop-color="${BREU}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="v" cx="50%" cy="50%" r="75%">
        <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="${BREU}"/>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#v)"/>
  </svg>`)
  const ruido = Buffer.alloc(IW * IH)
  for (let i = 0; i < ruido.length; i++) ruido[i] = 128 + Math.round((Math.random() - 0.5) * 70)
  const grao = await sharp(ruido, { raw: { width: IW, height: IH, channels: 1 } })
    .png()
    .toBuffer()
  return sharp(brilho)
    .composite([{ input: grao, blend: 'soft-light' }])
    .jpeg({ quality: 92 })
    .toBuffer()
}

/** Verso: os olhos da coruja, escurecendo para baixo onde entra o texto. */
async function fundoVerso() {
  const recorte = await sharp('public/imagens/cartazes/corujao-cartaz.jpg')
    .extract({ left: 205, top: 560, width: 844, height: 492 })
    .resize(IW, IH, { fit: 'cover' })
    .modulate({ brightness: 0.92 })
    .toBuffer()
  const sombra = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${IW}" height="${IH}">
    <defs>
      <linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${BREU}" stop-opacity="0.45"/>
        <stop offset="0.3" stop-color="${BREU}" stop-opacity="0"/>
        <stop offset="0.55" stop-color="${BREU}" stop-opacity="0.15"/>
        <stop offset="0.72" stop-color="${BREU}" stop-opacity="0.85"/>
        <stop offset="1" stop-color="${BREU}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#b)"/>
  </svg>`)
  return sharp(recorte).composite([{ input: sombra }]).jpeg({ quality: 92 }).toBuffer()
}

// ---- PDF -------------------------------------------------------------------------
const doc = await PDFDocument.create()
doc.registerFontkit(fontkit)
// Fonte inteira, sem recorte: o recorte do fontkit perde letras da Inter.
const fonte = (f: string) => doc.embedFont(readFileSync(`scripts/fontes/${f}`), { subset: false })
const cinzel = await fonte('Cinzel-Bold.ttf')
const cinzelM = await fonte('Cinzel-Medium.ttf')
const playfair = await fonte('PlayfairDisplay-Italic.ttf')
const inter = await fonte('Inter-Regular.ttf')
const interSB = await fonte('Inter-SemiBold.ttf')
const imgFrente = await doc.embedJpg(await fundoFrente())
const imgVerso = await doc.embedJpg(await fundoVerso())

/** Texto com espaçamento entre letras (o pdf-lib não tem tracking). */
function espacado(
  p: PDFPage, t: string, x: number, y: number,
  o: { font: PDFFont; size: number; color: ReturnType<typeof rgb>; tracking: number; alinhar?: 'centro' | 'direita' }
) {
  const larg = [...t].reduce((s, c) => s + o.font.widthOfTextAtSize(c, o.size) + o.tracking, 0) - o.tracking
  let cx = o.alinhar === 'centro' ? x - larg / 2 : o.alinhar === 'direita' ? x - larg : x
  for (const c of t) {
    p.drawText(c, { x: cx, y, size: o.size, font: o.font, color: o.color })
    cx += o.font.widthOfTextAtSize(c, o.size) + o.tracking
  }
  return larg
}

/** Moldura dourada dupla, como as aberturas de filme de espionagem. */
function moldura(p: PDFPage) {
  const r = (ins: number, w: number, op = 1) =>
    p.drawRectangle({
      x: S + mm(ins), y: S + mm(ins), width: W - 2 * mm(ins), height: H - 2 * mm(ins),
      borderColor: OURO, borderWidth: w, opacity: 0, borderOpacity: op,
    })
  r(3.2, 0.7)
  r(4.2, 0.3, 0.7)
  // losangos nos cantos da moldura de fora
  for (const [cx, cy] of [[mm(3.2), mm(3.2)], [W - mm(3.2), mm(3.2)], [mm(3.2), H - mm(3.2)], [W - mm(3.2), H - mm(3.2)]]) {
    const d = mm(0.9)
    p.drawSvgPath(`M 0 ${-d} L ${d} 0 L 0 ${d} L ${-d} 0 Z`, { x: S + cx, y: S + cy, color: OURO })
  }
}

const dataEvento = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
  .format(new Date(evento.data_inicio))
  .replace('/', ' · ')

for (const [i, { codigo }] of cupons.entries()) {
  // ---------------- FRENTE ----------------
  const f = doc.addPage([PW, PH])
  f.setTrimBox(S, S, W, H)
  f.drawImage(imgFrente, { x: 0, y: 0, width: PW, height: PH })
  moldura(f)

  const esq = S + mm(8)
  espacado(f, 'ACESSO RESERVADO', esq, S + H - mm(10.2), { font: interSB, size: 4.6, color: OURO, tracking: 1.15 })
  f.drawText(`Nº ${String(i + 1).padStart(2, '0')} / ${cupons.length}`, {
    x: esq, y: S + H - mm(14.3), size: 6.6, font: playfair, color: LILAS,
  })

  // o código, centro do cartão
  espacado(f, codigo, esq, S + mm(22.4), { font: cinzel, size: 19, color: OURO_CLARO, tracking: 3.2 })
  f.drawText(`${percentual}% em um ingresso`, { x: esq, y: S + mm(17.6), size: 7.4, font: playfair, color: PAPIRO })

  // QR à direita, sobre papiro, com filete dourado
  const lado = mm(21)
  const qx = S + W - mm(8) - lado
  const qy = S + mm(15.2)
  const png = await QRCode.toBuffer(`${DOMINIO_OFICIAL}/eventos/${slug}?cupom=${codigo}#ingressos`, {
    errorCorrectionLevel: 'M', margin: 1, width: 420, color: { dark: '#0A0610', light: '#F3ECDD' },
  })
  const qr = await doc.embedPng(png)
  f.drawRectangle({ x: qx - mm(0.8), y: qy - mm(0.8), width: lado + mm(1.6), height: lado + mm(1.6), borderColor: OURO, borderWidth: 0.5, opacity: 0 })
  f.drawImage(qr, { x: qx, y: qy, width: lado, height: lado })
  espacado(f, 'APONTE A CÂMERA', qx + lado / 2, qy - mm(3.2), { font: inter, size: 3.6, color: LILAS, tracking: 0.7, alinhar: 'centro' })

  // a linha do rodapé
  const linhaY = S + mm(10.6)
  f.drawLine({ start: { x: esq, y: linhaY }, end: { x: S + W - mm(8), y: linhaY }, thickness: 0.4, color: OURO })
  espacado(f, 'GOLDEN EYE PRODS.', esq, linhaY - mm(3.3), { font: cinzelM, size: 5, color: OURO, tracking: 0.9 })
  espacado(f, 'GOLDENEYEPRODS.COM', S + W - mm(8), linhaY - mm(3.3), { font: inter, size: 4.2, color: LILAS, tracking: 0.8, alinhar: 'direita' })

  // ---------------- VERSO ----------------
  const v = doc.addPage([PW, PH])
  v.setTrimBox(S, S, W, H)
  v.drawImage(imgVerso, { x: 0, y: 0, width: PW, height: PH })
  moldura(v)
  const cx = S + W / 2
  espacado(v, evento.nome.toUpperCase(), cx, S + mm(13.4), { font: cinzel, size: 10.5, color: OURO_CLARO, tracking: 2.4, alinhar: 'centro' })
  v.drawText('A coruja viu você.', {
    x: cx - playfair.widthOfTextAtSize('A coruja viu você.', 7.6) / 2,
    y: S + mm(9.3), size: 7.6, font: playfair, color: PAPIRO,
  })
  espacado(v, `${dataEvento} · ${evento.local_nome.toUpperCase()} · JOINVILLE`, cx, S + mm(6.2), {
    font: inter, size: 4.2, color: LILAS, tracking: 1, alinhar: 'centro',
  })
}

mkdirSync('cupons', { recursive: true })
const grafica = await doc.save()
writeFileSync('cupons/cartoes-grafica.pdf', grafica)

// ---- A4: 10 por folha, frente e depois verso espelhado, com marcas de corte -----
const a4 = await PDFDocument.create()
const paginas = await a4.embedPdf(grafica, [...Array(cupons.length * 2).keys()])
const [AL, AA] = [mm(210), mm(297)]
const [col, lin] = [2, 5]
const x0 = (AL - col * PW) / 2
const y0 = (AA - lin * PH) / 2

function marcas(p: PDFPage) {
  const t = mm(4)
  const cinza = rgb(0.45, 0.45, 0.45)
  for (let c = 0; c < col; c++) {
    for (const xx of [x0 + c * PW + S, x0 + c * PW + S + W]) {
      p.drawLine({ start: { x: xx, y: y0 - t - mm(1) }, end: { x: xx, y: y0 - mm(1) }, thickness: 0.3, color: cinza })
      p.drawLine({ start: { x: xx, y: y0 + lin * PH + mm(1) }, end: { x: xx, y: y0 + lin * PH + t + mm(1) }, thickness: 0.3, color: cinza })
    }
  }
  for (let r = 0; r < lin; r++) {
    for (const yy of [y0 + r * PH + S, y0 + r * PH + S + H]) {
      p.drawLine({ start: { x: x0 - t - mm(1), y: yy }, end: { x: x0 - mm(1), y: yy }, thickness: 0.3, color: cinza })
      p.drawLine({ start: { x: x0 + col * PW + mm(1), y: yy }, end: { x: x0 + col * PW + t + mm(1), y: yy }, thickness: 0.3, color: cinza })
    }
  }
}

for (let ini = 0; ini < cupons.length; ini += col * lin) {
  const lote = [...Array(Math.min(col * lin, cupons.length - ini)).keys()].map((k) => ini + k)
  const frente = a4.addPage([AL, AA])
  const verso = a4.addPage([AL, AA])
  for (const [k, n] of lote.entries()) {
    const c = k % col
    const r = lin - 1 - Math.floor(k / col)
    frente.drawPage(paginas[n * 2], { x: x0 + c * PW, y: y0 + r * PH })
    // no verso a coluna troca de lado: a folha vira pela borda maior
    verso.drawPage(paginas[n * 2 + 1], { x: x0 + (col - 1 - c) * PW, y: y0 + r * PH })
  }
  marcas(frente)
  marcas(verso)
}
writeFileSync('cupons/cartoes-a4.pdf', await a4.save())

console.log(`✓ ${cupons.length} cartões`)
console.log('  cupons/cartoes-grafica.pdf  (9x5 cm + 3 mm de sangria, frente/verso em sequência)')
console.log('  cupons/cartoes-a4.pdf       (10 por folha, frente e verso espelhado)')
