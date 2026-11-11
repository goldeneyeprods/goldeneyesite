import { produtora } from '@/config/site'

// ============================================================================
//  MANIFESTO / QUEM FAZ
// ============================================================================

export function Manifesto() {
  return (
    <section id="quem-faz" className="relative px-5 py-16 sm:py-20">
      {/* link antigo /#sobre continua chegando aqui */}
      <span id="sobre" className="absolute -top-20" aria-hidden="true" />

      <div className="mx-auto max-w-4xl text-center">
        <div className="flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px w-14 bg-ouro/60" />
          <span className="h-2 w-2 rounded-full bg-ouro" />
          <span className="h-px w-14 bg-ouro/60" />
        </div>

        <blockquote className="cinema mt-9 text-3xl leading-snug text-texto sm:text-[2.6rem] sm:leading-[1.25]">
          “Fazer de cada noite uma experiência inteira e devolver alguma coisa para a cidade.”
        </blockquote>
        <p className="mt-7 text-xs uppercase tracking-[0.26em] text-ouro">
          {produtora.direcao.nome} · {produtora.direcao.cargo}
        </p>

        <p className="mx-auto mt-8 max-w-2xl text-base leading-loose text-texto-suave sm:text-lg">
          {produtora.descricao}
        </p>

        <div className="mt-14 grid gap-8 text-left sm:grid-cols-3">
          {produtora.pilares.map((p) => (
            <div key={p.titulo} className="border-t border-ouro/35 pt-4">
              <p className="font-display text-xl font-bold text-ouro">{p.titulo}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-texto-suave">{p.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
