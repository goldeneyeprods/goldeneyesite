import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { lerEstoque } from '@/lib/lotes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET /api/eventos/<slug>/lotes
//  O lote que está vendendo agora. Público — devolve só o necessário.
//  Os lotes seguintes não aparecem: o preço deles só vale quando a vez chegar.
// ============================================================================

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const [evento] = await sql<{ id: number }[]>`
    select id from eventos where slug = ${slug} and ativo = true limit 1
  `
  const estoque = evento ? await lerEstoque(sql, evento.id) : null
  const vigentes = estoque?.vigentes ?? []

  return NextResponse.json(
    {
      // Nada à venda num evento com lotes cadastrados = esgotou.
      esgotado: !!evento && vigentes.length === 0,
      lotes: vigentes.map((l) => ({
        id: l.id,
        nome: l.nome,
        tipo: l.tipo,
        precoCentavos: l.precoCentavos,
        disponivel: l.disponivel,
        // "Últimas unidades" só aparece quando é verdade — urgência falsa
        // queima a confiança de quem volta em todo evento.
        poucos: l.disponivel > 0 && l.disponivel <= 10,
        esgotado: l.disponivel <= 0,
        cotaMeiaPreenchida: l.cotaMeiaPreenchida,
        validoAte: l.validoAte,
      })),
    },
    {
      headers: {
        // O navegador não guarda; a borda da Netlify segura 5 segundos. Uma
        // enxurrada de acessos é respondida na borda e não chega ao banco.
        // O checkout sempre reconta o estoque, então nada é vendido a mais.
        'Cache-Control': 'no-store',
        'Netlify-CDN-Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      },
    }
  )
}
