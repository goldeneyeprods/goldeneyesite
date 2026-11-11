import Image from 'next/image'
import Link from 'next/link'
import { produtora, bandas } from '@/config/site'

// ============================================================================
//  DOSSIÊS DAS BANDAS — a ficha de papiro com a foto da banda presa nela
//  O texto sai do config (release da própria banda); nada inventado aqui.
// ============================================================================

/** Clipe de papel segurando a foto na ficha. */
function Clipe() {
  return (
    <svg
      viewBox="0 0 24 60"
      className="absolute -top-4 left-8 z-10 h-14 w-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]"
      aria-hidden="true"
    >
      <path
        d="M7 52 V12 a5 5 0 0 1 10 0 V46 a3 3 0 0 1 -6 0 V16"
        fill="none"
        stroke="#9a9488"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Dossies() {
  if (bandas.length === 0) return null
  const contato = `https://wa.me/${produtora.whatsapp}?text=${encodeURIComponent(
    'Oi! Tenho uma banda e queria mandar o material para a Golden Eye.'
  )}`

  return (
    <section id="bandas" className="px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="rotulo">Quem toca com a gente</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-texto sm:text-5xl">
              Dossiês das bandas
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-texto-suave">
            Tem um bar, uma casa ou uma data em aberto? Estas são as bandas do
            nosso casting.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
          {bandas.map((b, i) => (
            <article key={b.slug} className="dossie group relative flex flex-col p-3.5">
              <Clipe />

              {/* A foto presa na ficha */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm ring-1 ring-tinta/15">
                <Image
                  src={b.fotos[0]}
                  alt={b.nome}
                  fill
                  sizes="(max-width: 768px) 92vw, 380px"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                {b.carimbo && (
                  <span className="carimbo absolute bottom-3 right-3 bg-papiro/90">{b.carimbo}</span>
                )}
              </div>

              <div className="flex flex-1 flex-col px-2.5 pb-2 pt-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-tinta/55">
                    Arquivo nº {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className="text-[11px] text-tinta/55">{b.cidade}</p>
                </div>
                <h3 className="mt-2 font-display text-[1.7rem] font-bold leading-tight">
                  <Link href={`/bandas/${b.slug}`} className="after:absolute after:inset-0">
                    {b.nome}
                  </Link>
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-tinta/80">{b.resumo}.</p>
                {b.referencias.length > 0 && (
                  <p className="mt-3 text-[13px] text-tinta/60">
                    Na linhagem de: {b.referencias.slice(0, 3).join(' · ')}
                  </p>
                )}
                <p className="mt-auto pt-5 font-semibold text-[#6b4a12] group-hover:underline">
                  Abrir o dossiê →
                </p>
              </div>
            </article>
          ))}

          <article className="relative flex flex-col rounded-lg border border-dashed border-ouro/35 p-3.5">
            <div className="flex aspect-[4/3] items-center justify-center rounded-sm border border-dashed border-ouro/25">
              <p className="cinema text-lg text-texto-fraco">sua foto aqui</p>
            </div>
            <div className="flex flex-1 flex-col px-2.5 pb-2 pt-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-texto-suave">
                Arquivo em aberto
              </p>
              <h3 className="mt-2 font-display text-[1.6rem] font-bold text-texto">Sua banda aqui</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-texto-suave">
                Faz som psicodélico, garage ou setentista? Manda o material.
              </p>
              <a
                href={contato}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto pt-5 font-medium text-ouro-claro after:absolute after:inset-0 hover:underline"
              >
                Enviar pelo WhatsApp →
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
