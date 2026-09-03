import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sessaoDaRequisicao } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET /api/portaria/painel
//  Números ao vivo para a produção acompanhar durante o evento.
//  GET /api/portaria/painel?csv=1 -> exporta a lista completa de compradores
// ============================================================================

export async function GET(req: Request) {
  const sessao = await sessaoDaRequisicao(req)
  if (!sessao) return NextResponse.json({ erro: 'Sessão expirada' }, { status: 401 })

  // ---- Exportação CSV (backup impresso para o dia do evento) --------------
  if (new URL(req.url).searchParams.get('csv') === '1') {
    const linhas = await sql<
      {
        titular_nome: string
        titular_cpf: string
        tipo: string
        status: string
        email: string
        usado_em: Date | null
      }[]
    >`
      select i.titular_nome, i.titular_cpf, i.tipo, i.status,
             p.comprador_email as email, i.usado_em
        from ingressos i
        join pedidos p on p.id = i.pedido_id
       where i.evento_id = ${sessao.eventoId} and i.status <> 'cancelado'
       order by i.titular_nome
    `

    const csv = [
      'Nome;CPF;Tipo;Status;Email;Entrou em',
      ...linhas.map((l) =>
        [
          l.titular_nome.replace(/;/g, ','),
          l.titular_cpf,
          l.tipo === 'meia' ? 'MEIA' : 'INTEIRA',
          l.status,
          l.email,
          l.usado_em
            ? new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'America/Sao_Paulo',
              }).format(new Date(l.usado_em))
            : '',
        ].join(';')
      ),
    ].join('\n')

    return new NextResponse('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="lista-portaria.csv"',
      },
    })
  }

  // ---- Números ao vivo ----------------------------------------------------
  const [totais] = await sql<
    { validos: number; usados: number; cancelados: number; meias: number }[]
  >`
    select
      count(*) filter (where status = 'valido')::int      as validos,
      count(*) filter (where status = 'usado')::int       as usados,
      count(*) filter (where status = 'cancelado')::int   as cancelados,
      count(*) filter (where tipo = 'meia' and status <> 'cancelado')::int as meias
    from ingressos where evento_id = ${sessao.eventoId}
  `

  const [receita] = await sql<{ total: number }[]>`
    select coalesce(sum(valor_total_centavos), 0)::int as total
      from pedidos
     where evento_id = ${sessao.eventoId} and status = 'pago'
  `

  const porMinuto = await sql<{ minuto: Date; n: number }[]>`
    select date_trunc('minute', usado_em) as minuto, count(*)::int as n
      from ingressos
     where evento_id = ${sessao.eventoId}
       and status = 'usado'
       and usado_em > now() - interval '60 minutes'
     group by 1 order by 1
  `

  const ultimos = await sql<
    { nome: string; tipo: string; quando: Date; operador: string | null }[]
  >`
    select i.titular_nome as nome, i.tipo, i.usado_em as quando, o.nome as operador
      from ingressos i
      left join operadores o on o.id = i.usado_por
     where i.evento_id = ${sessao.eventoId} and i.status = 'usado'
     order by i.usado_em desc
     limit 20
  `

  const vendidos = totais.validos + totais.usados

  return NextResponse.json(
    {
      vendidos,
      presentes: totais.usados,
      aguardando: totais.validos,
      cancelados: totais.cancelados,
      meias: totais.meias,
      taxaComparecimento: vendidos > 0 ? Math.round((totais.usados / vendidos) * 100) : 0,
      receitaCentavos: receita.total,
      porMinuto,
      ultimos,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
