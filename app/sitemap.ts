import type { MetadataRoute } from 'next'
import { eventos, ehFuturo } from '@/config/site'

// ============================================================================
//  /sitemap.xml — gerado sozinho a partir do config
//
//  Cada evento novo que você cadastrar entra aqui automaticamente. É o que
//  faz o Google achar as LPs sem depender de alguém linkar de fora.
// ============================================================================

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const paginas: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/eventos`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/termos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/privacidade`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  for (const e of eventos) {
    paginas.push({
      url: `${base}/eventos/${e.slug}`,
      lastModified: new Date(e.dataInicio),
      // Evento que ainda vai acontecer muda de estoque e preço: vale revisitar
      // com frequência. Edição passada é conteúdo estável.
      changeFrequency: ehFuturo(e) ? 'daily' : 'monthly',
      priority: ehFuturo(e) ? 0.95 : 0.6,
    })
  }

  return paginas
}
