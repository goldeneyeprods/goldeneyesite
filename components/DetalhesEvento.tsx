import { Ornamento } from './OlhoDeHorus'
import type { EventoConfig } from '@/config/site'
import { hora } from '@/lib/formato'

// ============================================================================
//  DETALHES DO EVENTO — descrição, line-up, local e regras da casa.
//  Componente de servidor: nada aqui precisa de JavaScript no navegador.
// ============================================================================

export function DetalhesEvento({ evento }: { evento: EventoConfig }) {
  const temRegras = evento.permitido.length > 0 || evento.proibido.length > 0

  return (
    <section id="lineup" className="relative px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="rotulo">O que aconteceu ali</p>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            A travessia
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-texto-suave">
            {evento.descricao}
          </p>
        </div>

        {/* Créditos: apoio cultural, causa apoiada, forma de entrada */}
        {evento.creditos && evento.creditos.length > 0 && (
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-3">
            {evento.creditos.map((c) => (
              <div
                key={c.rotulo}
                className="rounded-xl border border-borda bg-noite-2/50 px-4 py-3 text-center"
              >
                <p className="text-[9px] uppercase tracking-[0.2em] text-texto-fraco">
                  {c.rotulo}
                </p>
                <p className="mt-1 text-sm font-medium text-ouro-claro">{c.valor}</p>
              </div>
            ))}
          </div>
        )}

        <Ornamento className="my-16" />

        {/* --- LINE-UP --- */}
        <div className="grid gap-4 sm:gap-5">
          {evento.lineup.map((ato, i) => (
            <article
              key={`${ato.horario}-${ato.titulo}`}
              className={`cartao group relative overflow-hidden p-6 transition-all duration-300 hover:border-ouro/45 sm:p-8 ${
                ato.destaque ? 'cartao-ouro' : ''
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ouro/0 via-ouro/[0.04] to-ouro/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
                <div className="shrink-0">
                  <div
                    className={`font-display text-2xl font-bold tabular-nums sm:text-3xl ${
                      ato.destaque ? 'texto-ouro' : 'text-texto-suave'
                    }`}
                  >
                    {ato.horario}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="flex flex-wrap items-center gap-3 font-display text-xl font-bold text-texto sm:text-2xl">
                    {ato.titulo}
                    {ato.destaque && (
                      <span className="rounded-full border border-ouro/35 px-2.5 py-1 text-[9px] font-sans font-semibold tracking-[0.18em] text-ouro">
                        AO VIVO
                      </span>
                    )}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-texto-suave">
                    {ato.descricao}
                  </p>
                </div>

                <div
                  className="hidden shrink-0 self-center text-2xl text-ouro/20 sm:block"
                  aria-hidden="true"
                >
                  {i + 1 === evento.lineup.length ? '☾' : '◈'}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* --- LOCAL --- */}
        <div className="mt-20 grid gap-6 lg:grid-cols-5">
          <div className="cartao p-7 lg:col-span-2">
            <p className="rotulo">Onde</p>
            <h3 className="mt-3 font-display text-2xl font-bold text-texto">
              {evento.local}
            </h3>
            {evento.endereco && (
              <p className="mt-2 text-sm leading-relaxed text-texto-suave">
                {evento.endereco}
              </p>
            )}

            <dl className="mt-7 space-y-4 border-t border-borda pt-6 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-texto-fraco">Abertura</dt>
                <dd className="text-right font-medium text-texto">
                  {hora(evento.aberturaPortoes)}
                </dd>
              </div>
              {evento.dataFim && (
                <div className="flex justify-between gap-4">
                  <dt className="text-texto-fraco">Encerramento</dt>
                  <dd className="text-right font-medium text-texto">
                    {hora(evento.dataFim)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-texto-fraco">Classificação</dt>
                <dd className="text-right font-medium text-texto">
                  {evento.classificacaoEtaria}
                </dd>
              </div>
            </dl>

            {evento.mapaLink && (
              <a
                href={evento.mapaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="botao-fantasma mt-7 w-full !py-3 !text-sm"
              >
                Abrir no Google Maps
              </a>
            )}
          </div>

          <div className="cartao overflow-hidden lg:col-span-3">
            {evento.mapaEmbed ? (
              <iframe
                src={evento.mapaEmbed}
                className="h-full min-h-[300px] w-full border-0 grayscale-[35%] contrast-[1.15]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa — ${evento.local}`}
              />
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 p-8 text-center">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#d4a64a" strokeWidth="1.3" opacity="0.5">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-sm text-texto-suave">
                  {evento.endereco || evento.local}
                </p>
                <p className="max-w-xs text-xs text-texto-fraco">
                  {/* >>> SUBSTITUIR: cole o link de incorporação do Google Maps
                      em config/site.ts → mapaEmbed deste evento */}
                  Cole o link do Google Maps em config/site.ts para o mapa
                  aparecer aqui.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --- REGRAS DA CASA --- */}
        {temRegras && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {evento.permitido.length > 0 && (
              <div className="cartao p-7">
                <p className="rotulo !text-ok">Pode levar</p>
                <ul className="mt-4 space-y-2.5">
                  {evento.permitido.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-texto-suave">
                      <span className="mt-0.5 shrink-0 text-ok" aria-hidden="true">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evento.proibido.length > 0 && (
              <div className="cartao p-7">
                <p className="rotulo !text-erro">Não entra</p>
                <ul className="mt-4 space-y-2.5">
                  {evento.proibido.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-texto-suave">
                      <span className="mt-0.5 shrink-0 text-erro" aria-hidden="true">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
