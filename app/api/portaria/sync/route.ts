import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sessaoDaRequisicao } from '@/lib/auth'
import { hashToken, verificarTokenIngresso } from '@/lib/ticket'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  MODO OFFLINE DA PORTARIA
//
//  Casa de show com internet ruim é a regra, não a exceção. No login o celular
//  baixa a lista de ingressos válidos e valida localmente; quando a rede volta,
//  manda a fila de check-ins para cá.
//
//  GET  -> baixa o pacote offline
//  POST -> envia a fila de check-ins feitos sem internet
// ============================================================================

export async function GET(req: Request) {
  const sessao = await sessaoDaRequisicao(req)
  if (!sessao) return NextResponse.json({ erro: 'Sessão expirada' }, { status: 401 })

  const ingressos = await sql<
    { id: string; token_qr: string; titular_nome: string; tipo: string; status: string }[]
  >`
    select id, token_qr, titular_nome, tipo, status
      from ingressos
     where evento_id = ${sessao.eventoId} and status in ('valido','usado')
  `

  // Mandamos o HASH do token, nunca o token puro: se o celular do segurança
  // for perdido ou roubado, ninguém reconstrói QR Codes a partir do pacote.
  return NextResponse.json(
    {
      eventoId: sessao.eventoId,
      geradoEm: new Date().toISOString(),
      total: ingressos.length,
      ingressos: ingressos.map((i) => ({
        h: hashToken(i.token_qr),
        n: i.titular_nome,
        t: i.tipo,
        s: i.status,
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function POST(req: Request) {
  const sessao = await sessaoDaRequisicao(req)
  if (!sessao) return NextResponse.json({ erro: 'Sessão expirada' }, { status: 401 })

  const corpo = (await req.json().catch(() => null)) as {
    fila?: { token: string; em: string }[]
  } | null

  if (!Array.isArray(corpo?.fila)) {
    return NextResponse.json({ erro: 'Fila inválida' }, { status: 400 })
  }

  const relatorio: { token: string; resultado: string }[] = []

  for (const item of corpo.fila.slice(0, 500)) {
    const payload = verificarTokenIngresso(item.token)
    if (!payload || payload.e !== sessao.eventoId) {
      relatorio.push({ token: item.token, resultado: 'invalido' })
      continue
    }

    // Preserva o horário real da entrada, não o da sincronização — o relatório
    // do evento fica correto mesmo com a internet caindo a noite toda.
    const quando = new Date(item.em)
    const horario = isNaN(quando.getTime()) ? new Date() : quando

    const [marcado] = await sql<{ id: string }[]>`
      update ingressos
         set status = 'usado', usado_em = ${horario},
             usado_por = ${sessao.operadorId}, gate = ${sessao.gate}
       where id = ${payload.i} and evento_id = ${sessao.eventoId} and status = 'valido'
      returning id
    `

    const resultado = marcado ? 'ok' : 'ja_usado'
    relatorio.push({ token: item.token, resultado })

    try {
      await sql`
        insert into checkin_log (ingresso_id, operador_id, evento_id, resultado, detalhe, criado_em)
        values (${payload.i}, ${sessao.operadorId}, ${sessao.eventoId}, ${resultado}, 'offline', ${horario})
      `
    } catch {
      /* log é auditoria, não pode travar a sincronização */
    }
  }

  return NextResponse.json({ ok: true, processados: relatorio.length, relatorio })
}
