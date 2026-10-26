// ============================================================================
//  Endereço público do site
//
//  Vem de NEXT_PUBLIC_SITE_URL, mas não confia cegamente nela: em produção,
//  se ela faltar ou apontar para localhost (já aconteceu, ao importar o
//  .env.local na Netlify), o Mercado Pago recusa o endereço de aviso e
//  NENHUM PIX é gerado. Nesse caso cai no domínio real.
//  No `npm run dev` vale o que estiver no .env.local, inclusive localhost.
// ============================================================================

export const DOMINIO_OFICIAL = 'https://goldeneyeprods.com'

export function urlDoSite(): string {
  const valor = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '')
  const local = !valor || /localhost|127\.0\.0\.1/.test(valor)
  if (process.env.NODE_ENV === 'development') return valor || 'http://localhost:3000'
  if (!local && /^https?:\/\//.test(valor)) return valor
  return (process.env.URL ?? DOMINIO_OFICIAL).replace(/\/+$/, '')
}
