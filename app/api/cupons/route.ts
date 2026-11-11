import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { permitir, ipDaRequisicao } from '@/lib/ratelimit'
import { normalizarCupom, formatoDeCupom } from '@/lib/cupons'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET /api/cupons?codigo=Y87TJ5&evento=corujao-acido
//  Só confere se o cupom vale, para a tela mostrar o desconto antes do PIX.
//  Quem decide de verdade é o checkout, com o cupom travado na transação.
// ============================================================================

export async function GET(req: Request) {
  // Limite por IP: 6 caracteres são muitos para chutar, e assim continua.
  if (!(await permitir(`cupom:ip:${ipDaRequisicao(req)}`, 20, 600))) {
    return NextResponse.json({ erro: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 })
  }

  const url = new URL(req.url)
  const codigo = normalizarCupom(url.searchParams.get('codigo') ?? '')
  const slug = url.searchParams.get('evento') ?? ''
  if (!formatoDeCupom(codigo) || !/^[a-z0-9-]{2,80}$/.test(slug)) {
    return NextResponse.json({ erro: 'Cupom inválido.' }, { status: 400 })
  }

  const [cupom] = await sql<
    { percentual: number; valido_ate: Date | null; status_pedido: string | null }[]
  >`
    select c.percentual, c.valido_ate, p.status as status_pedido
      from cupons c
      join eventos e on e.id = c.evento_id
      left join pedidos p on p.id = c.pedido_id
     where c.codigo = ${codigo} and e.slug = ${slug}
  `

  if (!cupom) {
    return NextResponse.json({ erro: 'Cupom não encontrado para este evento.' }, { status: 404 })
  }
  if (cupom.valido_ate && new Date(cupom.valido_ate) < new Date()) {
    return NextResponse.json({ erro: 'Este cupom expirou.' }, { status: 410 })
  }
  // Pendente pode ser a própria pessoa tentando de novo: o checkout decide.
  if (cupom.status_pedido === 'pago' || cupom.status_pedido === 'reembolsado') {
    return NextResponse.json({ erro: 'Este cupom já foi usado.' }, { status: 409 })
  }

  return NextResponse.json(
    { codigo, percentual: cupom.percentual },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
