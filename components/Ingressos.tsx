'use client'

import { useEffect, useMemo, useState } from 'react'
import { Ornamento } from './OlhoDeHorus'
import { ModalPix } from './ModalPix'
import { formatarBRL, cpfValido, soDigitos } from '@/lib/validacao'
import { MAX_INGRESSOS_POR_CPF, type EventoConfig } from '@/config/site'

// ============================================================================
//  SEÇÃO DE INGRESSOS — seleção de lote + dados do comprador + PIX
// ============================================================================

interface Lote {
  id: number
  nome: string
  tipo: 'inteira' | 'meia'
  precoCentavos: number
  disponivel: number
  poucos: boolean
  esgotado: boolean
}

interface DadosPix {
  pedidoId: string
  qrCode: string
  qrCodeBase64: string
  expiraEm: string
  valorFormatado: string
}

// --- máscaras ---------------------------------------------------------------
const mascaraCpf = (v: string) =>
  soDigitos(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')

const mascaraTel = (v: string) => {
  const d = soDigitos(v).slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function Ingressos({ evento }: { evento: EventoConfig }) {
  const urlLotes = `/api/eventos/${evento.slug}/lotes`

  const [lotes, setLotes] = useState<Lote[]>([])
  const [carregandoLotes, setCarregandoLotes] = useState(true)
  const [qtds, setQtds] = useState<Record<number, number>>({})

  const [form, setForm] = useState({
    nome: '',
    email: '',
    emailConfirma: '',
    telefone: '',
    cpf: '',
    aceite: false,
  })
  const [erros, setErros] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [erroServidor, setErroServidor] = useState('')
  const [pix, setPix] = useState<DadosPix | null>(null)

  // ---- carrega os lotes ---------------------------------------------------
  useEffect(() => {
    fetch(urlLotes)
      .then((r) => r.json())
      .then((d) => setLotes(d.lotes ?? []))
      .catch(() => setLotes([]))
      .finally(() => setCarregandoLotes(false))
  }, [urlLotes])

  const total = useMemo(
    () =>
      lotes.reduce((s, l) => s + (qtds[l.id] ?? 0) * l.precoCentavos, 0),
    [lotes, qtds]
  )
  const totalIngressos = useMemo(
    () => Object.values(qtds).reduce((s, q) => s + q, 0),
    [qtds]
  )
  const temMeia = useMemo(
    () => lotes.some((l) => l.tipo === 'meia' && (qtds[l.id] ?? 0) > 0),
    [lotes, qtds]
  )

  function mudarQtd(loteId: number, delta: number, max: number) {
    setQtds((atual) => {
      const novo = { ...atual }
      const atualQtd = novo[loteId] ?? 0
      const outros = totalIngressos - atualQtd
      const alvo = Math.max(
        0,
        Math.min(atualQtd + delta, max, MAX_INGRESSOS_POR_CPF - outros)
      )
      if (alvo === 0) delete novo[loteId]
      else novo[loteId] = alvo
      return novo
    })
  }

  // ---- validação do formulário (espelha a do servidor) --------------------
  function validar(): boolean {
    const e: Record<string, string> = {}

    if (form.nome.trim().split(/\s+/).length < 2)
      e.nome = 'Informe nome e sobrenome'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'E-mail inválido'
    if (form.email.trim().toLowerCase() !== form.emailConfirma.trim().toLowerCase())
      e.emailConfirma = 'Os e-mails não conferem'
    if (soDigitos(form.telefone).length < 10) e.telefone = 'Telefone incompleto'
    if (!cpfValido(form.cpf)) e.cpf = 'CPF inválido'
    if (!form.aceite) e.aceite = 'É preciso aceitar os termos'
    if (totalIngressos === 0) e.qtd = 'Escolha pelo menos um ingresso'

    setErros(e)
    return Object.keys(e).length === 0
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    setErroServidor('')
    if (!validar()) {
      // leva o usuário até o primeiro erro em vez de deixá-lo procurando
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }

    setEnviando(true)
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          telefone: soDigitos(form.telefone),
          cpf: soDigitos(form.cpf),
          aceiteTermos: true,
          eventoSlug: evento.slug,
          itens: Object.entries(qtds).map(([loteId, quantidade]) => ({
            loteId: Number(loteId),
            quantidade,
          })),
        }),
      })

      const dados = await resp.json()
      if (!resp.ok) {
        setErroServidor(dados.erro ?? 'Não foi possível concluir a compra.')
        // O estoque pode ter mudado enquanto a pessoa preenchia o formulário.
        fetch(urlLotes).then((r) => r.json()).then((d) => setLotes(d.lotes ?? []))
        return
      }

      setPix(dados)
    } catch {
      setErroServidor('Falha de conexão. Verifique sua internet e tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  const esgotadoTudo =
    !carregandoLotes && lotes.length > 0 && lotes.every((l) => l.esgotado)

  return (
    <section id="ingressos" className="relative overflow-hidden px-5 py-24 sm:py-32">
      <div className="aurora opacity-50" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="text-center">
          <p className="rotulo">Garanta o seu</p>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            <span className="texto-ouro">Ingressos</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-texto-suave">
            Pagamento por PIX. O ingresso com QR Code chega no seu e-mail
            segundos depois da confirmação.
          </p>
        </div>

        <Ornamento className="my-12" />

        {/* --- LOTES --- */}
        {carregandoLotes ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="cartao h-24 animate-pulse opacity-40" />
            ))}
          </div>
        ) : lotes.length === 0 ? (
          <div className="cartao p-8 text-center">
            <p className="text-texto-suave">
              As vendas ainda não foram abertas. Siga a gente nas redes para
              saber na hora.
            </p>
          </div>
        ) : esgotadoTudo ? (
          <div className="cartao cartao-ouro p-8 text-center">
            <p className="font-display text-2xl font-bold texto-ouro">ESGOTADO</p>
            <p className="mt-3 text-sm text-texto-suave">
              Todos os lotes foram vendidos. Se alguém cancelar, o ingresso volta
              para cá automaticamente — vale ficar de olho.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lotes.map((lote) => {
              const qtd = qtds[lote.id] ?? 0
              const bloqueado =
                lote.esgotado ||
                (totalIngressos >= MAX_INGRESSOS_POR_CPF && qtd === 0)

              return (
                <div
                  key={lote.id}
                  className={`cartao flex items-center gap-4 p-5 transition-all ${
                    qtd > 0 ? 'cartao-ouro' : ''
                  } ${lote.esgotado ? 'opacity-45' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-texto">
                        {lote.nome}
                      </h3>
                      {lote.esgotado && (
                        <span className="rounded-full bg-erro/15 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-erro">
                          ESGOTADO
                        </span>
                      )}
                      {lote.poucos && !lote.esgotado && (
                        <span className="rounded-full bg-alerta/15 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-alerta">
                          RESTAM {lote.disponivel}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 font-display text-xl font-bold texto-ouro">
                      {formatarBRL(lote.precoCentavos)}
                    </p>
                    {lote.tipo === 'meia' && (
                      <p className="mt-1 text-[11px] leading-snug text-texto-fraco">
                        Lei 12.933/13 — comprovação obrigatória na portaria
                      </p>
                    )}
                  </div>

                  {/* Seletor de quantidade */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => mudarQtd(lote.id, -1, lote.disponivel)}
                      disabled={qtd === 0}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-borda text-lg text-texto transition-colors hover:border-ouro hover:text-ouro disabled:opacity-25"
                      aria-label={`Remover um ${lote.nome}`}
                    >
                      −
                    </button>
                    <span
                      className="w-9 text-center font-display text-lg font-bold tabular-nums"
                      aria-live="polite"
                    >
                      {qtd}
                    </span>
                    <button
                      type="button"
                      onClick={() => mudarQtd(lote.id, 1, lote.disponivel)}
                      disabled={bloqueado}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-borda text-lg text-texto transition-colors hover:border-ouro hover:text-ouro disabled:opacity-25"
                      aria-label={`Adicionar um ${lote.nome}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}

            {totalIngressos >= MAX_INGRESSOS_POR_CPF && (
              <p className="text-center text-xs text-texto-fraco">
                Limite de {MAX_INGRESSOS_POR_CPF} ingressos por CPF.
              </p>
            )}
            {erros.qtd && (
              <p className="text-center text-sm text-erro">{erros.qtd}</p>
            )}
          </div>
        )}

        {/* --- FORMULÁRIO --- */}
        {!esgotadoTudo && lotes.length > 0 && (
          <form onSubmit={enviar} className="cartao mt-6 p-6 sm:p-8" noValidate>
            <p className="rotulo">Seus dados</p>
            <p className="mt-2 text-xs text-texto-fraco">
              O ingresso é nominal. Use os dados de quem vai entrar — ou
              transfira depois, na página Meus Ingressos.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Campo
                rotulo="Nome completo"
                id="nome"
                erro={erros.nome}
                className="sm:col-span-2"
              >
                <input
                  id="nome"
                  className="campo"
                  autoComplete="name"
                  placeholder="Jim Morrison"
                  value={form.nome}
                  aria-invalid={!!erros.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </Campo>

              <Campo rotulo="E-mail" id="email" erro={erros.email}>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  className="campo"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={form.email}
                  aria-invalid={!!erros.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Campo>

              <Campo
                rotulo="Confirme o e-mail"
                id="email2"
                erro={erros.emailConfirma}
              >
                <input
                  id="email2"
                  type="email"
                  inputMode="email"
                  className="campo"
                  placeholder="voce@email.com"
                  // colar aqui derrota o propósito da confirmação
                  onPaste={(e) => e.preventDefault()}
                  value={form.emailConfirma}
                  aria-invalid={!!erros.emailConfirma}
                  onChange={(e) =>
                    setForm({ ...form, emailConfirma: e.target.value })
                  }
                />
              </Campo>

              <Campo rotulo="CPF" id="cpf" erro={erros.cpf}>
                <input
                  id="cpf"
                  inputMode="numeric"
                  className="campo"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  aria-invalid={!!erros.cpf}
                  onChange={(e) =>
                    setForm({ ...form, cpf: mascaraCpf(e.target.value) })
                  }
                />
              </Campo>

              <Campo rotulo="Celular / WhatsApp" id="tel" erro={erros.telefone}>
                <input
                  id="tel"
                  inputMode="tel"
                  className="campo"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  value={form.telefone}
                  aria-invalid={!!erros.telefone}
                  onChange={(e) =>
                    setForm({ ...form, telefone: mascaraTel(e.target.value) })
                  }
                />
              </Campo>
            </div>

            {temMeia && (
              <div className="mt-6 rounded-xl border border-alerta/35 bg-alerta/[0.07] p-4">
                <p className="text-xs leading-relaxed text-alerta">
                  <strong>Meia-entrada selecionada.</strong> É obrigatório
                  apresentar o comprovante na portaria — carteirinha de
                  estudante, documento de idade, laudo ou CadÚnico. Sem
                  comprovação, a diferença para a inteira é cobrada na entrada.
                </p>
              </div>
            )}

            <label className="mt-6 flex cursor-pointer gap-3">
              <input
                type="checkbox"
                checked={form.aceite}
                aria-invalid={!!erros.aceite}
                onChange={(e) => setForm({ ...form, aceite: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#d4a64a]"
              />
              <span className="text-xs leading-relaxed text-texto-suave">
                Li e aceito os{' '}
                <a href="/termos" target="_blank" className="text-ouro underline underline-offset-2">
                  Termos de Compra
                </a>{' '}
                e a{' '}
                <a href="/privacidade" target="_blank" className="text-ouro underline underline-offset-2">
                  Política de Privacidade
                </a>
                , incluindo a política de cancelamento de 7 dias.
              </span>
            </label>
            {erros.aceite && (
              <p className="mt-2 text-xs text-erro">{erros.aceite}</p>
            )}

            {/* --- TOTAL + AÇÃO --- */}
            <div className="mt-8 border-t border-borda pt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-texto-fraco">
                    {totalIngressos} ingresso{totalIngressos === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold texto-ouro">
                    {formatarBRL(total)}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={enviando || totalIngressos === 0}
                  className="botao-ouro shrink-0"
                >
                  {enviando ? 'Gerando PIX…' : 'Pagar com PIX'}
                </button>
              </div>

              {erroServidor && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-erro/40 bg-erro/10 p-3 text-sm text-erro"
                >
                  {erroServidor}
                </p>
              )}

              <p className="mt-4 text-center text-[11px] leading-relaxed text-texto-fraco">
                Seus dados trafegam criptografados e o pagamento é processado
                pelo Mercado Pago. A Golden Eye não armazena dados bancários.
              </p>
            </div>
          </form>
        )}
      </div>

      {pix && (
        <ModalPix
          dados={pix}
          onFechar={() => {
            setPix(null)
            setQtds({})
            fetch(urlLotes).then((r) => r.json()).then((d) => setLotes(d.lotes ?? []))
          }}
        />
      )}
    </section>
  )
}

// ----------------------------------------------------------------------------
function Campo({
  rotulo,
  id,
  erro,
  className = '',
  children,
}: {
  rotulo: string
  id: string
  erro?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-texto-suave">
        {rotulo}
      </label>
      {children}
      {erro && <p className="mt-1.5 text-xs text-erro">{erro}</p>}
    </div>
  )
}
