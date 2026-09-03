'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatarBRL } from '@/lib/validacao'

// ============================================================================
//  /portaria/painel — números ao vivo para a produção acompanhar
// ============================================================================

interface Painel {
  vendidos: number
  presentes: number
  aguardando: number
  cancelados: number
  meias: number
  taxaComparecimento: number
  receitaCentavos: number
  porMinuto: { minuto: string; n: number }[]
  ultimos: { nome: string; tipo: string; quando: string; operador: string | null }[]
}

export default function PainelPortaria() {
  const [dados, setDados] = useState<Painel | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('ge_portaria_token')
    if (!token) {
      setErro('Faça login na portaria primeiro.')
      return
    }

    const carregar = async () => {
      try {
        const r = await fetch('/api/portaria/painel', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        if (r.status === 401) {
          setErro('Sessão expirada. Entre de novo na portaria.')
          return
        }
        setDados(await r.json())
      } catch {
        /* mantém os últimos números na tela em vez de piscar erro */
      }
    }

    carregar()
    const id = setInterval(carregar, 10_000)
    return () => clearInterval(id)
  }, [])

  function baixarCsv() {
    const token = localStorage.getItem('ge_portaria_token')
    // O download precisa do header de autorização, então buscamos e criamos
    // um blob local em vez de apontar um <a href> direto para a rota.
    fetch('/api/portaria/painel?csv=1', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'lista-portaria.csv'
        a.click()
        URL.revokeObjectURL(url)
      })
  }

  if (erro) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-texto-suave">{erro}</p>
        <Link href="/portaria" className="botao-ouro">
          Ir para a portaria
        </Link>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-texto-fraco">Carregando…</p>
      </div>
    )
  }

  const picoMinuto = Math.max(...dados.porMinuto.map((p) => p.n), 1)

  return (
    <div className="min-h-svh px-4 py-5">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold texto-ouro">Painel ao vivo</h1>
          <p className="text-[10px] tracking-widest text-texto-fraco">
            ATUALIZA A CADA 10 SEGUNDOS
          </p>
        </div>
        <Link href="/portaria" className="botao-fantasma !px-4 !py-2 !text-xs">
          Voltar
        </Link>
      </header>

      {/* --- Números principais --- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cartao rotulo="Presentes" valor={dados.presentes} destaque />
        <Cartao rotulo="Aguardando" valor={dados.aguardando} />
        <Cartao rotulo="Vendidos" valor={dados.vendidos} />
        <Cartao rotulo="Comparecimento" valor={`${dados.taxaComparecimento}%`} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Cartao rotulo="Meias" valor={dados.meias} pequeno />
        <Cartao rotulo="Cancelados" valor={dados.cancelados} pequeno />
        <Cartao
          rotulo="Receita"
          valor={formatarBRL(dados.receitaCentavos)}
          pequeno
        />
      </div>

      {/* --- Fluxo da última hora --- */}
      <div className="cartao mt-5 p-5">
        <p className="rotulo">Entradas por minuto — última hora</p>
        {dados.porMinuto.length === 0 ? (
          <p className="mt-5 text-sm text-texto-fraco">
            Ninguém entrou ainda na última hora.
          </p>
        ) : (
          <div className="mt-5 flex h-24 items-end gap-[3px]">
            {dados.porMinuto.map((p) => (
              <div
                key={p.minuto}
                className="flex-1 rounded-t bg-gradient-to-t from-ouro-escuro to-ouro"
                style={{ height: `${Math.max((p.n / picoMinuto) * 100, 6)}%` }}
                title={`${p.n} entrada(s)`}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- Últimos check-ins --- */}
      <div className="cartao mt-5 p-5">
        <p className="rotulo">Últimas entradas</p>
        <div className="mt-4 space-y-2">
          {dados.ultimos.length === 0 && (
            <p className="text-sm text-texto-fraco">Nada por aqui ainda.</p>
          )}
          {dados.ultimos.map((u, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 border-b border-borda/50 pb-2 text-sm last:border-0"
            >
              <span className="min-w-0 truncate text-texto">{u.nome}</span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-texto-fraco">
                {u.tipo === 'meia' && (
                  <span className="text-alerta">MEIA</span>
                )}
                {new Intl.DateTimeFormat('pt-BR', {
                  timeStyle: 'short',
                  timeZone: 'America/Sao_Paulo',
                }).format(new Date(u.quando))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={baixarCsv} className="botao-fantasma mt-5 w-full !py-3 !text-sm">
        Baixar lista completa (CSV)
      </button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-texto-fraco">
        Imprima esta lista antes do evento. É o seu plano B se a internet e a
        bateria falharem ao mesmo tempo.
      </p>
    </div>
  )
}

function Cartao({
  rotulo,
  valor,
  destaque,
  pequeno,
}: {
  rotulo: string
  valor: string | number
  destaque?: boolean
  pequeno?: boolean
}) {
  return (
    <div className={`cartao p-4 ${destaque ? 'cartao-ouro' : ''}`}>
      <p className="text-[10px] uppercase tracking-widest text-texto-fraco">
        {rotulo}
      </p>
      <p
        className={`mt-1.5 font-display font-bold tabular-nums ${
          pequeno ? 'text-lg' : 'text-3xl'
        } ${destaque ? 'texto-ouro' : 'text-texto'}`}
      >
        {valor}
      </p>
    </div>
  )
}
