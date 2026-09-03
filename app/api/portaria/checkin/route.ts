import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sessaoDaRequisicao } from '@/lib/auth'
import { verificarTokenIngresso } from '@/lib/ticket'
import { schemaCheckin } from '@/lib/validacao'
import { mascararCpf } from '@/lib/validacao'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  POST /api/portaria/checkin
//
//  O UPDATE é atômico: "marque como usado SE ainda estiver válido, e me diga
//  se você conseguiu". Dois seguranças lendo o mesmo QR no mesmo segundo —
//  só um recebe linha de volta. O outro vê "JÁ UTILIZADO".
// ============================================================================

export type ResultadoCheckin =
  | { resultado: 'ok'; nome: string; tipo: 'inteira' | 'meia'; cpf: string; pedido: string }
  | { resultado: 'ja_usado'; nome: string; usadoEm: string; usadoPor: string | null }
  | { resultado: 'cancelado'; nome: string }
  | { resultado: 'invalido'; motivo: string }

export async function POST(req: Request) {
  const sessao = await sessaoDaRequisicao(req)
  if (!sessao) {
    return NextResponse.json({ erro: 'Sessão expirada. Faça login de novo.' }, { status: 401 })
  }

  const parsed = schemaCheckin.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { resultado: 'invalido', motivo: 'QR Code ilegível' } satisfies ResultadoCheckin,
      { status: 200 }
    )
  }

  // ---- 1. Assinatura, antes de tocar no banco -----------------------------
  const payload = verificarTokenIngresso(parsed.data.token)
  if (!payload) {
    await registrar(null, sessao.operadorId, sessao.eventoId, 'invalido', 'assinatura inválida')
    return NextResponse.json({
      resultado: 'invalido',
      motivo: 'Ingresso falsificado ou de outro sistema',
    } satisfies ResultadoCheckin)
  }

  // ---- 2. É deste evento? -------------------------------------------------
  if (payload.e !== sessao.eventoId) {
    await registrar(payload.i, sessao.operadorId, sessao.eventoId, 'invalido', 'outro evento')
    return NextResponse.json({
      resultado: 'invalido',
      motivo: 'Este ingresso é de outro evento',
    } satisfies ResultadoCheckin)
  }

  // ---- 3. Check-in atômico ------------------------------------------------
  const [marcado] = await sql<
    { id: string; titular_nome: string; titular_cpf: string; tipo: 'inteira' | 'meia'; pedido_id: string }[]
  >`
    update ingressos
       set status    = 'usado',
           usado_em  = now(),
           usado_por = ${sessao.operadorId},
           gate      = ${parsed.data.gate ?? sessao.gate}
     where id = ${payload.i}
       and evento_id = ${sessao.eventoId}
       and status = 'valido'
    returning id, titular_nome, titular_cpf, tipo, pedido_id
  `

  if (marcado) {
    await registrar(marcado.id, sessao.operadorId, sessao.eventoId, 'ok', null)
    return NextResponse.json({
      resultado: 'ok',
      nome: marcado.titular_nome,
      tipo: marcado.tipo,
      cpf: mascararCpf(marcado.titular_cpf),
      pedido: marcado.pedido_id.slice(0, 8).toUpperCase(),
    } satisfies ResultadoCheckin)
  }

  // ---- 4. Não marcou: descobre por quê -----------------------------------
  const [ingresso] = await sql<
    { status: string; titular_nome: string; usado_em: Date | null; operador: string | null }[]
  >`
    select i.status, i.titular_nome, i.usado_em, o.nome as operador
      from ingressos i
      left join operadores o on o.id = i.usado_por
     where i.id = ${payload.i}
  `

  if (!ingresso) {
    await registrar(payload.i, sessao.operadorId, sessao.eventoId, 'invalido', 'não existe')
    return NextResponse.json({
      resultado: 'invalido',
      motivo: 'Ingresso não encontrado',
    } satisfies ResultadoCheckin)
  }

  if (ingresso.status === 'cancelado') {
    await registrar(payload.i, sessao.operadorId, sessao.eventoId, 'cancelado', null)
    return NextResponse.json({
      resultado: 'cancelado',
      nome: ingresso.titular_nome,
    } satisfies ResultadoCheckin)
  }

  await registrar(payload.i, sessao.operadorId, sessao.eventoId, 'ja_usado', null)
  return NextResponse.json({
    resultado: 'ja_usado',
    nome: ingresso.titular_nome,
    usadoEm: ingresso.usado_em
      ? new Intl.DateTimeFormat('pt-BR', {
          timeStyle: 'short',
          timeZone: 'America/Sao_Paulo',
        }).format(new Date(ingresso.usado_em))
      : '—',
    usadoPor: ingresso.operador,
  } satisfies ResultadoCheckin)
}

async function registrar(
  ingressoId: string | null,
  operadorId: number,
  eventoId: number,
  resultado: 'ok' | 'ja_usado' | 'invalido' | 'cancelado' | 'manual',
  detalhe: string | null
) {
  // O log é auditoria; se ele falhar, a portaria não pode travar.
  try {
    await sql`
      insert into checkin_log (ingresso_id, operador_id, evento_id, resultado, detalhe)
      values (${ingressoId}, ${operadorId}, ${eventoId}, ${resultado}, ${detalhe})
    `
  } catch (e) {
    console.error('[checkin] log falhou', e)
  }
}
