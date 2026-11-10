import Link from 'next/link'
import { produtora, universos, type EventoConfig } from '@/config/site'
import { SimboloMarca, corDaMarca } from '../Marcas'

// ============================================================================
//  OS UNIVERSOS GOLDEN EYE — três portais
//  Marca com evento marcado leva à página dele; sem evento, o botão abre o
//  WhatsApp da produção para a pessoa entrar na lista de quem quer saber.
// ============================================================================

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function quando(iso: string) {
  const d = new Date(iso)
  const dia = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', timeZone: 'America/Sao_Paulo' }).format(d)
  const mes = Number(
    new Intl.DateTimeFormat('pt-BR', { month: 'numeric', timeZone: 'America/Sao_Paulo' }).format(d)
  )
  return `${dia} ${MESES[mes - 1]}`
}

export function Universos({ proximos }: { proximos: EventoConfig[] }) {
  return (
    <section id="universos" className="px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="sm:text-center">
          <p className="rotulo">Três portais</p>
          <h2 className="mt-4 font-display text-4xl font-bold text-texto sm:text-5xl">
            Os universos Golden Eye
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-texto-suave">
            Da noite de bar ao festival ao ar livre. Cada um com seu mundo,
            todos com o mesmo olho.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
          {universos.map((u) => {
            const c = corDaMarca[u.marca]
            const evento = proximos.find((e) => e.marca === u.marca)
            const vende = evento && evento.vendaAberta && evento.lotes.length > 0
            const status = evento
              ? vende
                ? 'ingressos à venda'
                : `${quando(evento.dataInicio)}`
              : 'em breve'
            const aviso = `https://wa.me/${produtora.whatsapp}?text=${encodeURIComponent(
              `Oi! Quero ser avisado quando sair data do ${u.nome}.`
            )}`

            return (
              <article
                key={u.marca}
                className="group relative flex items-center gap-5 rounded-2xl border p-5 transition-colors md:block md:p-8"
                style={{ background: c.fundo, borderColor: c.borda }}
              >
                <SimboloMarca marca={u.marca} className="h-11 w-11 shrink-0 md:h-12 md:w-12" />

                <div className="min-w-0 md:mt-7">
                  <p
                    className="hidden text-[11px] uppercase tracking-[0.24em] md:block"
                    style={{ color: c.clara }}
                  >
                    {u.tipo} · {status}
                  </p>
                  <h3 className="font-display text-xl font-bold text-texto md:mt-3 md:text-[1.7rem]">
                    {evento ? (
                      <Link href={`/eventos/${evento.slug}`} className="after:absolute after:inset-0">
                        {u.nome}
                      </Link>
                    ) : (
                      u.nome
                    )}
                  </h3>
                  {/* no celular o portal é uma linha só */}
                  <p className="mt-0.5 text-sm md:hidden" style={{ color: c.clara }}>
                    {u.tipo} · {evento ? `${quando(evento.dataInicio)} ${vende ? 'à venda' : ''}` : 'em breve'}
                  </p>
                  <p className="mt-4 hidden text-[15px] leading-relaxed text-texto-suave md:block">
                    {u.texto}
                  </p>
                  {evento ? (
                    <p className="mt-6 hidden font-medium text-ouro-claro md:block">
                      Próxima: {quando(evento.dataInicio)}, {evento.local} →
                    </p>
                  ) : (
                    <a
                      href={aviso}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 hidden font-medium text-ouro-claro hover:underline md:inline-block"
                    >
                      {u.aviso} →
                    </a>
                  )}
                </div>

                {!evento && (
                  <a
                    href={aviso}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 md:hidden"
                    aria-label={`${u.aviso}: ${u.nome}`}
                  />
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
