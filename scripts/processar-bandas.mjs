// ============================================================================
//  node scripts/processar-bandas.mjs
//
//  Pega as fotos originais em arquivosbandas/ e gera as versões do site em
//  public/imagens/bandas/. As de imprensa costumam vir em 5800px e 10 MB —
//  peso que ninguém precisa carregar num celular.
//
//  Rode de novo sempre que adicionar fotos novas de alguma banda.
// ============================================================================

import sharp from 'sharp'
import { readdirSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { join, extname, basename } from 'node:path'

const ORIGEM = 'arquivosbandas'
const DESTINO = 'public/imagens/bandas'

const EXTENSOES = ['.jpg', '.jpeg', '.png']
const kb = (f) => Math.round(statSync(f).size / 1024)

if (!existsSync(ORIGEM)) {
  console.error(`Pasta "${ORIGEM}" não encontrada.`)
  process.exit(1)
}

const bandas = readdirSync(ORIGEM, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

for (const banda of bandas) {
  const entrada = join(ORIGEM, banda)
  const saida = join(DESTINO, banda)
  mkdirSync(saida, { recursive: true })

  const arquivos = readdirSync(entrada)
    .filter((f) => EXTENSOES.includes(extname(f).toLowerCase()))
    .sort()

  console.log(`\n${banda}  (${arquivos.length} imagens)`)

  for (const arq of arquivos) {
    const nome = basename(arq, extname(arq))
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const origem = join(entrada, arq)
    const ehLogo = nome.includes('logo')

    if (ehLogo) {
      // Logo: preserva transparência e mantém tamanho modesto
      const destino = join(saida, 'logo.png')
      await sharp(origem)
        .resize({ width: 800, withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toFile(destino)
      console.log(`  logo.png                 ${kb(destino)} KB`)
      continue
    }

    // Foto: 1800px é mais que suficiente para tela cheia em retina,
    // e o next/image ainda reduz de novo conforme o dispositivo.
    const destino = join(saida, `${nome}.jpg`)
    await sharp(origem)
      .rotate() // respeita a orientação da câmera
      .resize({ width: 1800, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(destino)
    console.log(`  ${`${nome}.jpg`.padEnd(24)} ${kb(destino)} KB`)
  }
}

console.log('\n✓ Pronto. As fotos originais continuam intactas em arquivosbandas/.')
