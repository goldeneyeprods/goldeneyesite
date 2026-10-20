import { sql } from './db'
import { consultarPagamento, reembolsarPagamento } from './mercadopago'
import { gerarTokenIngresso } from './ticket'
import { enviarEmailConfirmacao, type IngressoParaEmail } from './email'
import { lerEstoque } from './lotes'

// ============================================================================
//  CICLO DE VIDA DO PEDIDO
//
//  Quem decide se um pedido foi pago é sempre a API do Mercado Pago. Este
//  módulo é chamado por três caminhos, e todos chegam ao mesmo resultado:
//    - o webhook, quando o MP avisa;
//    - a tela de pagamento, quando o aviso demora;
//    - o cron, que confere os pendentes antes de expirá-los.
//  As funções são idempotentes: chamar duas vezes não emite ingresso em dobro.
// ============================================================================

/**
 * Pergunta ao Mercado Pago o estado do pagamento e aplica no pedido.
 * Devolve o status do MP, ou null se o pagamento não pertence a um pedido.
 */
export async function sincronizarPagamento(mpPaymentId: string): Promise<string | null> {
  const pagamento = await consultarPagamento(mpPaymentId)
  const status = String(pagamento.status)
  const pedidoId = pagamento.external_reference

  if (!pedidoId) {
    console.warn('[pedidos] pagamento sem external_reference', mpPaymentId)
    return null
  }

  if (status === 'approved') {
    await aprovarPedido(pedidoId, mpPaymentId)
  } else if (['cancelled', 'rejected', 'expired'].includes(status)) {
    await liberarPedido(pedidoId, status === 'expired' ? 'expirado' : 'cancelado')
  }
  // 'pending' / 'in_process': nada a fazer, o MP avisa de novo quando mudar.

  return status
}

// ----------------------------------------------------------------------------
//  Aprovação: converte reserva em venda e emite os ingressos.
// ----------------------------------------------------------------------------
export async function aprovarPedido(pedidoId: string, mpPaymentId: string) {
  const resultado = await sql.begin(async (tx) => {
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

    // Já estava pago? Aviso repetido — sai sem emitir ingresso de novo.
    if (pedido.status === 'pago' || pedido.status === 'reembolsado') return null

    // O PIX foi pago no limite do prazo e o pedido já tinha sido expirado (ou
    // cancelado) aqui. O dinheiro entrou, então o comprador não pode ficar sem
    // nada: a reserva já voltou ao estoque, e o ingresso só sai se ainda
    // houver lugar. Se não houver, o valor é devolvido.
    const reservaPerdida = pedido.status !== 'pendente'

    const itens = await tx<
      { lote_id: number; quantidade: number; tipo: 'inteira' | 'meia' }[]
    >`
      select pi.lote_id::int as lote_id, pi.quantidade, l.tipo
        from pedido_itens pi
        join lotes l on l.id = pi.lote_id
       where pi.pedido_id = ${pedidoId}
    `

    if (reservaPerdida) {
      // Aqui vale o lote que a pessoa pagou, mesmo que já tenha virado: o que
      // importa é caber no lote e no teto do evento.
      const estoque = await lerEstoque(tx, pedido.evento_id, { travar: true })
      const pedidoTodo = itens.reduce((s, i) => s + i.quantidade, 0)
      const cabe =
        pedidoTodo <= estoque.restanteEvento &&
        itens.every((i) => (estoque.livrePorLote.get(i.lote_id) ?? 0) >= i.quantidade)

      if (!cabe) {
        await tx`
          update pedidos
             set status = 'reembolsado', mp_payment_id = ${mpPaymentId},
                 pago_em = now()
           where id = ${pedidoId}
        `
        return { reembolsar: true as const }
      }
    }

    await tx`
      update pedidos
         set status = 'pago', pago_em = now(), mp_payment_id = ${mpPaymentId},
             cancelado_em = null
       where id = ${pedidoId}
    `

    const ingressos: IngressoParaEmail[] = []

    for (const item of itens) {
      // Reserva vira venda. Se a reserva já tinha sido devolvida, só soma.
      const devolverReserva = reservaPerdida ? 0 : item.quantidade
      await tx`
        update lotes
           set quantidade_reservada = greatest(quantidade_reservada - ${devolverReserva}, 0),
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

    return { reembolsar: false as const, pedido, ingressos }
  })

  if (!resultado) return

  if (resultado.reembolsar) {
    // Fora da transação: chamada de rede não segura linha travada.
    console.warn('[pedidos] pago após expirar e sem estoque — estornando', pedidoId)
    await reembolsarPagamento(mpPaymentId)
    return
  }

  // ---- E-mail (fora da transação) ------------------------------------------
  // Se o e-mail falhar, a venda continua válida — o ingresso está no banco e
  // aparece em /meus-ingressos. Melhor um e-mail perdido que uma venda perdida.
  try {
    const [evento] = await sql<
      {
        nome: string
        local_nome: string
        endereco: string
        data_inicio: Date
        meia_solidaria: boolean
      }[]
    >`
      select nome, local_nome, endereco, data_inicio, meia_solidaria
        from eventos where id = ${resultado.pedido.evento_id}
    `

    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(evento.data_inicio))

    await enviarEmailConfirmacao({
      para: resultado.pedido.comprador_email,
      nome: resultado.pedido.comprador_nome,
      eventoNome: evento.nome,
      dataFormatada,
      local: evento.local_nome,
      endereco: evento.endereco,
      meiaSolidaria: evento.meia_solidaria,
      ingressos: resultado.ingressos,
      valorTotal: resultado.pedido.valor_total_centavos,
      linkMeusIngressos: `${process.env.NEXT_PUBLIC_SITE_URL}/meus-ingressos`,
    })
  } catch (erroEmail) {
    console.error('[pedidos] pedido pago mas e-mail falhou:', pedidoId, erroEmail)
  }
}

// ----------------------------------------------------------------------------
//  Cancelamento / expiração: devolve o estoque.
// ----------------------------------------------------------------------------
export async function liberarPedido(pedidoId: string, novoStatus: 'expirado' | 'cancelado') {
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
