'use client'

import { useEffect, useState } from 'react'

// "Faltam 10 dias, 19 h" — só calcula no navegador, para não chegar com o
// número errado do servidor (hidratação).
export function ContagemCurta({ ate, className = '' }: { ate: string; className?: string }) {
  const [texto, setTexto] = useState<string | null>(null)

  useEffect(() => {
    const alvo = new Date(ate).getTime()
    const tique = () => {
      const ms = alvo - Date.now()
      if (ms <= 0) return setTexto('')
      const dias = Math.floor(ms / 86_400_000)
      const horas = Math.floor((ms / 3_600_000) % 24)
      const min = Math.floor((ms / 60_000) % 60)
      setTexto(
        dias > 0
          ? `${dias} ${dias === 1 ? 'dia' : 'dias'}, ${horas} h`
          : `${horas} h, ${min} min`
      )
    }
    tique()
    const id = setInterval(tique, 30_000)
    return () => clearInterval(id)
  }, [ate])

  if (texto === '') {
    return <p className={`cinema text-lg text-texto ${className}`}>É hoje.</p>
  }

  return (
    <p className={`text-sm text-texto-suave ${className}`}>
      Faltam{' '}
      <span className="cinema text-lg text-texto" suppressHydrationWarning>
        {texto ?? '…'}
      </span>
    </p>
  )
}
