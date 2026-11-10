import type { MarcaEvento } from '@/config/site'

// ============================================================================
//  AS MARCAS DE EVENTO — cor e símbolo de cada universo
//  A Golden Eye é sempre o breu e o ouro; cada marca empresta só a sua cor.
//  Símbolos em linha, sem nenhuma referência a substância.
// ============================================================================

export const corDaMarca: Record<
  MarcaEvento,
  { cor: string; clara: string; fundo: string; borda: string }
> = {
  corujao: {
    cor: '#8e5cff',
    clara: '#b794ff',
    fundo: '#170d26',
    borda: 'rgba(142, 92, 255, 0.28)',
  },
  psicoelho: {
    cor: '#d04a44',
    clara: '#ec8a7f',
    fundo: '#1c0f14',
    borda: 'rgba(208, 74, 68, 0.28)',
  },
  horus: {
    cor: '#2a4ba0',
    clara: '#e8c77a',
    fundo: '#0b1028',
    borda: 'rgba(201, 162, 74, 0.55)',
  },
}

/** Coruja: o Corujão — virar a noite. */
function Coruja({ cor, olhos }: { cor: string; olhos: string }) {
  return (
    <>
      <path
        d="M14 9 L19 15 M50 9 L45 15"
        stroke={cor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M17 16 Q32 9 47 16 Q52 32 46 46 Q39 56 32 58 Q25 56 18 46 Q12 32 17 16 Z"
        stroke={cor}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="24.5" cy="29" r="6.5" stroke={olhos} strokeWidth="3" />
      <circle cx="39.5" cy="29" r="6.5" stroke={olhos} strokeWidth="3" />
      <circle cx="24.5" cy="29" r="2.2" fill={olhos} />
      <circle cx="39.5" cy="29" r="2.2" fill={olhos} />
      <path d="M29 39 L35 39 L32 44 Z" fill={olhos} />
    </>
  )
}

/** Coelho com relógio: o Psicoelho. */
function Coelho({ cor }: { cor: string }) {
  return (
    <>
      <path
        d="M25 30 C21 18 21 7 26 6 C31 5 31 18 30 29 M39 30 C43 18 43 7 38 6 C33 5 33 18 34 29"
        stroke={cor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="44" r="14" stroke={cor} strokeWidth="3" />
      <path d="M32 36 V44 L38 48" stroke={cor} strokeWidth="3" strokeLinecap="round" />
    </>
  )
}

/** Sol alado: o Hórus — o disco solar, o falcão. */
function SolAlado({ ouro, lapis }: { ouro: string; lapis: string }) {
  return (
    <>
      <path
        d="M4 30 Q14 20 26 27 M60 30 Q50 20 38 27"
        stroke={ouro}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M8 36 Q17 29 27 33 M56 36 Q47 29 37 33"
        stroke={lapis}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="28" r="7.5" fill={ouro} />
      <path d="M32 37 V55" stroke={ouro} strokeWidth="3" strokeLinecap="round" />
    </>
  )
}

export function SimboloMarca({
  marca,
  className = 'h-10 w-10',
}: {
  marca: MarcaEvento
  className?: string
}) {
  const c = corDaMarca[marca]
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      {marca === 'corujao' && <Coruja cor={c.clara} olhos="#e8c77a" />}
      {marca === 'psicoelho' && <Coelho cor={c.clara} />}
      {marca === 'horus' && <SolAlado ouro="#c9a24a" lapis="#6f8fe0" />}
    </svg>
  )
}
