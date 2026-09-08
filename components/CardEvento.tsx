import Link from 'next/link'
import Image from 'next/image'
import type { EventoConfig } from '@/config/site'
import { ehFuturo } from '@/config/site'
import { diaMes, dataLonga, hora, mesAno } from '@/lib/formato'

// ============================================================================
//  CARD DE EVENTO — usado na agenda da home e na listagem /eventos
//  Duas variantes: "destaque" (o próximo, grande) e "normal".
// ============================================================================

export function CardEvento({
  evento,
  destaque = false,
}: {
  evento: EventoConfig
  destaque?: boolean
}) {
  const futuro = ehFuturo(evento)
  const { dia, mes } = diaMes(evento.dataInicio)
  const capa = evento.imagemHero ?? evento.cartaz ?? evento.galeria?.[0]
  const principais = evento.lineup.filter((a) => a.destaque)

  // ---- Variante grande: o próximo evento, no topo da home ------------------
  if (destaque) {
    return (
      <Link
        href={`/eventos/${evento.slug}`}
        className="cartao cartao-ouro group relative block overflow-hidden"
      >
        {capa && (
          <>
            <Image
              src={capa}
              alt=""
              aria-hidden="true"
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-25 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-noite via-noite/85 to-noite/40" />
          </>
        )}

        <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:gap-8 sm:p-10">
          {/* Bloco de data */}
          <div className="shrink-0 text-center">
            <div className="font-display text-5xl font-black leading-none texto-ouro sm:text-6xl">
              {dia}
            </div>
            <div className="mt-1.5 text-xs tracking-[0.3em] text-ouro/70">{mes}</div>
          </div>

          <div className="hidden h-20 w-px bg-borda sm:block" />

          <div className="min-w-0 flex-1">
            <p className="rotulo">
              {futuro ? 'Próximo evento' : 'Edição realizada'}
            </p>
            <h3 className="mt-2 font-display text-3xl font-black leading-tight text-texto sm:text-4xl">
              {evento.nome}
            </h3>
            <p className="mt-2 text-sm text-texto-suave">{evento.subtitulo}</p>

            {principais.length > 0 && (
              <p className="mt-4 text-sm text-texto">
                {principais.map((a) => a.titulo).join('  ·  ')}
              </p>
            )}

            <p className="mt-3 text-xs capitalize text-texto-fraco">
              {dataLonga(evento.dataInicio)} ·{' '}
              {evento.dataFim
                ? `${hora(evento.dataInicio)} às ${hora(evento.dataFim)}`
                : hora(evento.dataInicio)}{' '}·{' '}
              {evento.local}
            </p>
          </div>

          <div className="shrink-0">
            <span className="botao-ouro pointer-events-none !px-7">
              {futuro && evento.vendaAberta ? 'Ver e comprar' : 'Ver o evento'}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // ---- Variante normal: grade de eventos -----------------------------------
  return (
    <Link
      href={`/eventos/${evento.slug}`}
      className="cartao group relative block overflow-hidden transition-all duration-300 hover:border-ouro/45"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {capa ? (
          <>
            <Image
              src={capa}
              alt={evento.nome}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-noite via-noite/40 to-transparent" />
          </>
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                'conic-gradient(from 40deg at 45% 55%, #9d4edd, #c64bc0, #3ec7b0, #d4a64a, #9d4edd)',
              filter: 'blur(28px)',
            }}
          />
        )}

        <div className="absolute left-4 top-4 rounded-lg border border-ouro/30 bg-noite/85 px-3 py-2 text-center backdrop-blur-sm">
          <div className="font-display text-xl font-bold leading-none texto-ouro">{dia}</div>
          <div className="mt-0.5 text-[9px] tracking-[0.2em] text-ouro/70">{mes}</div>
        </div>

        {!futuro && (
          <span className="absolute right-4 top-4 rounded-full bg-noite/85 px-2.5 py-1 text-[9px] font-semibold tracking-[0.18em] text-texto-fraco backdrop-blur-sm">
            REALIZADO
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-bold leading-tight text-texto transition-colors group-hover:text-ouro-claro">
          {evento.nome}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-texto-suave">
          {evento.subtitulo}
        </p>
        <p className="mt-3 text-[11px] capitalize text-texto-fraco">
          {mesAno(evento.dataInicio)} · {evento.local}
        </p>
      </div>
    </Link>
  )
}
