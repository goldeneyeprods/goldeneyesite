'use client'

import { useEffect, useRef } from 'react'

// ============================================================================
//  MODAL — substitui alert(), confirm() e prompt() do navegador.
//
//  Aquelas caixinhas cinzas do sistema destoam de tudo, não dá para validar
//  o que a pessoa digita, e no celular elas travam a tela de um jeito feio.
//  Aqui a janela tem a cara do site, valida antes de fechar, respeita Esc e
//  devolve o foco para onde estava.
// ============================================================================

export function Modal({
  aberto,
  titulo,
  children,
  onFechar,
  larguraMax = 'max-w-md',
}: {
  aberto: boolean
  titulo: string
  children: React.ReactNode
  onFechar: () => void
  larguraMax?: string
}) {
  const caixaRef = useRef<HTMLDivElement>(null)
  const focoAnterior = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!aberto) return

    focoAnterior.current = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()

      // Prende o Tab dentro do modal: sem isso o foco escapa para a página
      // atrás, que está inerte — e quem navega por teclado se perde.
      if (e.key === 'Tab' && caixaRef.current) {
        const focaveis = caixaRef.current.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
        )
        if (focaveis.length === 0) return
        const primeiro = focaveis[0]
        const ultimo = focaveis[focaveis.length - 1]

        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primeiro.focus()
        }
      }
    }

    document.addEventListener('keydown', aoTeclar)

    // foca o primeiro campo, ou a própria caixa
    const alvo = caixaRef.current?.querySelector<HTMLElement>('input, button')
    alvo?.focus()

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
      focoAnterior.current?.focus()
    }
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-[98] flex items-center justify-center overflow-y-auto bg-noite/93 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal"
      onClick={onFechar}
    >
      <div
        ref={caixaRef}
        onClick={(e) => e.stopPropagation()}
        className={`cartao surgir my-auto w-full ${larguraMax} p-6 sm:p-7`}
      >
        <h2 id="titulo-modal" className="font-display text-xl font-bold text-texto">
          {titulo}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
//  Aviso simples — o que antes era alert()
// ----------------------------------------------------------------------------
export function ModalAviso({
  aberto,
  titulo,
  mensagem,
  tom = 'neutro',
  onFechar,
}: {
  aberto: boolean
  titulo: string
  mensagem: string
  tom?: 'neutro' | 'ok' | 'erro'
  onFechar: () => void
}) {
  const cor =
    tom === 'ok' ? 'text-ok' : tom === 'erro' ? 'text-erro' : 'text-texto-suave'

  return (
    <Modal aberto={aberto} titulo={titulo} onFechar={onFechar}>
      <p className={`text-sm leading-relaxed ${cor}`}>{mensagem}</p>
      <button onClick={onFechar} className="botao-ouro mt-6 w-full">
        Entendi
      </button>
    </Modal>
  )
}
