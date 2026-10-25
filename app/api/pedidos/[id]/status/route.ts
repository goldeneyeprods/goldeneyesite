import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { permitir, ipDaRequisicao } from '@/lib/ratelimit'
import { sincronizarPagamento } from '@/lib/pedidos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET /api/pedidos/:id/status
//  A tela de pagamento consulta isto a cada poucos segundos até virar 'pago'.
//  Devolve o mínimo possível: nada de dado pessoal numa rota adivinhável.
//
//  Se o pedido ainda está pendente, de tempos em tempos pergunta direto ao
//  Mercado Pago. Assim um webhook atrasado (ou perdido) não deixa o comprador
//  olhando para a tela depois de ter pago.
// ============================================================================

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // A tela do PIX consulta a cada poucos segundos; 90 por minuto por conexão
  // sobra para quem está pagando e corta quem martela a rota.
  if (!(await permitir(`status:ip:${ipDaRequisicao(req)}`, 90, 60))) {
    return NextResponse.json({ erro: 'Muitas consultas' }, { status: 429 })
  }

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ erro: 'id inválido' }, { status: 400 })
  }

  const consultar = () => sql<
    {
      status: string
      pix_expira_em: Date | null
      mp_payment_id: string | null
      criado_em: Date
      qtd: number
    }[]
  >`
    select p.status,
           p.pix_expira_em,
           p.mp_payment_id,
           p.criado_em,
           (select count(*)::int from ingressos i where i.pedido_id = p.id) as qtd
      from pedidos p
     where p.id = ${id}
  `

  let [pedido] = await consultar()

  if (
    pedido?.status === 'pendente' &&
    pedido.mp_payment_id &&
    Date.now() - new Date(pedido.criado_em).getTime() > 15_000 &&
    (await permitir(`status-mp:${id}`, 1, 15))
  ) {
    try {
      await sincronizarPagamento(pedido.mp_payment_id)
      ;[pedido] = await consultar()
    } catch (erro) {
      // Sem drama: o webhook e o cron ainda vão conferir.
      console.error('[status] falha ao consultar o Mercado Pago', erro)
    }
  }

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
