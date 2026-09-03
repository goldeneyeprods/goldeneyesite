import type { Metadata, Viewport } from 'next'
import { Cinzel, Inter } from 'next/font/google'
import { produtora } from '@/config/site'
import './globals.css'

// Cinzel: serifa romana/egípcia — casa com o ouro do olho de Hórus do logo.
const display = Cinzel({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  variable: '--fonte-display',
  display: 'swap',
})

// Inter: legibilidade em corpo pequeno, no celular, no escuro.
const sans = Inter({
  subsets: ['latin'],
  variable: '--fonte-sans',
  display: 'swap',
})

const url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// O título padrão é o da PRODUTORA. Cada evento sobrescreve com o próprio
// nome pelo template — ex.: "TO THE OTHER SIDE — Golden Eye Prods."
export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: `${produtora.nome} — ${produtora.tagline}`,
    template: `%s — ${produtora.nome}`,
  },
  description: produtora.descricao,
  keywords: [
    'Golden Eye Prods',
    `produtora de eventos ${produtora.cidade}`,
    `rock psicodélico ${produtora.cidade}`,
    `shows em ${produtora.cidade}`,
    `eventos ${produtora.cidade} ${produtora.estado}`,
    'ingressos',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: produtora.nome,
    title: produtora.nome,
    description: produtora.manifesto,
    // A arte do olho no beco. Troque por um cartaz 1200x630 se quiser.
    images: ['/imagens/og.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: produtora.nome,
    description: produtora.manifesto,
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0a0610',
  width: 'device-width',
  initialScale: 1,
  // permite o pinch-zoom: travar zoom quebra acessibilidade
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="grao">
        {/* Atalho para quem navega por teclado */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ouro focus:px-4 focus:py-2 focus:font-bold focus:text-noite"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  )
}
