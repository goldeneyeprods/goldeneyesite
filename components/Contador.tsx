'use client'

import { useEffect, useState } from 'react'

// ============================================================================
//  CONTADOR REGRESSIVO
//  Começa nulo e só calcula depois de montar no navegador: se o servidor
//  renderizasse um número, ele já chegaria errado no cliente (hidratação).
// ============================================================================

export function Contador({
  ate,
  compacto = false,
}: {
  /** data ISO do evento */
  ate: string
  compacto?: boolean
}) {
  const [restante, setRestante] = useState<{
    dias: number
    horas: number
    min: number
    seg: number
  } | null>(null)
  const [passou, setPassou] = useState(false)

  useEffect(() => {
    const alvo = new Date(ate).getTime()

    const tique = () => {
      const delta = alvo - Date.now()
      if (delta <= 0) {
        setPassou(true)
        setRestante({ dias: 0, horas: 0, min: 0, seg: 0 })
        return
      }
      setRestante({
        dias: Math.floor(delta / 86_400_000),
        horas: Math.floor((delta / 3_600_000) % 24),
        min: Math.floor((delta / 60_000) % 60),
        seg: Math.floor((delta / 1000) % 60),
      })
    }

    tique()
    const id = setInterval(tique, 1000)
    return () => clearInterval(id)
  }, [ate])

  if (passou) {
    return (
      <p className="font-display text-xl tracking-widest text-ouro">A NOITE É HOJE</p>
    )
  }

  const blocos = [
    { v: restante?.dias, r: 'dias' },
    { v: restante?.horas, r: 'horas' },
    { v: restante?.min, r: 'min' },
    { v: restante?.seg, r: 'seg' },
  ]

  return (
    <div
      className={`flex items-start justify-center ${compacto ? 'gap-2' : 'gap-3 sm:gap-5'}`}
      role="timer"
      aria-label="Contagem regressiva para o evento"
    >
      {blocos.map((b, i) => (
        <div key={b.r} className={`flex items-start ${compacto ? 'gap-2' : 'gap-3 sm:gap-5'}`}>
          <div
            className={compacto ? 'min-w-[2.6rem] text-center' : 'min-w-[3.6rem] text-center sm:min-w-[4.6rem]'}
          >
            <div
              className={`font-display font-bold tabular-nums leading-none texto-ouro ${
                compacto ? 'text-2xl' : 'text-4xl sm:text-6xl'
              }`}
            >
              {b.v === undefined ? '––' : String(b.v).padStart(2, '0')}
            </div>
            <div
              className={`mt-2 uppercase tracking-[0.28em] text-texto-fraco ${
                compacto ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'
              }`}
            >
              {b.r}
            </div>
          </div>
          {i < blocos.length - 1 && (
            <span
              className={`font-display leading-none text-ouro/25 ${
                compacto ? 'text-xl' : 'text-3xl sm:text-5xl'
              }`}
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
