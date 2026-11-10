import Image from 'next/image'
import Link from 'next/link'
import type { EventoConfig } from '@/config/site'

// ============================================================================
//  ARQUIVO — as edições anteriores numa tira de filme
//  Fotos em preto e branco; a cor volta quando o mouse passa.
// ============================================================================

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function diaMes(iso: string) {
  const d = new Date(iso)
  const f = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...o }).format(d)
  return `${f({ day: 'numeric' })} ${MESES[Number(f({ month: 'numeric' })) - 1]}`
}

export function Arquivo({ passados, totalFotos }: { passados: EventoConfig[]; totalFotos: number }) {
  if (passados.length === 0) return null
  const quadros = passados.slice(0, 3)

  return (
    <section id="arquivo" className="px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="rotulo">Cada noite deixa um rastro</p>
        <h2 className="mt-4 font-display text-4xl font-bold text-texto sm:text-5xl">Arquivo</h2>

        <div className="fita mt-12 px-4 py-9 sm:px-5">
          <div
            className={`grid gap-4 ${
              quadros.length === 1 ? 'mx-auto max-w-md' : quadros.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
            }`}
          >
            {quadros.map((e) => {
              const capa = e.galeria?.[0] ?? e.cartaz
              return (
                <Link key={e.slug} href={`/eventos/${e.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-noite-2">
                    {capa && (
                      <Image
                        src={capa}
                        alt={`${e.nome}, ${diaMes(e.dataInicio)}`}
                        fill
                        sizes="(max-width: 640px) 92vw, 560px"
                        className="pb object-cover"
                      />
                    )}
                  </div>
                  <p className="cinema mt-4 text-lg text-ouro-claro">{diaMes(e.dataInicio)}</p>
                  <h3 className="mt-1 font-display text-lg font-bold leading-snug text-texto group-hover:text-ouro-claro">
                    {e.nome}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-texto-suave">{e.subtitulo}</p>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
          {totalFotos > 0 && (
            <Link href="/arquivo" className="font-medium text-ouro-claro hover:underline">
              Ver todas as {totalFotos} fotos →
            </Link>
          )}
          <Link href="/eventos" className="font-medium text-texto-suave hover:text-ouro-claro">
            Todas as edições →
          </Link>
        </div>
      </div>
    </section>
  )
}
