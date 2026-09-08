'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Ornamento } from './OlhoDeHorus'

// ============================================================================
//  CARTAZ DO EVENTO
//
//  Mostra a arte em tamanho de leitura e abre em tela cheia no clique.
//  Cartaz é a peça que circula no WhatsApp e no Instagram — quem chega pelo
//  site espera reencontrar a mesma imagem que viu por lá.
// ============================================================================

export function CartazEvento({
  src,
  evento,
  creditos,
}: {
  src: string
  evento: string
  /** quem assina a arte */
  creditos?: string
}) {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [aberto])

  return (
    <section id="cartaz" className="relative px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="rotulo">Cola na parede</p>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Cartaz</h2>
        </div>

        <Ornamento className="my-12" />

        <button
          onClick={() => setAberto(true)}
          className="group relative mx-auto block w-full max-w-[460px] overflow-hidden rounded-2xl border border-borda transition-all duration-300 hover:border-ouro/60"
          aria-label="Ampliar o cartaz"
        >
          <Image
            src={src}
            alt={`Cartaz de ${evento}`}
            width={1024}
            height={1536}
            sizes="(max-width: 640px) 92vw, 460px"
            priority
            className="h-auto w-full"
          />
          <span className="pointer-events-none absolute inset-0 bg-noite/0 transition-colors group-hover:bg-noite/15" />
        </button>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={() => setAberto(true)} className="botao-fantasma !py-3 !text-sm">
            Ver em tela cheia
          </button>
          {/* download direto: quem quer imprimir ou repostar não precisa
              pedir o arquivo por mensagem */}
          <a href={src} download className="botao-fantasma !py-3 !text-sm">
            Baixar o cartaz
          </a>
        </div>

        {creditos && (
          <p className="mt-6 text-center text-xs text-texto-fraco">{creditos}</p>
        )}
      </div>

      {aberto && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-noite/97 p-4 backdrop-blur-lg"
          role="dialog"
          aria-modal="true"
          aria-label="Cartaz ampliado"
          onClick={() => setAberto(false)}
        >
          <button
            onClick={() => setAberto(false)}
            className="absolute right-5 top-5 z-10 rounded-full border border-borda p-2.5 text-texto transition-colors hover:border-ouro hover:text-ouro"
            aria-label="Fechar"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          <Image
            src={src}
            alt={`Cartaz de ${evento}`}
            width={1024}
            height={1536}
            sizes="92vw"
            className="max-h-[92svh] w-auto rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
