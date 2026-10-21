'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Marca } from './OlhoDeHorus'

// ============================================================================
//  HEADER
//  O menu é o mesmo em todas as páginas, para ninguém se perder. Só o botão
//  dourado da direita muda conforme a página (ingressos, contratar…).
// ============================================================================

const MENU = [
  { href: '/#agenda', rotulo: 'Agenda' },
  { href: '/eventos', rotulo: 'Eventos' },
  { href: '/bandas', rotulo: 'Bandas' },
  { href: '/#registros', rotulo: 'Registros' },
  { href: '/#sobre', rotulo: 'A produtora' },
  { href: '/#faq', rotulo: 'Dúvidas' },
]

export function Header({
  cta,
}: {
  /** botão dourado da direita */
  cta?: { href: string; rotulo: string }
}) {
  const pathname = usePathname()
  // marca a seção em que a pessoa está (/eventos/… e /bandas/…)
  const ativo = (href: string) =>
    !href.includes('#') && (pathname === href || pathname.startsWith(href + '/'))
  const links = MENU
  const [rolou, setRolou] = useState(false)
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [aberto])

  return (
    <>
      <header
        className={`sem-impressao fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          rolou
            ? 'border-b border-borda bg-noite/85 backdrop-blur-xl'
            : 'border-b border-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          {/* A marca SEMPRE leva para a home da produtora */}
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Golden Eye Prods. — início">
              <Marca compacta />
            </Link>
          </div>

          <ul className="hidden items-center gap-8 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-current={ativo(l.href) ? 'page' : undefined}
                  className={`text-sm transition-colors hover:text-ouro-claro ${
                    ativo(l.href) ? 'text-ouro' : 'text-texto-suave'
                  }`}
                >
                  {l.rotulo}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="/meus-ingressos"
              className="hidden text-sm text-texto-suave transition-colors hover:text-ouro-claro sm:block"
            >
              Meus ingressos
            </Link>
            {cta && (
              <a href={cta.href} className="botao-ouro hidden !px-6 !py-2.5 !text-sm md:inline-flex">
                {cta.rotulo}
              </a>
            )}

            <button
              onClick={() => setAberto(true)}
              className="p-2 text-texto lg:hidden"
              aria-label="Abrir menu"
              aria-expanded={aberto}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Menu mobile em tela cheia */}
      {aberto && (
        <div className="fixed inset-0 z-[70] bg-noite/98 backdrop-blur-2xl lg:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <Marca compacta />
            <button onClick={() => setAberto(false)} className="p-2 text-texto" aria-label="Fechar menu">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <ul className="mt-8 flex flex-col gap-1 px-5">
            {links.map((l, i) => (
              <li key={l.href} className="surgir" style={{ animationDelay: `${i * 55}ms` }}>
                <a
                  href={l.href}
                  onClick={() => setAberto(false)}
                  className="block border-b border-borda/60 py-5 font-display text-2xl tracking-wide text-texto transition-colors hover:text-ouro"
                >
                  {l.rotulo}
                </a>
              </li>
            ))}
            <li className="surgir" style={{ animationDelay: `${links.length * 55}ms` }}>
              <Link
                href="/meus-ingressos"
                onClick={() => setAberto(false)}
                className="block border-b border-borda/60 py-5 font-display text-2xl tracking-wide text-texto transition-colors hover:text-ouro"
              >
                Meus ingressos
              </Link>
            </li>
          </ul>

          {cta && (
            <div className="px-5 pt-10">
              <a href={cta.href} onClick={() => setAberto(false)} className="botao-ouro w-full">
                {cta.rotulo}
              </a>
            </div>
          )}
        </div>
      )}
    </>
  )
}
