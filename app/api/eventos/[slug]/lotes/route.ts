import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET /api/eventos/<slug>/lotes
//  Lotes à venda de um evento. Público — devolve só o necessário.
// ============================================================================

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const lotes = await sql<
    {
      id: number
      nome: string
      tipo: 'inteira' | 'meia'
      preco_centavos: number
      disponivel: number
      valido_ate: Date | null
    }[]
  >`
    select l.id, l.nome, l.tipo, l.preco_centavos, l.valido_ate,
           (l.quantidade_total - l.quantidade_vendida - l.quantidade_reservada) as disponivel
      from lotes l
      join eventos e on e.id = l.evento_id
     where e.slug = ${slug}
       and e.ativo = true
       and l.ativo = true
     order by l.ordem
  `

  return NextResponse.json(
    {
      lotes: lotes.map((l) => ({
        id: l.id,
        nome: l.nome,
        tipo: l.tipo,
        precoCentavos: l.preco_centavos,
        disponivel: Math.max(l.disponivel, 0),
        // "Últimas unidades" só aparece quando é verdade — urgência falsa
        // queima a confiança de quem volta em todo evento.
        poucos: l.disponivel > 0 && l.disponivel <= 15,
        esgotado: l.disponivel <= 0,
        validoAte: l.valido_ate,
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
