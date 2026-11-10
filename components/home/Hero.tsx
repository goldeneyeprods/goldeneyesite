import Image from 'next/image'
import Link from 'next/link'
import { produtora, bandas, type EventoConfig } from '@/config/site'
import { SimboloMarca, corDaMarca } from '../Marcas'
import { ContagemCurta } from './ContagemCurta'

// ============================================================================
//  HERO DA HOME — "Fazemos da noite um ritual."
//  À esquerda, a produtora em uma frase; à direita, o próximo evento em forma
//  de ingresso de cinema. No celular o ingresso vem logo abaixo do título,
//  ainda na primeira tela: data, local e compra em 3 segundos.
// ============================================================================

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function partesDaData(iso: string) {
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...o }).format(new Date(iso))
  const dia = fmt({ day: 'numeric' })
  const mes = MESES[Number(fmt({ month: 'numeric' })) - 1]
  const semana = fmt({ weekday: 'long' }).replace('-feira', '')
  const hora = fmt({ hour: '2-digit', minute: '2-digit' }).replace(':00', 'h').replace(':', 'h')
  return { dia, mes, semana, hora }
}

export function linkDeCompra(e: EventoConfig) {
  const vende = e.vendaAberta && e.lotes.length > 0
  return vende
    ? { href: `/eventos/${e.slug}#ingressos`, rotulo: 'Comprar ingresso' }
    : { href: `/eventos/${e.slug}`, rotulo: 'Ver o evento' }
}

export function Hero({ destaque }: { destaque?: EventoConfig }) {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:pb-24 lg:pt-36">
      {/* O cano do 007: anéis dourados que abrem uma vez */}
      <div
        className="aneis iris-abre left-[-22rem] top-[-6rem] h-[52rem] w-[52rem] sm:left-[-16rem]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
        <div>
          <p className="rotulo surgir">Rock psicodélico · {produtora.cidade}</p>
          <h1
            className="surgir mt-5 font-display text-[2.15rem] font-bold leading-[1.08] text-texto sm:text-6xl lg:text-[3.5rem] xl:text-[3.9rem]"
            style={{ animationDelay: '80ms' }}
          >
            Fazemos da noite um ritual.
          </h1>
          <p
            className="surgir mt-7 hidden max-w-lg text-lg leading-relaxed text-texto-suave lg:block"
            style={{ animationDelay: '160ms' }}
          >
            {produtora.manifesto}
          </p>
          <div
            className="surgir mt-9 hidden items-center gap-6 lg:flex"
            style={{ animationDelay: '240ms' }}
          >
            <a href="#arquivo" className="botao-fantasma !py-3 !text-sm">
              Ver o que já rolou
            </a>
            <p className="cinema text-base text-texto-suave">
              Desde 2026, entre as estantes de um sebo.
            </p>
          </div>
        </div>

        <div className="surgir" style={{ animationDelay: '200ms' }}>
          {destaque ? (
            <IngressoDeCinema evento={destaque} />
          ) : (
            <div className="cartao p-10 text-center">
              <p className="font-display text-xl text-texto">Nenhum evento marcado agora.</p>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-texto-suave">
                A próxima está sendo preparada. Siga a gente no Instagram para
                saber na hora em que a data sair.
              </p>
              {produtora.redes.instagram && (
                <a
                  href={produtora.redes.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="botao-ouro mt-7"
                >
                  Seguir no Instagram
                </a>
              )}
            </div>
          )}
        </div>

        {/* No celular o texto vem depois do ingresso */}
        <p className="text-base leading-relaxed text-texto-suave lg:hidden">
          {produtora.manifesto}
        </p>
      </div>
    </section>
  )
}

function IngressoDeCinema({ evento }: { evento: EventoConfig }) {
  const marca = evento.marca ?? 'corujao'
  const c = corDaMarca[marca]
  const { dia, mes, semana, hora } = partesDaData(evento.dataInicio)
  const quemToca = (evento.bandas ?? [])
    .map((s) => bandas.find((b) => b.slug === s)?.nome)
    .filter((n): n is string => !!n)
  const compra = linkDeCompra(evento)

  return (
    <article
      id="proximo-evento"
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: c.borda, background: '#120a1c' }}
    >
      {/* A arte: o cartaz original (recortado no título e na coruja); sem
          cartaz, o símbolo da marca dentro dos anéis */}
      <Link
        href={`/eventos/${evento.slug}`}
        className={`relative flex items-center justify-center overflow-hidden ${
          evento.cartaz ? 'aspect-[4/3]' : 'h-44 sm:h-56'
        }`}
        style={{ background: c.fundo }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {evento.cartaz ? (
          <>
            <Image
              src={evento.cartaz}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 92vw, 520px"
              className="object-cover object-[50%_3%]"
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#120a1c] to-transparent" />
          </>
        ) : (
          <>
            <div
              className="aneis h-[30rem] w-[30rem]"
              style={{ ['--cor-anel' as string]: `${c.cor}55` }}
            />
            <SimboloMarca marca={marca} className="relative h-24 w-24 sm:h-28 sm:w-28" />
          </>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-noite/85 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.26em] text-texto-suave">
          Próximo evento
        </span>
      </Link>

      <div className="picote" style={{ ['--cor-picote' as string]: `${c.clara}88` }} />

      <div className="p-6 sm:p-8">
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="cinema text-4xl text-ouro-claro sm:text-[2.6rem]">
            {dia} {mes}
          </span>
          <span className="text-xs uppercase tracking-[0.22em] text-texto-suave">
            {semana} · {hora} · {evento.local}
          </span>
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-texto sm:text-4xl">
          <Link href={`/eventos/${evento.slug}`} className="hover:text-ouro-claro">
            {evento.nome}
          </Link>
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-texto-suave">
          {evento.subtitulo}.
          {quemToca.length > 0 && (
            <>
              {' '}Com{' '}
              {quemToca.map((n, i) => (
                <span key={n}>
                  <span className="text-texto">{n}</span>
                  {i < quemToca.length - 2 ? ', ' : i === quemToca.length - 2 ? ' e ' : '.'}
                </span>
              ))}
            </>
          )}
        </p>

        <div className="mt-7 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ContagemCurta ate={evento.dataInicio} className="text-center sm:text-left" />
          <Link href={compra.href} className="botao-ouro">
            {compra.rotulo}
          </Link>
        </div>
      </div>
    </article>
  )
}
