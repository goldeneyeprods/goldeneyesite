import type { MetadataRoute } from 'next'

// ============================================================================
//  /robots.txt
//
//  Bloqueia o que não deve aparecer na busca: a área do comprador (que tem
//  dado pessoal), o app de portaria e as rotas de API. O resto é livre.
// ============================================================================

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/portaria', '/portaria/', '/meus-ingressos'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
