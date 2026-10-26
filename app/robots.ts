import type { MetadataRoute } from 'next'
import { urlDoSite } from '@/lib/url'

// ============================================================================
//  /robots.txt
//
//  Bloqueia o que não deve aparecer na busca: a área do comprador (que tem
//  dado pessoal), o app de portaria e as rotas de API. O resto é livre.
// ============================================================================

export default function robots(): MetadataRoute.Robots {
  const base = urlDoSite()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/portaria', '/portaria/', '/meus-ingressos'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
