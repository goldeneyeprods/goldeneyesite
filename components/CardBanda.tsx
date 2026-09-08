import Link from 'next/link'
import Image from 'next/image'
import type { BandaConfig } from '@/config/site'

// ============================================================================
//  CARD DE BANDA — usado em /bandas e na home
// ============================================================================

export function CardBanda({ banda }: { banda: BandaConfig }) {
  return (
    <Link
      href={`/bandas/${banda.slug}`}
      className="cartao group relative block overflow-hidden transition-all duration-300 hover:border-ouro/45"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={banda.fotos[0]}
          alt={banda.nome}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noite via-noite/45 to-transparent" />

        <span className="absolute left-4 top-4 rounded-full border border-ouro/30 bg-noite/85 px-3 py-1 text-[9px] font-semibold tracking-[0.16em] text-ouro backdrop-blur-sm">
          {banda.genero.toUpperCase()}
        </span>
      </div>

      <div className="p-6">
        <h3 className="font-display text-2xl font-bold leading-tight text-texto transition-colors group-hover:text-ouro-claro">
          {banda.nome}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-texto-suave">
          {banda.resumo}
        </p>

        {/* As referências dizem mais a um contratante do que qualquer
            adjetivo: ele sabe na hora se combina com a casa dele. */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {banda.referencias.slice(0, 3).map((r) => (
            <span
              key={r}
              className="rounded-full border border-borda px-2.5 py-1 text-[10px] text-texto-fraco"
            >
              {r}
            </span>
          ))}
        </div>

        <p className="mt-5 text-xs font-medium text-ouro">
          Ver a banda →
        </p>
      </div>
    </Link>
  )
}
