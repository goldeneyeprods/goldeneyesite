import Link from 'next/link'
import Image from 'next/image'
import { Contador } from './Contador'
import { OlhoDeHorus } from './OlhoDeHorus'
import type { EventoConfig } from '@/config/site'
import { ehFuturo } from '@/config/site'
import { dataLonga, hora, mesAno } from '@/lib/formato'

// ============================================================================
//  HERO DA LP DO EVENTO
//  Aqui o evento é o protagonista — a marca da produtora fica no header.
// ============================================================================

export function HeroEvento({ evento }: { evento: EventoConfig }) {
  const futuro = ehFuturo(evento)
  const fundo = evento.imagemHero ?? evento.cartaz ?? evento.galeria?.[0]

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 pb-20 pt-28">
      {fundo && (
        <>
          <Image
            src={fundo}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            priority
            className="z-0 object-cover opacity-[0.26]"
          />
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-noite via-noite/60 to-noite"
            aria-hidden="true"
          />
        </>
      )}

      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      {!fundo && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
          aria-hidden="true"
        >
          <div className="pulsar-olho">
            <OlhoDeHorus tamanho={720} brilho={false} />
          </div>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-noite)_78%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Trilha: deixa claro que este evento pertence à produtora */}
        <Link
          href="/"
          className="surgir inline-flex items-center gap-2 text-[11px] tracking-[0.22em] text-texto-fraco transition-colors hover:text-ouro"
        >
          GOLDEN EYE PRODS.
          <span className="text-ouro/40">/</span>
          <span className="text-ouro">
            {futuro ? 'PRÓXIMO EVENTO' : mesAno(evento.dataInicio).toUpperCase()}
          </span>
        </Link>

        <h1
          className="surgir mt-6 font-display text-[12vw] font-black leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl"
          style={{ animationDelay: '90ms' }}
        >
          <span className="texto-ouro">{evento.nome}</span>
        </h1>

        <p
          className="surgir mx-auto mt-6 max-w-xl text-base leading-relaxed text-texto-suave sm:text-lg"
          style={{ animationDelay: '180ms' }}
        >
          {evento.subtitulo}
        </p>

        <div
          className="surgir mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm"
          style={{ animationDelay: '260ms' }}
        >
          <span className="font-medium capitalize text-texto">
            {dataLonga(evento.dataInicio)}
          </span>
          <span className="text-ouro/40">◆</span>
          <span className="text-texto">
            {evento.dataFim
              ? `${hora(evento.dataInicio)} às ${hora(evento.dataFim)}`
              : hora(evento.dataInicio)}
          </span>
          <span className="text-ouro/40">◆</span>
          <span className="text-texto">{evento.local}</span>
        </div>

        {futuro ? (
          <>
            <div className="surgir mt-14" style={{ animationDelay: '340ms' }}>
              <Contador ate={evento.dataInicio} />
            </div>

            <div
              className="surgir mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: '420ms' }}
            >
              {evento.vendaAberta ? (
                <a href="#ingressos" className="botao-ouro w-full sm:w-auto">
                  Garantir ingresso
                </a>
              ) : evento.entrada ? (
                <a href="#ingressos" className="botao-ouro w-full sm:w-auto">
                  {/* quando há inscrição, o botão diz a ação; sem ela, diz
                      apenas como se entra */}
                  {evento.entrada.link?.rotulo ?? evento.entrada.titulo}
                </a>
              ) : (
                <span className="botao-fantasma pointer-events-none w-full sm:w-auto">
                  Vendas em breve
                </span>
              )}
              <a href="#lineup" className="botao-fantasma w-full sm:w-auto">
                Ver o line-up
              </a>
            </div>

            {evento.vendaAberta && (
              <p
                className="surgir mt-6 text-xs text-texto-fraco"
                style={{ animationDelay: '500ms' }}
              >
                Pagamento via PIX · Ingresso na hora · Reembolso em até 7 dias
                pelo CDC
              </p>
            )}
            {!evento.vendaAberta && evento.entrada && (
              <p
                className="surgir mt-6 text-xs text-texto-fraco"
                style={{ animationDelay: '500ms' }}
              >
                {evento.entrada.link
                  ? 'Inscrição gratuita · entrada por doação · espaço limitado'
                  : 'Sem ingresso e sem taxa — é só chegar com a sua doação'}
              </p>
            )}
          </>
        ) : (
          <div className="surgir mt-12" style={{ animationDelay: '340ms' }}>
            <p className="text-sm text-texto-fraco">
              Esta edição já aconteceu — role para ver como foi.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {evento.galeria && evento.galeria.length > 0 && (
                <a href="#galeria" className="botao-ouro w-full sm:w-auto">
                  Ver as fotos
                </a>
              )}
              <Link href="/#agenda" className="botao-fantasma w-full sm:w-auto">
                Ver os próximos
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a64a" strokeWidth="1.5" opacity="0.55">
          <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  )
}
