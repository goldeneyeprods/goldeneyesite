import type { Metadata } from 'next'

// A página é de cliente (não exporta metadata); o título da aba vem daqui.
export const metadata: Metadata = {
  title: 'Meus ingressos',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
