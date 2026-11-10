import Link from 'next/link'
import { produtora, bandas } from '@/config/site'

// ============================================================================
//  DOSSIÊS DAS BANDAS — arquivo confidencial, cor de papiro
//  O texto sai do config (release da própria banda); nada inventado aqui.
// ============================================================================

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

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {bandas.map((b, i) => (
            <article key={b.slug} className="dossie relative flex flex-col p-7">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-tinta/60">
                  Arquivo nº {String(i + 1).padStart(2, '0')}
                </p>
                {b.carimbo && <span className="carimbo">{b.carimbo}</span>}
              </div>
              <h3 className="mt-4 font-display text-[1.75rem] font-bold leading-tight">
                <Link href={`/bandas/${b.slug}`} className="after:absolute after:inset-0">
                  {b.nome}
                </Link>
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-tinta/80">{b.resumo}.</p>
              {b.referencias.length > 0 && (
                <p className="mt-4 text-[13px] text-tinta/60">
                  Na linhagem de: {b.referencias.slice(0, 3).join(' · ')}
                </p>
              )}
              <p className="mt-auto pt-6 font-semibold text-[#6b4a12]">Abrir o dossiê →</p>
            </article>
          ))}

          <article className="relative flex flex-col justify-center rounded-lg border border-dashed border-ouro/35 p-7">
            <p className="text-[11px] uppercase tracking-[0.24em] text-texto-suave">
              Arquivo em aberto
            </p>
            <h3 className="mt-3 font-display text-[1.6rem] font-bold text-texto">Sua banda aqui</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-texto-suave">
              Faz som psicodélico, garage ou setentista? Manda o material.
            </p>
            <a
              href={contato}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 font-medium text-ouro-claro after:absolute after:inset-0 hover:underline"
            >
              Enviar pelo WhatsApp →
            </a>
          </article>
        </div>
      </div>
    </section>
  )
}
