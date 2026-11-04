import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { sessaoDaRequisicao } from '@/lib/auth'
import { chaveLinkPedido } from '@/lib/ticket'
import { linkDoIngresso } from '@/lib/url'
import { telefoneInternacional } from '@/lib/whatsapp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  /api/portaria/whatsapp — envio do ingresso pelo WhatsApp Business do celular
//
//  Sem API da Meta: o painel abre a conversa do comprador no WhatsApp da
//  produção com a mensagem pronta, e a produção só aperta enviar.
//    GET  → pedidos pagos que pediram WhatsApp, com o link wa.me de cada um
//    POST → { pedidoId, enviado } marca ou desmarca como enviado
// ============================================================================

const fmtData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
})
const fmtHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

export async function GET(req: Request) {
  const sessao = await sessaoDaRequisicao(req)
  if (!sessao) return NextResponse.json({ erro: 'Sessão expirada' }, { status: 401 })
  if (!sessao.admin) return NextResponse.json({ erro: 'Acesso restrito' }, { status: 403 })

  const pedidos = await sql<
    {
      id: string
      comprador_nome: string
      comprador_telefone: string
      pago_em: Date
      whatsapp_enviado_em: Date | null
      evento_nome: string
      data_inicio: Date
      meia_solidaria: boolean
      itens: { lote: string; tipo: string; quantidade: number }[]
    }[]
  >`
    select p.id, p.comprador_nome, p.comprador_telefone, p.pago_em, p.whatsapp_enviado_em,
           e.nome as evento_nome, e.data_inicio, e.meia_solidaria,
           json_agg(json_build_object('lote', l.nome, 'tipo', l.tipo, 'quantidade', pi.quantidade)
                    order by l.ordem) as itens
      from pedidos p
      join eventos e on e.id = p.evento_id
      join pedido_itens pi on pi.pedido_id = p.id
      join lotes l on l.id = pi.lote_id
     where p.evento_id = ${sessao.eventoId}
       and p.status = 'pago'
       and p.whatsapp_optin
     group by p.id, e.id
     order by (p.whatsapp_enviado_em is not null), p.pago_em
  `

  const lista = pedidos.map((p) => {
    const ingresso = p.itens
      .map((i) => {
        const meia = i.tipo === 'meia' && !p.meia_solidaria ? ' (leve o comprovante da meia)' : ''
        return `${i.quantidade > 1 ? `${i.quantidade}x ` : ''}${i.lote}${meia}`
      })
      .join(', ')

    const texto =
      `Olá ${p.comprador_nome.trim().split(/\s+/)[0]}!\n\n` +
      `Segue aqui seu ingresso para o evento "${p.evento_nome}" dia ` +
      `${fmtData.format(new Date(p.data_inicio))} às ${fmtHora.format(new Date(p.data_inicio))}.\n` +
      `Ingresso: ${ingresso}\n` +
      `${linkDoIngresso(p.id, chaveLinkPedido(p.id))}\n\n` +
      `Contamos com sua presença!\n\n` +
      `Qualquer dúvida ou auxílio conte com nossa equipe por este número de WhatsApp.\n` +
      `A Golden Eye Produções agradece o seu prestígio, bom evento!`

    const numero = telefoneInternacional(p.comprador_telefone)
    return {
      id: p.id,
      nome: p.comprador_nome,
      telefone: p.comprador_telefone,
      ingresso,
      pagoEm: p.pago_em,
      enviadoEm: p.whatsapp_enviado_em,
      link: numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : null,
    }
  })

  return NextResponse.json({ pedidos: lista }, { headers: { 'Cache-Control': 'no-store' } })
}

const schemaMarcar = z.object({ pedidoId: z.string().uuid(), enviado: z.boolean() })

export async function POST(req: Request) {
  const sessao = await sessaoDaRequisicao(req)
  if (!sessao) return NextResponse.json({ erro: 'Sessão expirada' }, { status: 401 })
  if (!sessao.admin) return NextResponse.json({ erro: 'Acesso restrito' }, { status: 403 })

  const parsed = schemaMarcar.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 })

  await sql`
    update pedidos
       set whatsapp_enviado_em = ${parsed.data.enviado ? sql`now()` : null}
     where id = ${parsed.data.pedidoId} and evento_id = ${sessao.eventoId}
  `
  return NextResponse.json({ ok: true })
}
