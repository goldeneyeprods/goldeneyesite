import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { emailDaSessao } from '@/lib/sessao-cliente'
import { reembolsarPagamento } from '@/lib/mercadopago'
import { enviarEmailReembolso } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  POST /api/pedidos/:id/cancelar
//
//  Autoatendimento do Artigo 49 do CDC. O cliente resolve sozinho, o dinheiro
//  volta pelo mesmo PIX e o QR Code morre na hora — sem ninguém da produção
//  precisar abrir o painel do Mercado Pago às 3 da manhã.
//
//  REGRA (validada AQUI, no servidor):
//    até 7 dias corridos do pagamento
//    E pelo menos 48h antes da abertura dos portões
//    E nenhum ingresso do pedido já utilizado
// ============================================================================

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const email = await emailDaSessao()

  if (!email) {
    return NextResponse.json({ erro: 'Sessão expirada. Peça um novo link.' }, { status: 401 })
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ erro: 'Pedido inválido' }, { status: 400 })
  }

  // ---- 1. Trava o pedido e revalida tudo -----------------------------------
  const verificacao = await sql.begin(async (tx) => {
    const [pedido] = await tx<
      {
        id: string
        status: string
        pago_em: Date | null
        mp_payment_id: string | null
        valor_total_centavos: number
        comprador_nome: string
        comprador_email: string
        abertura_portoes: Date
        evento_nome: string
      }[]
    >`
      select p.id, p.status, p.pago_em, p.mp_payment_id, p.valor_total_centavos,
             p.comprador_nome, p.comprador_email,
             e.abertura_portoes, e.nome as evento_nome
        from pedidos p
        join eventos e on e.id = p.evento_id
       where p.id = ${id} and lower(p.comprador_email) = ${email}
       for update of p
    `

    if (!pedido) return { erro: 'Pedido não encontrado.', codigo: 404 }
    if (pedido.status === 'reembolsado') {
      return { erro: 'Este pedido já foi reembolsado.', codigo: 409 }
    }
    if (pedido.status !== 'pago') {
      return { erro: 'Este pedido não está pago.', codigo: 409 }
    }

    const agora = Date.now()
    const dias = pedido.pago_em
      ? (agora - new Date(pedido.pago_em).getTime()) / 86_400_000
      : 999
    const horas = (new Date(pedido.abertura_portoes).getTime() - agora) / 3_600_000

    if (dias > 7) {
      return {
        erro:
          'O prazo de 7 dias corridos previsto no Art. 49 do CDC já passou. ' +
          'Se você acredita que houve um engano, fale com a produção.',
        codigo: 403,
      }
    }
    if (horas < 48) {
      return {
        erro:
          'Faltam menos de 48 horas para a abertura dos portões — a política ' +
          'de cancelamento não permite estorno automático neste prazo. ' +
          'Chame a produção no WhatsApp.',
        codigo: 403,
      }
    }

    const [usados] = await tx<{ n: number }[]>`
      select count(*)::int as n from ingressos
       where pedido_id = ${id} and status = 'usado'
    `
    if (usados.n > 0) {
      return { erro: 'Um dos ingressos deste pedido já foi utilizado.', codigo: 403 }
    }

    // Marca como reembolsado ANTES de chamar o Mercado Pago. Se dois cliques
    // chegarem juntos, o segundo encontra o pedido já marcado e para aqui —
    // evita estorno em dobro.
    await tx`
      update pedidos set status = 'reembolsado', cancelado_em = now() where id = ${id}
    `
    await tx`
      update ingressos set status = 'cancelado' where pedido_id = ${id} and status = 'valido'
    `

    // Devolve os ingressos ao estoque para outra pessoa comprar.
    const itens = await tx<{ lote_id: number; quantidade: number }[]>`
      select lote_id, quantidade from pedido_itens where pedido_id = ${id}
    `
    for (const it of itens) {
      await tx`
        update lotes
           set quantidade_vendida = greatest(quantidade_vendida - ${it.quantidade}, 0)
         where id = ${it.lote_id}
      `
    }

    return { ok: true as const, pedido }
  })

  if ('erro' in verificacao) {
    return NextResponse.json({ erro: verificacao.erro }, { status: verificacao.codigo })
  }

  const { pedido } = verificacao

  // ---- 2. Estorno no Mercado Pago -----------------------------------------
  try {
    if (pedido.mp_payment_id) {
      await reembolsarPagamento(pedido.mp_payment_id)
    }
  } catch (erro) {
    // O ingresso já está invalidado (o cliente não entra na festa), mas o
    // dinheiro não voltou. Isso precisa de olho humano — logamos alto.
    console.error(
      '[REEMBOLSO MANUAL NECESSÁRIO] pedido=%s mp=%s',
      id,
      pedido.mp_payment_id,
      erro
    )
    await sql`
      insert into checkin_log (evento_id, resultado, detalhe)
      values (null, 'invalido', ${'FALHA DE ESTORNO no pedido ' + id})
    `
    return NextResponse.json(
      {
        erro:
          'Seu cancelamento foi registrado, mas o estorno automático falhou. ' +
          'Nossa equipe foi avisada e vai devolver o valor manualmente em até 24h.',
      },
      { status: 502 }
    )
  }

  // ---- 3. E-mail de confirmação -------------------------------------------
  try {
    await enviarEmailReembolso({
      para: pedido.comprador_email,
      nome: pedido.comprador_nome,
      eventoNome: pedido.evento_nome,
      valor: pedido.valor_total_centavos,
    })
  } catch (e) {
    console.error('[cancelar] e-mail de reembolso falhou', e)
  }

  return NextResponse.json({
    ok: true,
    mensagem:
      'Cancelamento confirmado. O valor volta para a mesma chave PIX, ' +
      'normalmente em poucos minutos.',
  })
}
