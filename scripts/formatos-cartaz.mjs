// ============================================================================
//  node scripts/formatos-cartaz.mjs
//
//  Gera os formatos do cartaz a partir do original.
//
//  O cartaz é 2:3 (1024x1536), mais alto que o feed do Instagram aceita.
//  Cortar altura significaria perder a logo em cima ou o endereço embaixo,
//  então em vez de cortar a gente ALARGA: o fundo ganha faixas laterais
//  feitas com uma cópia ampliada e desfocada do próprio cartaz. A arte
//  aparece inteira e as bordas não ficam com cara de moldura branca.
// ============================================================================

import sharp from 'sharp'
import { statSync, existsSync } from 'node:fs'

// Cheguei a trocar o olho do topo pela logo original, mas a substituição
// brigava com o texto logo abaixo — a arte inteira é desenhada à mão, e um
// vetor colado no meio dela nunca assenta. Fica o desenho original.
// A tentativa está em scripts/trocar-logo-cartaz.py, se um dia servir.
const ORIGEM = '_originais/cartaz-final/tropicalia-original.jpeg'

const DESTINO = 'public/imagens/cartazes'
const kb = (f) => Math.round(statSync(f).size / 1024)

const FORMATOS = [
  // O mais alto que o feed do Instagram aceita hoje
  { nome: 'tropicalia-feed-4x5', larg: 1080, alt: 1350, uso: 'feed 4:5' },
  { nome: 'tropicalia-feed-3x4', larg: 1080, alt: 1440, uso: 'feed 3:4' },
  { nome: 'tropicalia-story', larg: 1080, alt: 1920, uso: 'story 9:16' },
]

async function gerar({ nome, larg, alt, uso }) {
  // 1. o cartaz inteiro, encaixado dentro do quadro
  const arte = await sharp(ORIGEM)
    .resize({ width: larg, height: alt, fit: 'inside', withoutEnlargement: false })
    .toBuffer()
  const m = await sharp(arte).metadata()

  // 2. fundo: o próprio cartaz ampliado e desfocado, para as laterais
  //    continuarem a paleta em vez de virarem barra chapada
  const fundo = await sharp(ORIGEM)
    .resize({ width: larg, height: alt, fit: 'cover', position: 'centre' })
    .blur(42)
    .modulate({ brightness: 0.62, saturation: 1.15 })
    .toBuffer()

  const destino = `${DESTINO}/${nome}.jpg`
  await sharp(fundo)
    .composite([
      {
        input: arte,
        left: Math.round((larg - m.width) / 2),
        top: Math.round((alt - m.height) / 2),
      },
    ])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(destino)

  console.log(`${nome}.jpg`.padEnd(28) + `${larg}x${alt}  ${kb(destino)} KB  (${uso})`)
}

// A arte inteira, sem faixa, para imprimir e para a página do site
async function original() {
  const destino = `${DESTINO}/tropicalia-cartaz.jpg`
  await sharp(ORIGEM).resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 92, mozjpeg: true }).toFile(destino)
  console.log('tropicalia-cartaz.jpg'.padEnd(28) + `1024x1536  ${kb(destino)} KB  (site e impressão)`)
}

// Recorte 1200x630 do miolo, para a prévia do link
async function previa() {
  const buf = await sharp(ORIGEM).resize({ width: 1600 }).toBuffer()
  const m = await sharp(buf).metadata()
  const destino = `${DESTINO}/tropicalia-og.jpg`
  await sharp(buf)
    .extract({ left: 0, top: Math.round(m.height * 0.18), width: 1600, height: Math.round(1600 / 1.905) })
    .resize(1200, 630)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(destino)
  console.log('tropicalia-og.jpg'.padEnd(28) + `1200x630  ${kb(destino)} KB  (prévia do link)`)
}

console.log(`origem: ${ORIGEM}\n`)
await original()
await previa()
for (const f of FORMATOS) await gerar(f)
