'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Marca, OlhoDeHorus } from '@/components/OlhoDeHorus'
import { Modal, ModalAviso } from '@/components/Modal'
import { formatarBRL, cpfValido, soDigitos } from '@/lib/validacao'
import { produtora } from '@/config/site'

// ============================================================================
//  /meus-ingressos — autoatendimento do comprador
//  Ver o QR, transferir titularidade e cancelar dentro do prazo do CDC,
//  sem precisar falar com ninguém às 3 da manhã.
// ============================================================================

interface Ingresso {
  id: string
  tipo: string
  titularNome: string
  titularCpf: string
  tokenQr: string | null
  status: string
  usadoEm: string | null
}

interface Pedido {
  id: string
  status: string
  valorTotal: number
  pagoEm: string | null
  evento: { nome: string; local: string; data: string; aberturaPortoes: string }
  podeCancelar: boolean
  podeTransferir: boolean
  motivoBloqueio: string
  ingressos: Ingresso[]
}

export default function MeusIngressos() {
  const [fase, setFase] = useState<'carregando' | 'login' | 'lista'>('carregando')
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [qrAberto, setQrAberto] = useState<Ingresso | null>(null)

  // Modais próprios no lugar de alert/confirm/prompt do navegador
  const [aviso, setAviso] = useState<{ titulo: string; texto: string; tom?: 'ok' | 'erro' } | null>(null)
  const [confirmarCancel, setConfirmarCancel] = useState<Pedido | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [transferindo, setTransferindo] = useState<Ingresso | null>(null)
  const [novoTitular, setNovoTitular] = useState({ nome: '', cpf: '' })
  const [erroTransf, setErroTransf] = useState('')
  const [salvandoTransf, setSalvandoTransf] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const r = await fetch('/api/meus-ingressos', { cache: 'no-store' })
      if (r.status === 401) {
        setFase('login')
        return
      }
      const d = await r.json()
      setPedidos(d.pedidos ?? [])
      setFase('lista')
    } catch {
      setFase('login')
    }
  }, [])

  // Se veio pelo magic link, troca o token por sessão antes de listar.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      fetch(`/api/magic-link?token=${token}`)
        .then(async (r) => {
          const d = await r.json()
          if (!r.ok) {
            setErro(d.erro ?? 'Link inválido')
            setFase('login')
            return
          }
          // limpa o token da URL para não ficar no histórico do navegador
          window.history.replaceState({}, '', '/meus-ingressos')
          carregar()
        })
        .catch(() => setFase('login'))
    } else {
      carregar()
    }
  }, [carregar])

  async function pedirLink(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      const r = await fetch('/api/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await r.json()
      if (!r.ok) setErro(d.erro ?? 'Erro ao enviar')
      else setEnviado(true)
    } catch {
      setErro('Falha de conexão.')
    } finally {
      setEnviando(false)
    }
  }

  async function cancelar(pedido: Pedido) {
    setCancelando(true)
    try {
      const r = await fetch(`/api/pedidos/${pedido.id}/cancelar`, { method: 'POST' })
      const d = await r.json()
      setConfirmarCancel(null)
      setAviso({
        titulo: r.ok ? 'Cancelamento confirmado' : 'Não foi possível cancelar',
        texto: d.mensagem ?? d.erro ?? 'Solicitação processada.',
        tom: r.ok ? 'ok' : 'erro',
      })
      carregar()
    } catch {
      setAviso({
        titulo: 'Falha de conexão',
        texto: 'Não conseguimos falar com o servidor. Tente de novo em instantes.',
        tom: 'erro',
      })
    } finally {
      setCancelando(false)
    }
  }

  async function transferir(e: React.FormEvent) {
    e.preventDefault()
    if (!transferindo) return

    // Valida antes de mandar — com prompt() do navegador isso era impossível,
    // e a pessoa só descobria o erro depois de digitar os dois campos.
    if (novoTitular.nome.trim().split(/\s+/).length < 2) {
      setErroTransf('Informe nome e sobrenome')
      return
    }
    if (!cpfValido(novoTitular.cpf)) {
      setErroTransf('CPF inválido')
      return
    }

    setSalvandoTransf(true)
    setErroTransf('')
    try {
      const r = await fetch(`/api/ingressos/${transferindo.id}/transferir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoTitular.nome.trim(), cpf: soDigitos(novoTitular.cpf) }),
      })
      const d = await r.json()
      if (!r.ok) {
        setErroTransf(d.erro ?? 'Não foi possível transferir')
        return
      }
      setTransferindo(null)
      setNovoTitular({ nome: '', cpf: '' })
      setAviso({ titulo: 'Ingresso transferido', texto: d.mensagem, tom: 'ok' })
      carregar()
    } catch {
      setErroTransf('Falha de conexão')
    } finally {
      setSalvandoTransf(false)
    }
  }

  // ---- carregando ---------------------------------------------------------
  if (fase === 'carregando') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="pulsar-olho">
          <OlhoDeHorus tamanho={64} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-block">
          <Marca compacta />
        </Link>

        {/* ================= LOGIN ================= */}
        {fase === 'login' && (
          <div className="cartao mx-auto mt-16 max-w-md p-8">
            <h1 className="font-display text-2xl font-bold texto-ouro">
              Meus ingressos
            </h1>

            {enviado ? (
              <div className="mt-6">
                <p className="text-sm leading-relaxed text-texto-suave">
                  Se houver uma compra com <strong className="text-texto">{email}</strong>,
                  o link de acesso já está a caminho. Ele vale por 15 minutos.
                </p>
                <p className="mt-4 text-xs text-texto-fraco">
                  Não chegou? Confira a caixa de spam e a lixeira. Se ainda
                  assim nada, chame a produção no WhatsApp.
                </p>
                <button
                  onClick={() => setEnviado(false)}
                  className="botao-fantasma mt-6 w-full !py-3 !text-sm"
                >
                  Usar outro e-mail
                </button>
              </div>
            ) : (
              <form onSubmit={pedirLink} className="mt-6">
                <p className="text-sm leading-relaxed text-texto-suave">
                  Digite o e-mail usado na compra. Enviamos um link de acesso —
                  sem senha para lembrar.
                </p>
                <input
                  type="email"
                  required
                  className="campo mt-5"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                {erro && <p className="mt-3 text-sm text-erro">{erro}</p>}
                <button
                  type="submit"
                  disabled={enviando}
                  className="botao-ouro mt-5 w-full"
                >
                  {enviando ? 'Enviando…' : 'Receber link de acesso'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ================= LISTA ================= */}
        {fase === 'lista' && (
          <div className="mt-12">
            <h1 className="font-display text-3xl font-bold texto-ouro">
              Meus ingressos
            </h1>

            {pedidos.length === 0 ? (
              <div className="cartao mt-8 p-8 text-center">
                <p className="text-texto-suave">
                  Nenhuma compra encontrada neste e-mail.
                </p>
                <Link href="/#ingressos" className="botao-ouro mt-6 inline-flex">
                  Ver ingressos disponíveis
                </Link>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {pedidos.map((p) => (
                  <div key={p.id} className="cartao p-6 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-xl font-bold text-texto">
                          {p.evento.nome}
                        </h2>
                        <p className="mt-1 text-sm text-texto-suave">
                          {new Intl.DateTimeFormat('pt-BR', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                            timeZone: 'America/Sao_Paulo',
                          }).format(new Date(p.evento.data))}
                          {' · '}
                          {p.evento.local}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold tracking-widest ${
                          p.status === 'pago'
                            ? 'bg-ok/15 text-ok'
                            : 'bg-erro/15 text-erro'
                        }`}
                      >
                        {p.status === 'pago' ? 'CONFIRMADO' : 'REEMBOLSADO'}
                      </span>
                    </div>

                    <div className="mt-6 space-y-2">
                      {p.ingressos.map((i) => (
                        <div
                          key={i.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-borda bg-noite/50 p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-texto">
                              {i.titularNome}
                            </p>
                            <p className="mt-0.5 text-xs text-texto-fraco">
                              {i.titularCpf} ·{' '}
                              <span className={i.tipo === 'meia' ? 'text-alerta' : ''}>
                                {i.tipo === 'meia' ? 'Meia-entrada' : 'Inteira'}
                              </span>
                              {i.status === 'usado' && ' · Já utilizado'}
                              {i.status === 'cancelado' && ' · Cancelado'}
                            </p>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            {i.tokenQr && (
                              <button
                                onClick={() => setQrAberto(i)}
                                className="botao-fantasma !px-4 !py-2 !text-xs"
                              >
                                Ver QR
                              </button>
                            )}
                            {p.podeTransferir && i.status === 'valido' && (
                              <button
                                onClick={() => { setTransferindo(i); setNovoTitular({ nome: '', cpf: '' }); setErroTransf('') }}
                                className="botao-fantasma !px-4 !py-2 !text-xs"
                              >
                                Transferir
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-borda pt-5">
                      <p className="text-sm text-texto-suave">
                        Total:{' '}
                        <strong className="text-texto">
                          {formatarBRL(p.valorTotal)}
                        </strong>
                      </p>

                      {p.podeCancelar ? (
                        <button
                          onClick={() => setConfirmarCancel(p)}
                          className="text-xs text-erro underline underline-offset-4 hover:opacity-80"
                        >
                          Cancelar e pedir reembolso
                        </button>
                      ) : (
                        <p className="max-w-sm text-right text-[11px] leading-snug text-texto-fraco">
                          {p.motivoBloqueio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= CONFIRMAR CANCELAMENTO ================= */}
      <Modal
        aberto={confirmarCancel !== null}
        titulo="Cancelar a compra?"
        onFechar={() => !cancelando && setConfirmarCancel(null)}
      >
        {confirmarCancel && (
          <>
            <p className="text-sm leading-relaxed text-texto-suave">
              Você vai receber de volta{' '}
              <strong className="text-texto">
                {formatarBRL(confirmarCancel.valorTotal)}
              </strong>{' '}
              pela mesma chave PIX usada na compra — normalmente em poucos
              minutos.
            </p>
            <div className="mt-4 rounded-xl border border-erro/30 bg-erro/[0.07] p-4">
              <p className="text-xs leading-relaxed text-erro">
                Seus {confirmarCancel.ingressos.length} ingresso
                {confirmarCancel.ingressos.length === 1 ? '' : 's'} serão
                invalidados na hora e não servirão mais para entrar.
                <strong> Esta ação não pode ser desfeita.</strong>
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                onClick={() => cancelar(confirmarCancel)}
                disabled={cancelando}
                className="botao-ouro flex-1"
              >
                {cancelando ? 'Processando…' : 'Sim, cancelar'}
              </button>
              <button
                onClick={() => setConfirmarCancel(null)}
                disabled={cancelando}
                className="botao-fantasma flex-1"
              >
                Voltar
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ================= TRANSFERIR TITULARIDADE ================= */}
      <Modal
        aberto={transferindo !== null}
        titulo="Transferir ingresso"
        onFechar={() => !salvandoTransf && setTransferindo(null)}
      >
        <form onSubmit={transferir}>
          <p className="text-sm leading-relaxed text-texto-suave">
            O ingresso passa para o nome de outra pessoa. Ela precisa levar
            documento com foto que confira com estes dados.
          </p>

          <label htmlFor="t-nome" className="mb-1.5 mt-5 block text-xs text-texto-suave">
            Nome completo do novo titular
          </label>
          <input
            id="t-nome"
            className="campo"
            placeholder="Maria da Silva"
            value={novoTitular.nome}
            onChange={(e) => setNovoTitular({ ...novoTitular, nome: e.target.value })}
          />

          <label htmlFor="t-cpf" className="mb-1.5 mt-4 block text-xs text-texto-suave">
            CPF
          </label>
          <input
            id="t-cpf"
            inputMode="numeric"
            className="campo"
            placeholder="000.000.000-00"
            value={novoTitular.cpf}
            onChange={(e) =>
              setNovoTitular({
                ...novoTitular,
                cpf: soDigitos(e.target.value)
                  .slice(0, 11)
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
              })
            }
          />

          {erroTransf && <p className="mt-3 text-sm text-erro">{erroTransf}</p>}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <button type="submit" disabled={salvandoTransf} className="botao-ouro flex-1">
              {salvandoTransf ? 'Transferindo…' : 'Transferir'}
            </button>
            <button
              type="button"
              onClick={() => setTransferindo(null)}
              disabled={salvandoTransf}
              className="botao-fantasma flex-1"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= AVISO ================= */}
      <ModalAviso
        aberto={aviso !== null}
        titulo={aviso?.titulo ?? ''}
        mensagem={aviso?.texto ?? ''}
        tom={aviso?.tom}
        onFechar={() => setAviso(null)}
      />

      {/* ================= QR EM TELA CHEIA ================= */}
      {qrAberto?.tokenQr && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-noite/97 p-5 backdrop-blur-lg"
          onClick={() => setQrAberto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr?t=${encodeURIComponent(qrAberto.tokenQr)}`}
                alt="QR Code do ingresso"
                width={280}
                height={280}
                className="block h-[280px] w-[280px]"
              />
            </div>
            <p className="mt-5 font-display text-lg font-bold text-texto">
              {qrAberto.titularNome}
            </p>
            <p className="mt-1 text-xs text-texto-suave">
              {qrAberto.tipo === 'meia' ? 'Meia-entrada' : 'Inteira'}
            </p>
            {qrAberto.tipo === 'meia' && (
              <p className="mx-auto mt-4 max-w-[280px] text-[11px] leading-relaxed text-alerta">
                Leve o comprovante de meia-entrada, ou a diferença será cobrada
                na portaria.
              </p>
            )}
            <p className="mt-6 text-xs text-texto-fraco">
              Aumente o brilho da tela na hora de entrar
            </p>
            <button
              onClick={() => setQrAberto(null)}
              className="botao-fantasma mt-6 !py-2.5 !text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <footer className="mx-auto mt-20 max-w-3xl border-t border-borda pt-8 text-center text-xs text-texto-fraco">
        Precisa de ajuda? {produtora.emailIngressos} ·{' '}
        <a
          href={`https://wa.me/${produtora.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ouro"
        >
          WhatsApp
        </a>
      </footer>
    </div>
  )
}
