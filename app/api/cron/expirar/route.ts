import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { limparRateLimit } from '@/lib/ratelimit'
import { sincronizarPagamento } from '@/lib/pedidos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET /api/cron/expirar
//
//  Roda a cada 10 minutos (netlify/functions/expirar-pix.mts). Devolve ao estoque os ingressos de
//  PIX que ninguém pagou. Sem isso, um evento "esgota" cheio de reservas
//  fantasma e você perde venda de verdade.
// ============================================================================

export async function GET(req: Request) {
  // A função agendada da Netlify manda este header; ninguém mais chama isto.
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'não autorizado' }, { status: 401 })
  }

  // ---- 1. Antes de expirar, pergunta ao Mercado Pago ----------------------
  // Quem pagou no último minuto do prazo não pode perder o ingresso porque o
  // aviso do MP se atrasou. A folga de 2 minutos dá tempo ao webhook; depois
  // dela, a palavra final é da API.
  const aConferir = await sql<{ id: string; mp_payment_id: string }[]>`
    select id, mp_payment_id from pedidos
     where status = 'pendente'
       and mp_payment_id is not null
       and pix_expira_em < now() - interval '2 minutes'
     order by pix_expira_em
     limit 50
  `
  let conferidos = 0
  const naoConferidos: string[] = []
  for (const p of aConferir) {
    try {
      await sincronizarPagamento(p.mp_payment_id)
      conferidos++
    } catch (erro) {
      // Fica pendente e é conferido de novo na próxima rodada.
      naoConferidos.push(p.id)
      console.error('[cron] falha ao conferir', p.mp_payment_id, erro)
    }
  }

  // ---- 2. O que continua pendente e vencido volta ao estoque ---------------
  const liberados = await sql.begin(async (tx) => {
    const vencidos = await tx<{ id: string }[]>`
      select id from pedidos
       where status = 'pendente'
         and pix_expira_em < now() - interval '2 minutes'
         and not (id = any(${sql.array(naoConferidos)}::uuid[]))
       for update skip locked
       limit 200
    `

    for (const p of vencidos) {
      const itens = await tx<{ lote_id: number; quantidade: number }[]>`
        select lote_id, quantidade from pedido_itens where pedido_id = ${p.id}
      `
      for (const it of itens) {
        await tx`
          update lotes
             set quantidade_reservada = greatest(quantidade_reservada - ${it.quantidade}, 0)
           where id = ${it.lote_id}
        `
      }
      await tx`
        update pedidos set status = 'expirado', cancelado_em = now() where id = ${p.id}
      `
    }

    return vencidos.length
  })

  await limparRateLimit()

  return NextResponse.json({ ok: true, conferidos, pedidosExpirados: liberados })
}
