import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { validarAssinaturaWebhook, consultarPagamento } from '@/lib/mercadopago'
import { gerarTokenIngresso } from '@/lib/ticket'
import { enviarEmailConfirmacao, type IngressoParaEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  POST /api/webhook/mercadopago
//
//  ESTA É A ÚNICA FONTE DE VERDADE SOBRE PAGAMENTO.
//  A tela do comprador pode dizer qualquer coisa; o ingresso só existe depois
//  que o Mercado Pago confirma aqui.
//
//  Configure a URL no painel:
//    Suas integrações > sua app > Webhooks > Modo produção
//    URL: https://SEUDOMINIO/api/webhook/mercadopago   Evento: Pagamentos
//  E copie a "Assinatura secreta" para MP_WEBHOOK_SECRET.
// ============================================================================

export async function POST(req: Request) {
  const url = new URL(req.url)
  const corpo = await req.json().catch(() => ({}) as Record<string, unknown>)

  // O MP manda o id ora na query, ora no corpo, dependendo do tipo de evento.
  const dataId =
    url.searchParams.get('data.id') ??
    (corpo as { data?: { id?: string | number } })?.data?.id?.toString() ??
    (corpo as { id?: string | number })?.id?.toString() ??
    null

  const topic =
    url.searchParams.get('type') ??
    (corpo as { type?: string })?.type ??
    'payment'

  // ---- 1. Assinatura ------------------------------------------------------
  const assinaturaOk = validarAssinaturaWebhook({
    xSignature: req.headers.get('x-signature'),
    xRequestId: req.headers.get('x-request-id'),
    dataId,
  })
  if (!assinaturaOk) {
    console.warn('[webhook] assinatura inválida — requisição descartada')
    return NextResponse.json({ erro: 'assinatura inválida' }, { status: 401 })
  }
  if (!dataId) return NextResponse.json({ ok: true, ignorado: 'sem id' })
  if (topic !== 'payment') return NextResponse.json({ ok: true, ignorado: topic })

  // ---- 2. Idempotência ----------------------------------------------------
  // O Mercado Pago reenvia o mesmo webhook várias vezes até receber 200.
  // O unique (mp_topic, mp_id) garante que só o primeiro processa de verdade.
  const inserido = await sql<{ id: number }[]>`
    insert into webhook_log (mp_topic, mp_id, payload)
    values (${topic}, ${dataId}, ${sql.json(corpo as never)})
    on conflict (mp_topic, mp_id) do nothing
    returning id
  `
  if (inserido.length === 0) {
    return NextResponse.json({ ok: true, duplicado: true })
  }

  try {
    // ---- 3. Consulta a verdade na API do MP -------------------------------
    const pagamento = await consultarPagamento(dataId)
    const status = String(pagamento.status)
    const pedidoId = pagamento.external_reference

    if (!pedidoId) {
      console.warn('[webhook] pagamento sem external_reference', dataId)
      return NextResponse.json({ ok: true })
    }

    if (status === 'approved') {
      await aprovarPedido(pedidoId, dataId)
    } else if (['cancelled', 'rejected', 'expired'].includes(status)) {
      await liberarPedido(pedidoId, status === 'expired' ? 'expirado' : 'cancelado')
    }
    // 'pending' / 'in_process': não faz nada, o MP avisa de novo quando mudar.

    await sql`update webhook_log set processado = true where mp_topic = ${topic} and mp_id = ${dataId}`
    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error('[webhook] erro ao processar', erro)
    // Devolve 500 de propósito: o MP vai reenviar, e o registro fica marcado
    // como não processado para auditoria.
    return NextResponse.json({ erro: 'falha ao processar' }, { status: 500 })
  }
}

// ----------------------------------------------------------------------------
//  Aprovação: converte reserva em venda e emite os ingressos.
// ----------------------------------------------------------------------------
async function aprovarPedido(pedidoId: string, mpPaymentId: string) {
  const emitidos = await sql.begin(async (tx) => {
    const [pedido] = await tx<
      {
        id: string
        evento_id: number
        status: string
        comprador_nome: string
        comprador_email: string
        comprador_cpf: string
        valor_total_centavos: number
      }[]
    >`
      select id, evento_id, status, comprador_nome, comprador_email,
             comprador_cpf, valor_total_centavos
        from pedidos
       where id = ${pedidoId}
       for update
    `
    if (!pedido) return null

    // Já estava pago? Webhook repetido — sai sem emitir ingresso de novo.
    if (pedido.status === 'pago') return null
    if (['reembolsado', 'cancelado'].includes(pedido.status)) return null

    await tx`
      update pedidos
         set status = 'pago', pago_em = now(), mp_payment_id = ${mpPaymentId}
       where id = ${pedidoId}
    `

    const itens = await tx<
      { lote_id: number; quantidade: number; tipo: 'inteira' | 'meia' }[]
    >`
      select pi.lote_id, pi.quantidade, l.tipo
        from pedido_itens pi
        join lotes l on l.id = pi.lote_id
       where pi.pedido_id = ${pedidoId}
    `

    const ingressos: IngressoParaEmail[] = []

    for (const item of itens) {
      // Reserva vira venda.
      await tx`
        update lotes
           set quantidade_reservada = greatest(quantidade_reservada - ${item.quantidade}, 0),
               quantidade_vendida   = quantidade_vendida + ${item.quantidade}
         where id = ${item.lote_id}
      `

      for (let n = 0; n < item.quantidade; n++) {
        // Cria a linha primeiro para obter o uuid, depois assina o token com ele.
        const [ing] = await tx<{ id: string }[]>`
          insert into ingressos (
            pedido_id, evento_id, lote_id, tipo,
            titular_nome, titular_cpf, token_qr, status
          ) values (
            ${pedidoId}, ${pedido.evento_id}, ${item.lote_id}, ${item.tipo},
            ${pedido.comprador_nome}, ${pedido.comprador_cpf}, ${'temp-' + crypto.randomUUID()}, 'valido'
          )
          returning id
        `

        const token = gerarTokenIngresso({
          i: ing.id,
          e: pedido.evento_id,
          t: item.tipo,
        })

        await tx`update ingressos set token_qr = ${token} where id = ${ing.id}`

        ingressos.push({
          id: ing.id,
          tipo: item.tipo,
          titularNome: pedido.comprador_nome,
          tokenQr: token,
        })
      }
    }

    return { pedido, ingressos }
  })

  if (!emitidos) return

  // ---- E-mail (fora da transação) ------------------------------------------
  // Se o e-mail falhar, a venda continua válida — o ingresso está no banco e
  // aparece em /meus-ingressos. Melhor um e-mail perdido que uma venda perdida.
  try {
    const [evento] = await sql<
      { nome: string; local_nome: string; endereco: string; data_inicio: Date }[]
    >`select nome, local_nome, endereco, data_inicio from eventos where id = ${emitidos.pedido.evento_id}`

    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(evento.data_inicio))

    await enviarEmailConfirmacao({
      para: emitidos.pedido.comprador_email,
      nome: emitidos.pedido.comprador_nome,
      eventoNome: evento.nome,
      dataFormatada,
      local: evento.local_nome,
      endereco: evento.endereco,
      ingressos: emitidos.ingressos,
      valorTotal: emitidos.pedido.valor_total_centavos,
      linkMeusIngressos: `${process.env.NEXT_PUBLIC_SITE_URL}/meus-ingressos`,
    })
  } catch (erroEmail) {
    console.error('[webhook] pedido pago mas e-mail falhou:', pedidoId, erroEmail)
  }
}

// ----------------------------------------------------------------------------
//  Cancelamento / expiração: devolve o estoque.
// ----------------------------------------------------------------------------
async function liberarPedido(pedidoId: string, novoStatus: 'expirado' | 'cancelado') {
  await sql.begin(async (tx) => {
    const [pedido] = await tx<{ status: string }[]>`
      select status from pedidos where id = ${pedidoId} for update
    `
    if (!pedido || pedido.status !== 'pendente') return

    const itens = await tx<{ lote_id: number; quantidade: number }[]>`
      select lote_id, quantidade from pedido_itens where pedido_id = ${pedidoId}
    `
    for (const it of itens) {
      await tx`
        update lotes
           set quantidade_reservada = greatest(quantidade_reservada - ${it.quantidade}, 0)
         where id = ${it.lote_id}
      `
    }
    await tx`
      update pedidos set status = ${novoStatus}, cancelado_em = now() where id = ${pedidoId}
    `
  })
}
