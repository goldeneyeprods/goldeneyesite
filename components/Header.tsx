'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OlhoDeHorus } from './OlhoDeHorus'

// ============================================================================
//  HEADER
//  O menu é o mesmo em todas as páginas, para ninguém se perder. Fundo
//  sempre sólido: nada de menu transparente passando por cima do texto.
//  O botão da direita é contorno — o dourado cheio fica para a compra.
// ============================================================================

const MENU = [
  { href: '/#agenda', rotulo: 'Agenda' },
  { href: '/#universos', rotulo: 'Festivais' },
  { href: '/bandas', rotulo: 'Bandas' },
  { href: '/#arquivo', rotulo: 'Arquivo' },
  { href: '/#quem-faz', rotulo: 'Quem faz' },
]

/** Símbolo pequeno + o nome: a logo completa fica para usos grandes. */
function Assinatura() {
  return (
    <span className="flex items-center gap-3">
      <OlhoDeHorus tamanho={46} brilho={false} prioridade />
      <span className="font-display text-[15px] font-bold tracking-[0.04em] text-texto sm:text-base">
        Golden Eye <span className="text-ouro">Prods.</span>
      </span>
    </span>
  )
}

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
        className={`sem-impressao fixed inset-x-0 top-0 z-50 border-b bg-noite/92 backdrop-blur-xl transition-colors duration-300 ${
          rolou ? 'border-borda' : 'border-borda/40'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          {/* A marca SEMPRE leva para a home da produtora */}
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Golden Eye Prods. — início">
              <Assinatura />
            </Link>
          </div>

          <ul className="hidden items-center gap-7 lg:flex">
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
              <a href={cta.href} className="botao-fantasma hidden !px-5 !py-2 !text-sm md:inline-flex">
                {cta.rotulo}
              </a>
            )}

            <button
              onClick={() => setAberto(true)}
              className="rounded-xl border border-borda p-2.5 text-ouro lg:hidden"
              aria-label="Abrir menu"
              aria-expanded={aberto}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h12M4 17h8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Menu mobile em tela cheia */}
      {aberto && (
        <div className="fixed inset-0 z-[70] bg-noite/98 backdrop-blur-2xl lg:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <Assinatura />
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
