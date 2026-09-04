'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Ornamento } from './OlhoDeHorus'

// ============================================================================
//  GALERIA + lightbox em JS puro
//  Sem biblioteca: são ~70 linhas e nenhum quilobyte extra no bundle.
//
//  Usada em dois lugares:
//    - na LP de um evento  → só as fotos daquela edição
//    - na home             → as fotos de todas as edições, com link para a LP
// ============================================================================

export interface FotoGaleria {
  src: string
  /** de qual edição veio — mostrado na legenda */
  evento?: string
  /** se informado, a legenda vira link para /eventos/<slug> */
  slug?: string
}

export function Galeria({
  fotos,
  titulo = 'Registros',
  subtitulo,
  rotulo = 'O que já rolou',
  id = 'galeria',
  /** quantas mostrar antes do botão "ver todas" (0 = todas) */
  limite = 0,
}: {
  fotos: FotoGaleria[]
  titulo?: string
  subtitulo?: string
  rotulo?: string
  id?: string
  limite?: number
}) {
  const [aberta, setAberta] = useState<number | null>(null)
  const [expandido, setExpandido] = useState(limite === 0)

  const visiveis = expandido ? fotos : fotos.slice(0, limite)

  // A grade se adapta à quantidade. Com poucas fotos, 4 colunas deixariam
  // uma sobrando sozinha na linha de baixo — e ainda por cima pequenas.
  // Menos colunas = fotos maiores e nenhuma órfã.
  const colunas =
    visiveis.length <= 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : visiveis.length <= 6
        ? 'grid-cols-2 sm:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'

  const navegar = useCallback(
    (passo: number) => {
      setAberta((atual) => {
        if (atual === null) return null
        // navegação circular: passou do fim, volta ao começo
        return (atual + passo + fotos.length) % fotos.length
      })
    },
    [fotos.length]
  )

  useEffect(() => {
    if (aberta === null) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberta(null)
      if (e.key === 'ArrowRight') navegar(1)
      if (e.key === 'ArrowLeft') navegar(-1)
    }
    document.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [aberta, navegar])

  if (fotos.length === 0) {
    return (
      <section id={id} className="relative px-5 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="rotulo">{rotulo}</p>
            <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{titulo}</h2>
          </div>

          <Ornamento className="my-12" />

          {/* Placeholder honesto: gradiente psicodélico, nunca foto falsa */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-xl border border-borda"
                aria-hidden="true"
              >
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    background: `conic-gradient(from ${i * 47}deg at ${35 + i * 6}% ${
                      45 + ((i * 13) % 30)
                    }%, #9d4edd, #c64bc0, #3ec7b0, #d4a64a, #9d4edd)`,
                    filter: 'blur(22px)',
                  }}
                />
                <div className="absolute inset-0 bg-noite/55" />
              </div>
            ))}
          </div>

          <div className="cartao mx-auto mt-8 max-w-lg p-6 text-center">
            <p className="text-sm leading-relaxed text-texto-suave">
              Coloque as fotos em{' '}
              <code className="rounded bg-noite px-1.5 py-0.5 font-mono text-xs text-ouro">
                public/imagens/eventos/
              </code>{' '}
              e liste os caminhos em{' '}
              <code className="rounded bg-noite px-1.5 py-0.5 font-mono text-xs text-ouro">
                config/site.ts
              </code>{' '}
              → <strong className="text-texto">galeria</strong> do evento.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id={id} className="relative px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="rotulo">{rotulo}</p>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{titulo}</h2>
          {subtitulo && (
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-texto-suave">
              {subtitulo}
            </p>
          )}
        </div>

        <Ornamento className="my-12" />

        <div className={`grid gap-3 ${colunas}`}>
          {visiveis.map((foto, i) => (
            <button
              key={foto.src}
              onClick={() => setAberta(i)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-borda transition-all duration-300 hover:border-ouro/50"
              aria-label={`Ampliar foto${foto.evento ? ` de ${foto.evento}` : ''}`}
            >
              {/* next/image converte para WebP e entrega o tamanho certo
                  para cada tela. As fotos originais têm ~400 KB cada; como
                  miniatura elas viram ~15 KB. Com 26 fotos, é a diferença
                  entre 10 MB e 400 KB de galeria. */}
              <Image
                src={foto.src}
                alt={foto.evento ?? 'Registro do evento'}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noite/70 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-20" />
            </button>
          ))}
        </div>

        {!expandido && fotos.length > limite && (
          <div className="mt-8 text-center">
            <button onClick={() => setExpandido(true)} className="botao-fantasma !py-3 !text-sm">
              Ver todas as {fotos.length} fotos
            </button>
          </div>
        )}
      </div>

      {/* ================= LIGHTBOX ================= */}
      {aberta !== null && fotos[aberta] && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-noite/96 p-4 backdrop-blur-lg"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada"
          onClick={() => setAberta(null)}
        >
          <button
            onClick={() => setAberta(null)}
            className="absolute right-5 top-5 z-10 rounded-full border border-borda p-2.5 text-texto transition-colors hover:border-ouro hover:text-ouro"
            aria-label="Fechar"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          {fotos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navegar(-1)
                }}
                className="absolute left-3 z-10 rounded-full border border-borda bg-noite/70 p-3 text-texto transition-colors hover:border-ouro hover:text-ouro sm:left-6"
                aria-label="Foto anterior"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navegar(1)
                }}
                className="absolute right-3 z-10 rounded-full border border-borda bg-noite/70 p-3 text-texto transition-colors hover:border-ouro hover:text-ouro sm:right-6"
                aria-label="Próxima foto"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}

          <figure className="max-h-[88svh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* Aqui vale carregar grande — mas só a foto que está aberta. */}
            <Image
              src={fotos[aberta].src}
              alt={fotos[aberta].evento ?? ''}
              width={1600}
              height={1600}
              sizes="90vw"
              priority
              className="max-h-[80svh] w-auto rounded-lg object-contain"
            />
            <figcaption className="mt-4 text-center text-xs text-texto-fraco">
              {fotos[aberta].slug ? (
                <Link
                  href={`/eventos/${fotos[aberta].slug}`}
                  className="text-ouro underline underline-offset-4"
                >
                  {fotos[aberta].evento}
                </Link>
              ) : (
                fotos[aberta].evento
              )}
              {fotos[aberta].evento && ' · '}
              {aberta + 1} de {fotos.length}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  )
}
