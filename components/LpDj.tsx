import Image from 'next/image'
import Link from 'next/link'
import { Galeria } from '@/components/Galeria'
import { Ornamento } from '@/components/OlhoDeHorus'
import { BarraCompra } from '@/components/home/BarraCompra'
import { produtora, type BandaConfig } from '@/config/site'

// ============================================================================
//  LP DE VENDA DO DJ — /bandas/<slug> quando a banda tem `lp`
//
//  Quem chega aqui é dono de bar. A ordem responde as perguntas dele: que
//  noite é essa, qual dos três shows serve pra minha casa, como ela anda,
//  quem toca e o que eu preciso ter. O cachê não aparece: vai pelo WhatsApp.
// ============================================================================

export function LpDj({ banda }: { banda: BandaConfig }) {
  const lp = banda.lp!
  const whats = (texto: string) =>
    `https://wa.me/${produtora.whatsapp}?text=${encodeURIComponent(texto)}`
  const contratar = whats(`Oi! Quero uma noite do ${banda.nome} na minha casa.`)
  const fotos = banda.fotos.map((src) => ({ src, evento: banda.nome }))

  return (
    <main id="conteudo">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden px-5 pb-20 pt-32 sm:pb-28">
        <div
          className="aneis iris-abre right-[-20rem] top-[-8rem] h-[48rem] w-[48rem]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Link
              href="/bandas"
              className="surgir inline-flex items-center gap-2 text-[11px] tracking-[0.22em] text-texto-fraco transition-colors hover:text-ouro"
            >
              GOLDEN EYE PRODS.
              <span className="text-ouro/40">/</span>
              <span className="text-ouro">APRESENTA</span>
            </Link>
            <h1
              className="surgir mt-6 font-display text-[13vw] font-black leading-[0.9] sm:text-7xl"
              style={{ animationDelay: '80ms' }}
            >
              <span className="texto-ouro">{banda.nome}</span>
            </h1>
            <p
              className="surgir cinema mt-6 text-2xl text-texto sm:text-3xl"
              style={{ animationDelay: '150ms' }}
            >
              {lp.chamada}
            </p>
            <p
              className="surgir mt-5 max-w-xl text-base leading-relaxed text-texto-suave sm:text-lg"
              style={{ animationDelay: '220ms' }}
            >
              {lp.subchamada}
            </p>

            <div
              id="proximo-evento"
              className="surgir mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: '290ms' }}
            >
              <a
                href={contratar}
                target="_blank"
                rel="noopener noreferrer"
                className="botao-ouro w-full sm:w-auto"
              >
                Contratar a noite
              </a>
              <a href="#shows" className="botao-fantasma w-full sm:w-auto">
                Ver os três shows
              </a>
            </div>
            <p
              className="surgir mt-5 text-sm text-texto-fraco"
              style={{ animationDelay: '350ms' }}
            >
              {lp.lados.map((l) => l.lado).join(' · ')} · {banda.cidade}
            </p>
          </div>

          <div className="surgir relative" style={{ animationDelay: '200ms' }}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-ouro/25">
              <Image
                src={banda.fotos[0]}
                alt={`${lp.quem.nome} na cabine`}
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 480px"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-noite to-transparent" />
              {banda.carimbo && (
                <span className="carimbo absolute bottom-4 right-4 bg-papiro/90">{banda.carimbo}</span>
              )}
            </div>
          </div>
        </div>

        {/* As referências, como uma fita de créditos */}
        <p className="relative z-10 mx-auto mt-16 max-w-5xl text-center text-xs uppercase tracking-[0.28em] text-texto-fraco">
          {banda.referencias.join(' · ')}
        </p>
      </section>

      <div className="divisor mx-auto max-w-5xl" />

      {/* ================= POR QUE ================= */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="sm:text-center">
            <p className="fala">A proposta</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-texto sm:text-5xl">
              Uma noite montada como um disco
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-texto-suave">
              {banda.conceito}
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {lp.pilares.map((p, i) => (
              <div key={p.titulo} className="cartao p-7">
                <p className="cinema text-3xl text-ouro">{['I', 'II', 'III', 'IV'][i]}</p>
                <h3 className="mt-3 font-display text-xl font-bold text-texto">{p.titulo}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-texto-suave">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= OS TRÊS SHOWS ================= */}
      <section id="shows" className="scroll-mt-20 px-5 pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="sm:text-center">
            <p className="fala">Escolha a noite</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-texto sm:text-5xl">
              Três shows, um para cada casa
            </h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {lp.lados.map((l) => (
              <a
                key={l.lado}
                href={`#show-${l.letra.toLowerCase()}`}
                className="cartao group flex flex-col p-7 transition-colors hover:border-ouro/50"
              >
                <p className="font-display text-6xl font-black leading-none">
                  <span className="texto-ouro">{l.letra}</span>
                </p>
                <h3 className="mt-4 font-display text-2xl font-bold text-texto">{l.lado}</h3>
                <p className="cinema mt-1 text-lg text-ouro-claro">{l.nome}</p>
                <p className="mt-4 text-[15px] leading-relaxed text-texto-suave">{l.resumo}</p>
                <dl className="mt-6 space-y-3 border-t border-borda pt-5 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.22em] text-texto-fraco">Para</dt>
                    <dd className="mt-1 text-texto">{l.paraQuem}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.22em] text-texto-fraco">Clima</dt>
                    <dd className="mt-1 text-texto">{l.clima}</dd>
                  </div>
                </dl>
                <p className="mt-auto pt-6 text-sm font-medium text-ouro-claro group-hover:underline">
                  Ver o set →
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="divisor mx-auto max-w-5xl" />

      {/* ================= A NOITE ================= */}
      <section id="a-noite" className="scroll-mt-20 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="sm:text-center">
            <p className="fala">A noite</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-texto sm:text-5xl">
              Do primeiro acorde ao último sino
            </h2>
          </div>

          {/* A linha do tempo: largura proporcional à duração de cada parte */}
          <div className="mt-12 hidden overflow-hidden rounded-full border border-ouro/30 md:flex" aria-hidden="true">
            {lp.noite.map((n, i) => (
              <div
                key={n.titulo}
                className={`py-3 text-center text-xs uppercase tracking-[0.2em] ${
                  i === 1 ? 'bg-ouro/25 text-ouro-claro' : 'bg-noite-2 text-texto-suave'
                }`}
                style={{ flexGrow: i === 1 ? 4 : 1.5 }}
              >
                {n.duracao}
              </div>
            ))}
          </div>

          <ol className="mt-8 grid gap-5 md:grid-cols-[1.5fr_4fr_1.5fr] md:gap-4">
            {lp.noite.map((n, i) => (
              <li
                key={n.titulo}
                className={`cartao p-6 ${i === 1 ? 'cartao-ouro' : ''}`}
              >
                <p className="cinema text-4xl text-ouro-claro">{n.duracao}</p>
                <h3 className="mt-2 font-display text-lg font-bold text-texto">{n.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-texto-suave">{n.texto}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-center text-sm text-texto-fraco">{lp.noiteNota}</p>
        </div>
      </section>

      <div className="divisor mx-auto max-w-5xl" />

      {/* ================= OS SETS, BLOCO A BLOCO ================= */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="sm:text-center">
            <p className="fala">Os sets</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-texto sm:text-5xl">
              Quatro capítulos em cada noite
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {lp.lados.map((l) => (
              <article
                key={l.lado}
                id={`show-${l.letra.toLowerCase()}`}
                className="cartao flex scroll-mt-24 flex-col p-7"
              >
                <p className="text-[11px] uppercase tracking-[0.26em] text-ouro">{l.nome}</p>
                <h3 className="mt-2 font-display text-3xl font-black">
                  <span className="texto-ouro">{l.lado}</span>
                </h3>
                <p className="mt-3 text-[15px] text-texto">{l.paraQuem}.</p>

                <ol className="mt-7 space-y-6 border-l border-ouro/25 pl-6">
                  {l.blocos.map((b) => (
                    <li key={b.titulo} className="relative">
                      <span
                        className="absolute -left-[1.85rem] top-1.5 h-2.5 w-2.5 rounded-full bg-ouro"
                        aria-hidden="true"
                      />
                      <p className="flex flex-wrap items-baseline gap-x-3">
                        <span className="font-display text-lg font-bold text-texto">{b.titulo}</span>
                        <span className="text-xs text-texto-fraco">{b.duracao}</span>
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-texto-suave">{b.texto}</p>
                      <p className="mt-1.5 text-xs italic text-ouro-claro/80">{b.faixas}</p>
                    </li>
                  ))}
                </ol>
                {l.nota && (
                  <p className="mt-6 text-xs leading-relaxed text-texto-fraco">{l.nota}</p>
                )}

                <a
                  href={whats(`Oi! Quero o show ${l.lado} do ${banda.nome} na minha casa.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="botao-fantasma mt-auto self-start !mt-8"
                >
                  Quero o {l.lado}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="divisor mx-auto max-w-5xl" />

      {/* ================= QUEM TOCA ================= */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-borda">
            <Image
              src={banda.fotos[1] ?? banda.fotos[0]}
              alt={`${lp.quem.nome} ao vivo`}
              fill
              sizes="(max-width: 768px) 92vw, 420px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="fala">Quem toca</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-texto">{lp.quem.nome}</h2>
            <p className="cinema mt-2 text-xl text-ouro-claro">{lp.quem.papel}</p>
            <p className="mt-5 text-[15px] leading-relaxed text-texto-suave">{lp.quem.texto}</p>
            <ul className="mt-7 space-y-3">
              {lp.quem.datas.map((d) => (
                <li key={d.data} className="flex gap-4 text-sm">
                  <span className="cinema w-20 shrink-0 text-ouro">{d.data}</span>
                  <span className="text-texto-suave">{d.texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="divisor mx-auto max-w-5xl" />

      {/* ================= PARA O BAR ================= */}
      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="sm:text-center">
            <p className="fala">Para o bar</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-texto sm:text-5xl">
              Uma mesa, uma tomada e um cabo no som da casa
            </h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { t: 'O DJ leva', itens: lp.rider.leva },
              { t: 'O bar oferece', itens: lp.rider.bar },
              { t: 'O clima', itens: lp.rider.clima },
            ].map((c) => (
              <div key={c.t} className="cartao p-7">
                <p className="rotulo">{c.t}</p>
                <ul className="mt-5 space-y-3">
                  {c.itens.map((i) => (
                    <li key={i} className="flex gap-3 text-[15px] text-texto-suave">
                      <span className="text-ouro" aria-hidden="true">◈</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Galeria
        id="fotos"
        fotos={fotos}
        rotulo="Quem está na cabine"
        titulo="Fotos"
        subtitulo="Clique para ampliar."
        limite={4}
      />

      {/* ================= CONTRATAR (sem preço: o cachê vai pelo WhatsApp) ================= */}
      <section id="contratar" className="px-5 py-24 sm:py-32">
        <div className="cartao cartao-ouro mx-auto max-w-2xl p-8 text-center sm:p-12">
          <p className="fala">Contratar</p>
          <h2 className="mt-4 font-display text-3xl font-bold text-texto sm:text-4xl">
            {lp.contratar.titulo}
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-texto-suave">
            {lp.contratar.texto}
          </p>
          <ul className="mx-auto mt-4 max-w-md space-y-1 text-sm text-texto-fraco">
            {lp.contratar.extras.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={contratar}
              target="_blank"
              rel="noopener noreferrer"
              className="botao-ouro w-full sm:w-auto"
            >
              Marcar uma data
            </a>
            <a
              href={whats(`Oi! Pode me mandar o media kit do ${banda.nome}?`)}
              target="_blank"
              rel="noopener noreferrer"
              className="botao-fantasma w-full sm:w-auto"
            >
              Pedir o media kit
            </a>
          </div>
          <p className="mt-7 text-xs text-texto-fraco">
            {produtora.whatsappLabel} · {produtora.email}
          </p>
        </div>
        <Ornamento className="mt-16" />
        <p className="cinema mt-6 text-center text-xl text-texto-suave">Uma experiência visual-sonora.</p>
      </section>

      <BarraCompra
        nome={banda.nome}
        quando={`${lp.lados.length} shows à escolha da casa`}
        href={contratar}
        rotulo="Contratar"
      />
    </main>
  )
}
