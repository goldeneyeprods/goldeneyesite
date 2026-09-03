'use client'

import { useEffect, useRef, useState } from 'react'
import { OlhoDeHorus } from './OlhoDeHorus'

// ============================================================================
//  MODAL DO PIX
//  Mostra o QR, o código copia-e-cola, o cronômetro de expiração e fica
//  perguntando ao servidor se o pagamento caiu.
// ============================================================================

interface Props {
  dados: {
    pedidoId: string
    qrCode: string
    qrCodeBase64: string
    expiraEm: string
    valorFormatado: string
  }
  onFechar: () => void
}

type Estado = 'aguardando' | 'pago' | 'expirado' | 'erro'

export function ModalPix({ dados, onFechar }: Props) {
  const [estado, setEstado] = useState<Estado>('aguardando')
  const [restante, setRestante] = useState('')
  const [copiado, setCopiado] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)

  // ---- cronômetro ---------------------------------------------------------
  useEffect(() => {
    const alvo = new Date(dados.expiraEm).getTime()
    const tique = () => {
      const delta = alvo - Date.now()
      if (delta <= 0) {
        setRestante('00:00')
        setEstado((e) => (e === 'aguardando' ? 'expirado' : e))
        return
      }
      const m = Math.floor(delta / 60000)
      const s = Math.floor((delta / 1000) % 60)
      setRestante(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tique()
    const id = setInterval(tique, 1000)
    return () => clearInterval(id)
  }, [dados.expiraEm])

  // ---- polling do status --------------------------------------------------
  useEffect(() => {
    if (estado !== 'aguardando') return

    let vivo = true
    let intervalo = 3000 // começa rápido: PIX costuma cair em segundos
    let tentativas = 0

    const consultar = async () => {
      if (!vivo) return
      try {
        const r = await fetch(`/api/pedidos/${dados.pedidoId}/status`, {
          cache: 'no-store',
        })
        const d = await r.json()

        if (d.status === 'pago') {
          setEstado('pago')
          return
        }
        if (['expirado', 'cancelado'].includes(d.status)) {
          setEstado('expirado')
          return
        }
      } catch {
        /* rede oscilou; tenta de novo no próximo ciclo */
      }

      // Backoff suave: alivia o servidor de quem deixa a aba aberta e sai.
      tentativas++
      if (tentativas > 20) intervalo = 8000
      if (tentativas > 60) intervalo = 15000

      if (vivo) setTimeout(consultar, intervalo)
    }

    const id = setTimeout(consultar, intervalo)
    return () => {
      vivo = false
      clearTimeout(id)
    }
  }, [dados.pedidoId, estado])

  // ---- fechar com Esc + foco preso no modal -------------------------------
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && estado !== 'aguardando') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    areaRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [estado, onFechar])

  async function copiar() {
    try {
      // navigator.clipboard é o caminho moderno; execCommand está obsoleto.
      await navigator.clipboard.writeText(dados.qrCode)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Safari antigo e contextos sem HTTPS caem aqui: seleciona para o
      // usuário copiar na mão.
      const el = document.getElementById('pix-codigo') as HTMLTextAreaElement | null
      el?.select()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-noite/93 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-pix"
    >
      <div
        ref={areaRef}
        tabIndex={-1}
        className="cartao cartao-ouro surgir my-auto w-full max-w-md p-7 outline-none sm:p-8"
      >
        {/* ================= AGUARDANDO ================= */}
        {estado === 'aguardando' && (
          <>
            <div className="text-center">
              <p className="rotulo">Pague com PIX</p>
              <h3 id="titulo-pix" className="mt-3 font-display text-2xl font-bold texto-ouro">
                {dados.valorFormatado}
              </h3>
              <p className="mt-2 text-xs text-texto-suave">
                Abra o app do seu banco, escaneie o código e pronto.
              </p>
            </div>

            <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${dados.qrCodeBase64}`}
                alt="QR Code do PIX"
                width={228}
                height={228}
                className="block h-[228px] w-[228px]"
              />
            </div>

            <div className="mt-6">
              <label htmlFor="pix-codigo" className="mb-2 block text-xs text-texto-suave">
                Ou use o PIX copia-e-cola:
              </label>
              <textarea
                id="pix-codigo"
                readOnly
                rows={3}
                value={dados.qrCode}
                onClick={(e) => e.currentTarget.select()}
                className="campo resize-none font-mono text-[10px] leading-relaxed"
              />
              <button onClick={copiar} className="botao-fantasma mt-3 w-full !py-3 !text-sm">
                {copiado ? '✓ Código copiado' : 'Copiar código PIX'}
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-borda bg-noite/60 py-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-ouro" aria-hidden="true" />
              <span className="text-xs text-texto-suave">
                Aguardando pagamento · expira em{' '}
                <strong className="tabular-nums text-texto">{restante}</strong>
              </span>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-texto-fraco">
              Esta tela reconhece o pagamento sozinha. Não feche até confirmar —
              mas se fechar, o ingresso ainda vai para o seu e-mail.
            </p>
          </>
        )}

        {/* ================= PAGO ================= */}
        {estado === 'pago' && (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-ok/40 bg-ok/10">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#3ddc97" strokeWidth="2.4">
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h3 id="titulo-pix" className="mt-6 font-display text-3xl font-bold texto-ouro">
              Você está dentro
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-texto-suave">
              Pagamento confirmado. Seu ingresso com QR Code já foi enviado para
              o seu e-mail — confira também a caixa de spam.
            </p>

            <div className="my-7 flex justify-center opacity-70">
              <OlhoDeHorus tamanho={64} />
            </div>

            <a href="/meus-ingressos" className="botao-ouro w-full">
              Ver meu ingresso
            </a>
            <button onClick={onFechar} className="mt-3 w-full py-3 text-xs text-texto-fraco">
              Voltar ao site
            </button>
          </div>
        )}

        {/* ================= EXPIRADO ================= */}
        {estado === 'expirado' && (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-erro/40 bg-erro/10">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4770" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6M12 16.5v.01" strokeLinecap="round" />
              </svg>
            </div>
            <h3 id="titulo-pix" className="mt-5 font-display text-2xl font-bold text-texto">
              PIX expirado
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-texto-suave">
              O tempo para pagar acabou e os ingressos voltaram para o estoque.
              Nenhum valor foi cobrado. É só refazer a compra.
            </p>
            <button onClick={onFechar} className="botao-ouro mt-7 w-full">
              Escolher ingressos de novo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
