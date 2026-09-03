import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET /api/pedidos/:id/status
//  A tela de pagamento consulta isto a cada poucos segundos até virar 'pago'.
//  Devolve o mínimo possível: nada de dado pessoal numa rota adivinhável.
// ============================================================================

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ erro: 'id inválido' }, { status: 400 })
  }

  const [pedido] = await sql<
    { status: string; pix_expira_em: Date | null; qtd: number }[]
  >`
    select p.status,
           p.pix_expira_em,
           (select count(*)::int from ingressos i where i.pedido_id = p.id) as qtd
      from pedidos p
     where p.id = ${id}
  `

  if (!pedido) {
    return NextResponse.json({ erro: 'Pedido não encontrado' }, { status: 404 })
  }

  return NextResponse.json(
    {
      status: pedido.status,
      expiraEm: pedido.pix_expira_em,
      ingressosEmitidos: pedido.qtd,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
