import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { limparRateLimit } from '@/lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET /api/cron/expirar
//
//  Roda a cada 5 minutos (vercel.json). Devolve ao estoque os ingressos de
//  PIX que ninguém pagou. Sem isso, um evento "esgota" cheio de reservas
//  fantasma e você perde venda de verdade.
// ============================================================================

export async function GET(req: Request) {
  // A Vercel manda este header nos crons; em produção ninguém mais chama isto.
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'não autorizado' }, { status: 401 })
  }

  const liberados = await sql.begin(async (tx) => {
    const vencidos = await tx<{ id: string }[]>`
      select id from pedidos
       where status = 'pendente'
         and pix_expira_em < now()
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

  return NextResponse.json({ ok: true, pedidosExpirados: liberados })
}
