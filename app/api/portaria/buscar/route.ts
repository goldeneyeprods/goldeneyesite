import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sessaoDaRequisicao } from '@/lib/auth'
import { soDigitos, mascararCpf } from '@/lib/validacao'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET  /api/portaria/buscar?q=...
//  POST /api/portaria/buscar         { ingressoId }  -> check-in manual
//
//  Para quem chega com o celular descarregado. Acontece em toda festa.
// ============================================================================

export async function GET(req: Request) {
  const sessao = await sessaoDaRequisicao(req)
  if (!sessao) return NextResponse.json({ erro: 'Sessão expirada' }, { status: 401 })

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim()
  if (q.length < 3) {
    return NextResponse.json({ resultados: [] })
  }

  const digitos = soDigitos(q)
  const porCpf = digitos.length >= 6

  const resultados = await sql<
    {
      id: string
      titular_nome: string
      titular_cpf: string
      tipo: string
      status: string
      usado_em: Date | null
      convite: boolean
    }[]
  >`
    select i.id, i.titular_nome, i.titular_cpf, i.tipo, i.status, i.usado_em,
           l.cortesia as convite
      from ingressos i
      join lotes l on l.id = i.lote_id
     where i.evento_id = ${sessao.eventoId}
       and (
         ${porCpf}::boolean and i.titular_cpf like ${'%' + digitos + '%'}
         or i.titular_nome ilike ${'%' + q + '%'}
       )
     order by i.titular_nome
     limit 25
  `

  return NextResponse.json({
    resultados: resultados.map((r) => ({
      id: r.id,
      nome: r.titular_nome,
      cpf: mascararCpf(r.titular_cpf),
      // Últimos 3 dígitos abertos para conferir com o documento na mão.
      cpfFinal: r.titular_cpf.slice(-3),
      tipo: r.tipo,
      convite: r.convite,
      status: r.status,
      usadoEm: r.usado_em,
    })),
  })
}

export async function POST(req: Request) {
  const sessao = await sessaoDaRequisicao(req)
  if (!sessao) return NextResponse.json({ erro: 'Sessão expirada' }, { status: 401 })

  const corpo = (await req.json().catch(() => null)) as { ingressoId?: string } | null
  const id = corpo?.ingressoId
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ erro: 'Ingresso inválido' }, { status: 400 })
  }

  const [marcado] = await sql<
    { titular_nome: string; tipo: 'inteira' | 'meia'; titular_cpf: string; convite: boolean }[]
  >`
    update ingressos
       set status = 'usado', usado_em = now(),
           usado_por = ${sessao.operadorId}, gate = ${sessao.gate}
      from lotes l
     where ingressos.id = ${id} and ingressos.evento_id = ${sessao.eventoId}
       and ingressos.status = 'valido' and l.id = ingressos.lote_id
    returning ingressos.titular_nome, ingressos.tipo, ingressos.titular_cpf, l.cortesia as convite
  `

  if (!marcado) {
    return NextResponse.json(
      { erro: 'Ingresso já utilizado ou cancelado.' },
      { status: 409 }
    )
  }

  // Marcado como 'manual' no log: no relatório do dia seguinte dá pra ver
  // quantas entradas não passaram pelo QR e por qual operador.
  await sql`
    insert into checkin_log (ingresso_id, operador_id, evento_id, resultado, detalhe)
    values (${id}, ${sessao.operadorId}, ${sessao.eventoId}, 'manual', 'busca manual na portaria')
  `

  return NextResponse.json({
    ok: true,
    nome: marcado.titular_nome,
    tipo: marcado.tipo,
    convite: marcado.convite,
    cpf: mascararCpf(marcado.titular_cpf),
  })
}
