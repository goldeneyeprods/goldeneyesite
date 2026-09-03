'use client'

import { useState } from 'react'
import { Ornamento } from './OlhoDeHorus'

// ============================================================================
//  VÍDEOS DO YOUTUBE — com "fachada" (facade)
//
//  Um <iframe> do YouTube pesa cerca de 1 MB e já carrega rastreadores antes
//  de alguém apertar o play. Aqui mostramos só a miniatura; o player de
//  verdade só entra na página quando a pessoa clica.
//
//  Ganho real: a seção sai de ~3 MB (3 vídeos) para ~60 KB.
//  Bônus: usamos youtube-nocookie.com, que não grava cookie de quem só assiste.
// ============================================================================

export interface VideoConfig {
  /** o id do vídeo — a parte depois de "v=" na URL do YouTube */
  id: string
  titulo: string
  descricao?: string
}

export function Videos({
  videos,
  titulo = 'Assista',
  rotulo = 'Em movimento',
  canal,
}: {
  videos: VideoConfig[]
  titulo?: string
  rotulo?: string
  /** link do canal, exibido no fim da seção */
  canal?: string
}) {
  const [tocando, setTocando] = useState<string | null>(null)

  if (videos.length === 0) return null

  return (
    <section id="videos" className="relative px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="rotulo">{rotulo}</p>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{titulo}</h2>
        </div>

        <Ornamento className="my-12" />

        <div
          className={`grid gap-5 ${
            videos.length === 1 ? 'mx-auto max-w-3xl' : 'sm:grid-cols-2'
          }`}
        >
          {videos.map((v) => (
            <figure key={v.id} className="cartao overflow-hidden">
              <div className="relative aspect-video bg-noite">
                {tocando === v.id ? (
                  <iframe
                    // nocookie: não grava cookie de quem só assiste
                    src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
                    title={v.titulo}
                    allow="accelerated-destination; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : (
                  <button
                    onClick={() => setTocando(v.id)}
                    className="group absolute inset-0 h-full w-full"
                    aria-label={`Assistir: ${v.titulo}`}
                  >
                    {/* Miniatura servida pelo próprio YouTube — já otimizada.
                        hqdefault existe para todo vídeo; maxres nem sempre. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="h-full w-full object-cover opacity-75 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-noite/80 via-transparent to-transparent" />

                    {/* Botão de play com a cara do site, não o vermelho do YouTube */}
                    <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ouro/50 bg-noite/70 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-ouro group-hover:bg-noite/90">
                      <svg width="22" height="24" viewBox="0 0 22 24" fill="#d4a64a" aria-hidden="true">
                        <path d="M21 12 0 24V0z" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>

              <figcaption className="p-5">
                <h3 className="font-display text-base font-bold leading-tight text-texto">
                  {v.titulo}
                </h3>
                {v.descricao && (
                  <p className="mt-1.5 text-xs leading-relaxed text-texto-suave">
                    {v.descricao}
                  </p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>

        {canal && (
          <div className="mt-10 text-center">
            <a
              href={canal}
              target="_blank"
              rel="noopener noreferrer"
              className="botao-fantasma !py-3 !text-sm"
            >
              Ver o canal no YouTube
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
