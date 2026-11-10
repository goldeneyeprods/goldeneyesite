'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ============================================================================
//  BARRA DE COMPRA FIXA (celular)
//  Aparece quando o ingresso do hero sai da tela, para a compra estar sempre
//  a um toque. No desktop o ingresso do hero já resolve.
// ============================================================================

export function BarraCompra({
  nome,
  quando,
  href,
  rotulo,
}: {
  nome: string
  quando: string
  href: string
  rotulo: string
}) {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const alvo = document.getElementById('proximo-evento')
    if (!alvo) return
    const obs = new IntersectionObserver(
      ([e]) => setVisivel(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 }
    )
    obs.observe(alvo)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      className={`sem-impressao fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-noite/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 md:hidden ${
        visivel ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!visivel}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-texto">{nome}</p>
          <p className="cinema truncate text-sm text-ouro-claro">{quando}</p>
        </div>
        <Link href={href} className="botao-ouro shrink-0 !px-5 !py-3 !text-sm" tabIndex={visivel ? 0 : -1}>
          {rotulo}
        </Link>
      </div>
    </div>
  )
}
