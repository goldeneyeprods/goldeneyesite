'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { OlhoDeHorus } from '@/components/OlhoDeHorus'

// ============================================================================
//  APP DE PORTARIA — PWA de check-in
//
//  Pensado para uso real: uma mão só, no escuro, com barulho, internet ruim.
//  Por isso: feedback ocupando a tela inteira, vibração, som, e modo offline.
// ============================================================================

type Resultado =
  | { resultado: 'ok'; nome: string; tipo: 'inteira' | 'meia'; cpf: string; pedido: string }
  | { resultado: 'ja_usado'; nome: string; usadoEm: string; usadoPor: string | null }
  | { resultado: 'cancelado'; nome: string }
  | { resultado: 'invalido'; motivo: string }
  | { resultado: 'offline_ok'; nome: string; tipo: string }

interface Operador {
  id: number
  nome: string
  gate: string
  /** só aparece na lista de login, para escolher o evento certo */
  evento?: string
}

const CHAVE_TOKEN = 'ge_portaria_token'
const CHAVE_OPERADOR = 'ge_portaria_operador'
const CHAVE_PACOTE = 'ge_portaria_pacote'
const CHAVE_FILA = 'ge_portaria_fila'

export default function Portaria() {
  const [token, setToken] = useState<string | null>(null)
  const [operador, setOperador] = useState<Operador | null>(null)
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [opSelecionado, setOpSelecionado] = useState<number | null>(null)
  const [pin, setPin] = useState('')
  const [erroLogin, setErroLogin] = useState('')

  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [escaneando, setEscaneando] = useState(false)
  const [online, setOnline] = useState(true)
  const [pendentes, setPendentes] = useState(0)
  const [modo, setModo] = useState<'scanner' | 'busca'>('scanner')

  const [busca, setBusca] = useState('')
  const [resultadosBusca, setResultadosBusca] = useState<
    { id: string; nome: string; cpf: string; cpfFinal: string; tipo: string; status: string }[]
  >([])

  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const ultimoTokenRef = useRef<string>('')
  const audioRef = useRef<AudioContext | null>(null)

  // ---- restaura sessão ----------------------------------------------------
  useEffect(() => {
    // Registra o service worker: é ele que faz a portaria abrir sem internet.
    // Só em produção — em desenvolvimento os arquivos mudam a cada
    // recompilação, e um worker guardando versões velhas faz a tela abrir
    // sem estilo. Aqui também limpamos qualquer worker que tenha sobrado.
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(() => {})
      } else {
        navigator.serviceWorker
          .getRegistrations()
          .then((rs) => rs.forEach((r) => r.unregister()))
          .catch(() => {})
        caches?.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {})
      }
    }

    const t = localStorage.getItem(CHAVE_TOKEN)
    const o = localStorage.getItem(CHAVE_OPERADOR)
    if (t && o) {
      setToken(t)
      setOperador(JSON.parse(o))
    } else {
      fetch('/api/portaria/login')
        .then((r) => r.json())
        .then((d) => setOperadores(d.operadores ?? []))
        .catch(() => {})
    }

    const fila = JSON.parse(localStorage.getItem(CHAVE_FILA) ?? '[]')
    setPendentes(fila.length)

    const atualizarRede = () => setOnline(navigator.onLine)
    atualizarRede()
    window.addEventListener('online', atualizarRede)
    window.addEventListener('offline', atualizarRede)
    return () => {
      window.removeEventListener('online', atualizarRede)
      window.removeEventListener('offline', atualizarRede)
    }
  }, [])

  // ---- feedback sonoro (WebAudio: não precisa carregar arquivo) -----------
  const bipar = useCallback((sucesso: boolean) => {
    try {
      audioRef.current ??= new AudioContext()
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const ganho = ctx.createGain()
      osc.connect(ganho)
      ganho.connect(ctx.destination)
      osc.frequency.value = sucesso ? 880 : 220
      ganho.gain.setValueAtTime(0.18, ctx.currentTime)
      ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch {
      /* som é bônus; sem ele o app continua funcionando */
    }
  }, [])

  // ---- sincroniza a fila offline -----------------------------------------
  const sincronizar = useCallback(async () => {
    const fila = JSON.parse(localStorage.getItem(CHAVE_FILA) ?? '[]')
    if (fila.length === 0 || !navigator.onLine || !token) return

    try {
      const r = await fetch('/api/portaria/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fila }),
      })
      if (r.ok) {
        localStorage.setItem(CHAVE_FILA, '[]')
        setPendentes(0)
      }
    } catch {
      /* tenta de novo no próximo evento de rede */
    }
  }, [token])

  useEffect(() => {
    if (online && token) sincronizar()
  }, [online, token, sincronizar])

  // ---- baixa o pacote offline ao entrar -----------------------------------
  const baixarPacote = useCallback(async (t: string) => {
    try {
      const r = await fetch('/api/portaria/sync', {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (r.ok) {
        const d = await r.json()
        localStorage.setItem(CHAVE_PACOTE, JSON.stringify(d))
      }
    } catch {
      /* sem pacote, o app funciona só online */
    }
  }, [])

  useEffect(() => {
    if (token) baixarPacote(token)
  }, [token, baixarPacote])

  // ---- login --------------------------------------------------------------
  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErroLogin('')
    try {
      const r = await fetch('/api/portaria/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operadorId: opSelecionado, pin }),
      })
      const d = await r.json()
      if (!r.ok) {
        setErroLogin(d.erro ?? 'Erro ao entrar')
        setPin('')
        return
      }
      localStorage.setItem(CHAVE_TOKEN, d.token)
      localStorage.setItem(CHAVE_OPERADOR, JSON.stringify(d.operador))
      setToken(d.token)
      setOperador(d.operador)
    } catch {
      setErroLogin('Sem conexão com o servidor.')
    }
  }

  function sair() {
    localStorage.removeItem(CHAVE_TOKEN)
    localStorage.removeItem(CHAVE_OPERADOR)
    location.reload()
  }

  // ---- processa um QR lido ------------------------------------------------
  const processar = useCallback(
    async (tokenLido: string) => {
      // Evita disparar 15 vezes enquanto o QR fica parado na frente da câmera.
      if (tokenLido === ultimoTokenRef.current) return
      ultimoTokenRef.current = tokenLido
      setTimeout(() => (ultimoTokenRef.current = ''), 2500)

      if (!navigator.onLine) {
        // ---- MODO OFFLINE ----
        const pacote = JSON.parse(localStorage.getItem(CHAVE_PACOTE) ?? 'null')
        const fila = JSON.parse(localStorage.getItem(CHAVE_FILA) ?? '[]')

        // Já foi lido nesta mesma sessão offline?
        if (fila.some((f: { token: string }) => f.token === tokenLido)) {
          setResultado({ resultado: 'ja_usado', nome: '—', usadoEm: 'agora há pouco', usadoPor: null })
          navigator.vibrate?.([80, 60, 80])
          bipar(false)
          return
        }

        const hash = await hashLocal(tokenLido)
        const achado = pacote?.ingressos?.find((i: { h: string }) => i.h === hash)

        if (!achado) {
          setResultado({ resultado: 'invalido', motivo: 'Não está na lista offline' })
          navigator.vibrate?.([120, 70, 120])
          bipar(false)
          return
        }
        if (achado.s === 'usado') {
          setResultado({ resultado: 'ja_usado', nome: achado.n, usadoEm: 'antes de ficar offline', usadoPor: null })
          navigator.vibrate?.([80, 60, 80])
          bipar(false)
          return
        }

        fila.push({ token: tokenLido, em: new Date().toISOString() })
        localStorage.setItem(CHAVE_FILA, JSON.stringify(fila))
        setPendentes(fila.length)
        achado.s = 'usado'
        localStorage.setItem(CHAVE_PACOTE, JSON.stringify(pacote))

        setResultado({ resultado: 'offline_ok', nome: achado.n, tipo: achado.t })
        navigator.vibrate?.(60)
        bipar(true)
        return
      }

      // ---- MODO ONLINE ----
      try {
        const r = await fetch('/api/portaria/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: tokenLido }),
        })
        if (r.status === 401) {
          sair()
          return
        }
        const d: Resultado = await r.json()
        setResultado(d)
        const ok = d.resultado === 'ok'
        navigator.vibrate?.(ok ? 60 : [120, 70, 120])
        bipar(ok)
      } catch {
        setResultado({ resultado: 'invalido', motivo: 'Falha de conexão' })
        bipar(false)
      }
    },
    [token, bipar]
  )

  // ---- scanner ------------------------------------------------------------
  useEffect(() => {
    if (!token || modo !== 'scanner' || resultado) return

    let cancelado = false

    async function iniciar() {
      try {
        // html5-qrcode é importado só aqui: não pesa no bundle do site público.
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelado) return

        const scanner = new Html5Qrcode('leitor', { verbose: false })
        scannerRef.current = scanner as unknown as { stop: () => Promise<void> }

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: { width: 250, height: 250 } },
          (texto) => processar(texto),
          () => {} // erros por quadro são normais; não poluem a tela
        )
        if (!cancelado) setEscaneando(true)
      } catch (e) {
        console.error('[portaria] câmera indisponível', e)
        setEscaneando(false)
      }
    }

    iniciar()
    return () => {
      cancelado = true
      scannerRef.current?.stop().catch(() => {})
      scannerRef.current = null
    }
  }, [token, modo, resultado, processar])

  // ---- busca manual -------------------------------------------------------
  useEffect(() => {
    if (modo !== 'busca' || busca.trim().length < 3) {
      setResultadosBusca([])
      return
    }
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/portaria/buscar?q=${encodeURIComponent(busca)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const d = await r.json()
        setResultadosBusca(d.resultados ?? [])
      } catch {
        setResultadosBusca([])
      }
    }, 350)
    return () => clearTimeout(id)
  }, [busca, modo, token])

  async function checkinManual(id: string) {
    const r = await fetch('/api/portaria/buscar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ingressoId: id }),
    })
    const d = await r.json()
    if (r.ok) {
      setResultado({ resultado: 'ok', nome: d.nome, tipo: d.tipo, cpf: d.cpf, pedido: 'MANUAL' })
      bipar(true)
    } else {
      alert(d.erro)
    }
    setBusca('')
  }

  // ==========================================================================
  //  LOGIN
  // ==========================================================================
  if (!token || !operador) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6">
        <OlhoDeHorus tamanho={72} />
        <h1 className="mt-6 font-display text-2xl font-bold texto-ouro">PORTARIA</h1>
        <p className="mt-2 text-xs tracking-widest text-texto-fraco">CONTROLE DE ENTRADA</p>

        <form onSubmit={entrar} className="cartao mt-10 w-full max-w-sm p-6">
          <label className="mb-2 block text-xs text-texto-suave">Operador</label>
          <select
            className="campo"
            value={opSelecionado ?? ''}
            onChange={(e) => setOpSelecionado(Number(e.target.value))}
            required
          >
            <option value="">Selecione…</option>
            {operadores.map((o) => (
              <option key={o.id} value={o.id}>
                {o.evento ? `${o.evento} · ` : ''}{o.nome} — {o.gate}
              </option>
            ))}
          </select>

          <label className="mb-2 mt-5 block text-xs text-texto-suave">PIN</label>
          <input
            type="password"
            inputMode="numeric"
            className="campo text-center font-display text-2xl tracking-[0.5em]"
            placeholder="••••••"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            required
          />

          {erroLogin && <p className="mt-3 text-center text-sm text-erro">{erroLogin}</p>}

          <button type="submit" className="botao-ouro mt-6 w-full">
            Entrar
          </button>

          {operadores.length === 0 && (
            <p className="mt-5 text-center text-xs leading-relaxed text-texto-fraco">
              Nenhum operador cadastrado. Rode <code className="text-ouro">npm run db:seed</code>{' '}
              para criar os operadores da portaria.
            </p>
          )}
        </form>
      </div>
    )
  }

  // ==========================================================================
  //  TELA DE RESULTADO — ocupa tudo, para ser lida de relance
  // ==========================================================================
  if (resultado) {
    const cores = {
      ok: 'bg-[#0d3b2a] border-ok',
      offline_ok: 'bg-[#0d3b2a] border-ok',
      ja_usado: 'bg-[#3d2a05] border-alerta',
      cancelado: 'bg-[#3d0d1c] border-erro',
      invalido: 'bg-[#3d0d1c] border-erro',
    }[resultado.resultado]

    return (
      <button
        onClick={() => setResultado(null)}
        className={`flex min-h-svh w-full flex-col items-center justify-center border-t-8 px-6 text-center ${cores}`}
      >
        {(resultado.resultado === 'ok' || resultado.resultado === 'offline_ok') && (
          <>
            <div className="text-[5rem] leading-none">✓</div>
            <p className="mt-4 font-display text-4xl font-black tracking-wide text-ok">
              PODE ENTRAR
            </p>
            <p className="mt-6 text-2xl font-bold text-white">{resultado.nome}</p>
            {'cpf' in resultado && (
              <p className="mt-1 text-sm text-white/60">{resultado.cpf}</p>
            )}

            {resultado.tipo === 'meia' && (
              <div className="mt-8 rounded-xl border-2 border-alerta bg-alerta/20 px-6 py-4">
                <p className="font-display text-lg font-bold text-alerta">
                  ⚠ MEIA-ENTRADA
                </p>
                <p className="mt-1 text-sm text-white">
                  EXIGIR COMPROVANTE
                </p>
              </div>
            )}

            {resultado.resultado === 'offline_ok' && (
              <p className="mt-6 text-xs text-white/50">
                Validado offline · será sincronizado
              </p>
            )}
          </>
        )}

        {resultado.resultado === 'ja_usado' && (
          <>
            <div className="text-[5rem] leading-none">⚠</div>
            <p className="mt-4 font-display text-4xl font-black text-alerta">
              JÁ UTILIZADO
            </p>
            <p className="mt-6 text-2xl font-bold text-white">{resultado.nome}</p>
            <p className="mt-3 text-base text-white/70">
              Entrou às {resultado.usadoEm}
              {resultado.usadoPor && ` · ${resultado.usadoPor}`}
            </p>
            <p className="mt-8 max-w-xs text-sm text-white/50">
              Chame a supervisão. Pode ser print de ingresso repassado.
            </p>
          </>
        )}

        {resultado.resultado === 'cancelado' && (
          <>
            <div className="text-[5rem] leading-none">✕</div>
            <p className="mt-4 font-display text-4xl font-black text-erro">CANCELADO</p>
            <p className="mt-6 text-2xl font-bold text-white">{resultado.nome}</p>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              Este ingresso foi reembolsado. Não dá direito a entrada.
            </p>
          </>
        )}

        {resultado.resultado === 'invalido' && (
          <>
            <div className="text-[5rem] leading-none">✕</div>
            <p className="mt-4 font-display text-4xl font-black text-erro">INVÁLIDO</p>
            <p className="mt-5 max-w-xs text-base text-white/80">{resultado.motivo}</p>
          </>
        )}

        <p className="mt-14 text-xs tracking-widest text-white/40">
          TOQUE PARA CONTINUAR
        </p>
      </button>
    )
  }

  // ==========================================================================
  //  SCANNER / BUSCA
  // ==========================================================================
  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b border-borda px-4 py-3">
        <div>
          <p className="text-sm font-medium text-texto">{operador.nome}</p>
          <p className="text-[10px] tracking-widest text-texto-fraco">
            {operador.gate.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!online && (
            <span className="rounded-full bg-alerta/20 px-2.5 py-1 text-[10px] font-bold text-alerta">
              OFFLINE{pendentes > 0 && ` · ${pendentes}`}
            </span>
          )}
          {online && pendentes > 0 && (
            <button
              onClick={sincronizar}
              className="rounded-full bg-violeta/20 px-2.5 py-1 text-[10px] font-bold text-violeta"
            >
              SINCRONIZAR {pendentes}
            </button>
          )}
          <Link href="/portaria/painel" className="text-xs text-texto-suave">
            Painel
          </Link>
          <button onClick={sair} className="text-xs text-texto-fraco">
            Sair
          </button>
        </div>
      </header>

      <div className="flex gap-2 p-3">
        <button
          onClick={() => setModo('scanner')}
          className={`flex-1 rounded-lg py-3 text-sm font-medium transition-colors ${
            modo === 'scanner' ? 'bg-ouro text-noite' : 'border border-borda text-texto-suave'
          }`}
        >
          Escanear
        </button>
        <button
          onClick={() => setModo('busca')}
          className={`flex-1 rounded-lg py-3 text-sm font-medium transition-colors ${
            modo === 'busca' ? 'bg-ouro text-noite' : 'border border-borda text-texto-suave'
          }`}
        >
          Buscar por nome
        </button>
      </div>

      {modo === 'scanner' ? (
        <div className="px-3">
          <div
            id="leitor"
            className="overflow-hidden rounded-2xl border-2 border-borda [&_video]:w-full"
          />
          {!escaneando && (
            <p className="mt-6 text-center text-sm leading-relaxed text-texto-suave">
              Autorize o acesso à câmera.
              <br />
              <span className="text-xs text-texto-fraco">
                Se não abrir, use "Buscar por nome".
              </span>
            </p>
          )}
          <p className="mt-5 text-center text-xs text-texto-fraco">
            Aponte para o QR Code do ingresso
          </p>
        </div>
      ) : (
        <div className="px-3">
          <input
            className="campo"
            placeholder="Nome ou CPF"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            autoFocus
          />
          <div className="mt-3 space-y-2">
            {resultadosBusca.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-borda p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-texto">{r.nome}</p>
                  <p className="text-xs text-texto-fraco">
                    {r.cpf} (final {r.cpfFinal}) ·{' '}
                    <span className={r.tipo === 'meia' ? 'text-alerta' : ''}>
                      {r.tipo === 'meia' ? 'MEIA' : 'INTEIRA'}
                    </span>
                  </p>
                </div>
                {r.status === 'valido' ? (
                  <button
                    onClick={() => checkinManual(r.id)}
                    className="botao-ouro shrink-0 !px-4 !py-2 !text-xs"
                  >
                    Liberar
                  </button>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold tracking-widest text-alerta">
                    {r.status.toUpperCase()}
                  </span>
                )}
              </div>
            ))}
            {busca.length >= 3 && resultadosBusca.length === 0 && (
              <p className="py-8 text-center text-sm text-texto-fraco">
                Ninguém encontrado com esse nome ou CPF.
              </p>
            )}
          </div>
          <p className="mt-6 text-center text-xs leading-relaxed text-texto-fraco">
            Confira o documento com foto antes de liberar.
          </p>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
//  Mesmo hash usado no servidor (SHA-256 truncado em 32 caracteres hex),
//  para o modo offline conseguir comparar sem baixar os tokens de verdade.
// ----------------------------------------------------------------------------
async function hashLocal(texto: string): Promise<string> {
  const dados = new TextEncoder().encode(texto)
  const buffer = await crypto.subtle.digest('SHA-256', dados)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}
