import { Marca } from './OlhoDeHorus'
import { produtora, eventos } from '@/config/site'

// ============================================================================
//  HERO DA HOME — aqui quem se apresenta é a PRODUTORA, não o evento.
//  O evento em destaque aparece logo abaixo, na agenda.
// ============================================================================

export function HeroProdutora() {
  const edicoes = eventos.length
  const fotos = eventos.reduce((s, e) => s + (e.galeria?.length ?? 0), 0)
  // Atrações distintas já apresentadas — conta sozinho conforme você cadastra
  // eventos, sem número inventado para encher linguiça.
  const atracoes = new Set(
    eventos.flatMap((e) => e.lineup.filter((a) => a.destaque).map((a) => a.titulo))
  ).size

  return (
    <section className="relative flex min-h-[92svh] items-center justify-center overflow-hidden px-5 pb-24 pt-32">
      {/* A arte do olho no beco, bem apagada — textura, não protagonismo */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center opacity-[0.22]"
        style={{ backgroundImage: 'url(/imagens/hero-beco.jpg)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-noite via-noite/60 to-noite"
        aria-hidden="true"
      />

      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_28%,var(--color-noite)_76%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* O olho é a marca: aqui ele aparece grande, e não como ícone */}
        {/* A marca original inteira — olho, nome e "Prods." como foram
            desenhados. Nada de recriar a tipografia com fonte parecida. */}
        <div className="surgir flex justify-center">
          <div className="pulsar-olho">
            <Marca className="w-[min(78vw,420px)]" />
          </div>
        </div>

        <p
          className="surgir mx-auto mt-9 max-w-xl text-base leading-relaxed text-texto-suave sm:text-lg"
          style={{ animationDelay: '230ms' }}
        >
          {produtora.manifesto}
        </p>

        <div
          className="surgir mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: '310ms' }}
        >
          <a href="#agenda" className="botao-ouro w-full sm:w-auto">
            Ver a agenda
          </a>
          <a href="#arquivo" className="botao-fantasma w-full sm:w-auto">
            O que já rolou
          </a>
        </div>

        {/* Números discretos: prova social sem exagero */}
        <div
          className="surgir mt-14 flex items-center justify-center gap-8 text-center sm:gap-14"
          style={{ animationDelay: '390ms' }}
        >
          {[
            { n: String(edicoes), r: edicoes === 1 ? 'edição' : 'edições' },
            { n: String(atracoes), r: atracoes === 1 ? 'atração' : 'atrações' },
            { n: String(fotos), r: 'registros' },
          ].map((item) => (
            <div key={item.r}>
              <div className="font-display text-2xl font-bold texto-ouro">{item.n}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.22em] text-texto-fraco">
                {item.r}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a64a" strokeWidth="1.5" opacity="0.55">
          <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  )
}
