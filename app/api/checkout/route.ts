import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { schemaCheckout, formatarBRL } from '@/lib/validacao'
import { permitir, ipDaRequisicao } from '@/lib/ratelimit'
import { criarPagamentoPix } from '@/lib/mercadopago'
import { MAX_INGRESSOS_POR_CPF, MINUTOS_EXPIRACAO_PIX } from '@/config/site'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  POST /api/checkout
//  Cria o pedido, RESERVA o estoque e devolve o QR Code do PIX.
//
//  O pedido nasce 'pendente'. Ele só vira 'pago' pelo webhook do Mercado Pago
//  — nunca por nada que venha do navegador.
// ============================================================================

export async function POST(req: Request) {
  const ip = ipDaRequisicao(req)

  try {
    // ---- 1. Rate limit por IP -------------------------------------------
    if (!(await permitir(`checkout:ip:${ip}`, 8, 600))) {
      return NextResponse.json(
        { erro: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' },
        { status: 429 }
      )
    }

    // ---- 2. Validação --------------------------------------------------
    const corpo = await req.json().catch(() => null)
    const parsed = schemaCheckout.safeParse(corpo)
    if (!parsed.success) {
      return NextResponse.json(
        { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }
    const dados = parsed.data

    // Rate limit também por CPF — impede um bot rodando por vários IPs.
    if (!(await permitir(`checkout:cpf:${dados.cpf}`, 6, 600))) {
      return NextResponse.json(
        { erro: 'Muitas tentativas com este CPF. Aguarde alguns minutos.' },
        { status: 429 }
      )
    }

    // ---- 3. Evento ativo ------------------------------------------------
    // O slug vem do formulário, mas quem manda é o banco: preço, estoque e
    // prazo saem daqui, nunca do que o navegador enviou.
    const [evento] = await sql<
      { id: number; nome: string; abertura_portoes: Date }[]
    >`
      select id, nome, abertura_portoes
      from eventos
      where slug = ${dados.eventoSlug} and ativo = true
      limit 1
    `
    if (!evento) {
      return NextResponse.json({ erro: 'Evento indisponível.' }, { status: 404 })
    }
    if (new Date(evento.abertura_portoes) < new Date()) {
      return NextResponse.json(
        { erro: 'As vendas online para este evento já foram encerradas.' },
        { status: 400 }
      )
    }

    const totalIngressos = dados.itens.reduce((s, i) => s + i.quantidade, 0)
    if (totalIngressos > MAX_INGRESSOS_POR_CPF) {
      return NextResponse.json(
        { erro: `Máximo de ${MAX_INGRESSOS_POR_CPF} ingressos por CPF.` },
        { status: 400 }
      )
    }

    const expiraEm = new Date(Date.now() + MINUTOS_EXPIRACAO_PIX * 60_000)

    // ---- 4. Transação: trava os lotes, confere estoque, reserva ----------
    // A transação é curta de propósito: nenhuma chamada de rede acontece com
    // as linhas travadas, senão um pico de vendas vira fila de espera no banco.
    const resultado = await sql.begin(async (tx) => {
      // Quantos ingressos este CPF já tem confirmados neste evento?
      const [jaComprou] = await tx<{ total: number }[]>`
        select coalesce(count(i.id), 0)::int as total
        from ingressos i
        join pedidos p on p.id = i.pedido_id
        where p.comprador_cpf = ${dados.cpf}
          and p.evento_id = ${evento.id}
          and p.status = 'pago'
          and i.status <> 'cancelado'
      `
      if (jaComprou.total + totalIngressos > MAX_INGRESSOS_POR_CPF) {
        throw new Error(
          `LIMITE:Este CPF já possui ${jaComprou.total} ingresso(s). ` +
            `O limite é ${MAX_INGRESSOS_POR_CPF} por CPF.`
        )
      }

      let valorTotal = 0
      const itensValidados: {
        loteId: number
        quantidade: number
        precoUnitario: number
        tipo: 'inteira' | 'meia'
      }[] = []

      for (const item of dados.itens) {
        // FOR UPDATE trava a linha do lote até o fim da transação: dois
        // compradores disputando o último ingresso entram em fila, não empatam.
        const [lote] = await tx<
          {
            id: number
            tipo: 'inteira' | 'meia'
            preco_centavos: number
            disponivel: number
            ativo: boolean
            valido_ate: Date | null
          }[]
        >`
          select id, tipo, preco_centavos, ativo, valido_ate,
                 (quantidade_total - quantidade_vendida - quantidade_reservada) as disponivel
          from lotes
          where id = ${item.loteId} and evento_id = ${evento.id}
          for update
        `

        if (!lote || !lote.ativo) throw new Error('LOTE:Lote indisponível.')
        if (lote.valido_ate && new Date(lote.valido_ate) < new Date()) {
          throw new Error('LOTE:Este lote já foi encerrado.')
        }
        if (lote.disponivel < item.quantidade) {
          throw new Error(
            lote.disponivel <= 0
              ? 'ESTOQUE:Este lote esgotou.'
              : `ESTOQUE:Restam apenas ${lote.disponivel} ingresso(s) neste lote.`
          )
        }

        // O preço vem SEMPRE do banco. Nada que o cliente mande é considerado.
        valorTotal += lote.preco_centavos * item.quantidade
        itensValidados.push({
          loteId: lote.id,
          quantidade: item.quantidade,
          precoUnitario: lote.preco_centavos,
          tipo: lote.tipo,
        })

        await tx`
          update lotes
             set quantidade_reservada = quantidade_reservada + ${item.quantidade}
           where id = ${lote.id}
        `
      }

      const [pedido] = await tx<{ id: string }[]>`
        insert into pedidos (
          evento_id, comprador_nome, comprador_email, comprador_cpf,
          comprador_telefone, valor_total_centavos, status,
          pix_expira_em, ip_origem, aceite_termos_em
        ) values (
          ${evento.id}, ${dados.nome}, ${dados.email}, ${dados.cpf},
          ${dados.telefone}, ${valorTotal}, 'pendente',
          ${expiraEm}, ${ip}, now()
        )
        returning id
      `

      for (const it of itensValidados) {
        await tx`
          insert into pedido_itens (pedido_id, lote_id, quantidade, preco_unitario_centavos)
          values (${pedido.id}, ${it.loteId}, ${it.quantidade}, ${it.precoUnitario})
        `
      }

      return { pedidoId: pedido.id, valorTotal, eventoNome: evento.nome }
    })

    // ---- 5. Cobrança PIX (fora da transação) ----------------------------
    const partes = dados.nome.trim().split(/\s+/)
    try {
      const pix = await criarPagamentoPix({
        pedidoId: resultado.pedidoId,
        valorCentavos: resultado.valorTotal,
        descricao: `Ingresso - ${resultado.eventoNome}`,
        email: dados.email,
        nome: partes[0],
        sobrenome: partes.slice(1).join(' ') || partes[0],
        cpf: dados.cpf,
        expiraEm,
      })

      await sql`
        update pedidos
           set mp_payment_id      = ${pix.mpPaymentId},
               pix_qr_code        = ${pix.qrCode},
               pix_qr_code_base64 = ${pix.qrCodeBase64}
         where id = ${resultado.pedidoId}
      `

      return NextResponse.json({
        pedidoId: resultado.pedidoId,
        qrCode: pix.qrCode,
        qrCodeBase64: pix.qrCodeBase64,
        expiraEm: pix.expiraEm,
        valorTotal: resultado.valorTotal,
        valorFormatado: formatarBRL(resultado.valorTotal),
      })
    } catch (erroPix) {
      // O PIX falhou: devolve o estoque na hora, senão os ingressos ficariam
      // presos numa reserva fantasma até o cron passar.
      console.error('[checkout] falha ao criar PIX', erroPix)
      await sql.begin(async (tx) => {
        const itens = await tx<{ lote_id: number; quantidade: number }[]>`
          select lote_id, quantidade from pedido_itens where pedido_id = ${resultado.pedidoId}
        `
        for (const it of itens) {
          await tx`
            update lotes
               set quantidade_reservada = greatest(quantidade_reservada - ${it.quantidade}, 0)
             where id = ${it.lote_id}
          `
        }
        await tx`update pedidos set status = 'cancelado' where id = ${resultado.pedidoId}`
      })

      return NextResponse.json(
        { erro: 'Não conseguimos gerar o PIX agora. Tente novamente em instantes.' },
        { status: 502 }
      )
    }
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : ''

    // Erros de negócio viram mensagem clara; o resto vira 500 genérico.
    if (msg.startsWith('LIMITE:') || msg.startsWith('LOTE:') || msg.startsWith('ESTOQUE:')) {
      return NextResponse.json({ erro: msg.split(':').slice(1).join(':') }, { status: 409 })
    }

    console.error('[checkout] erro inesperado', erro)
    return NextResponse.json(
      { erro: 'Erro ao processar a compra. Tente novamente.' },
      { status: 500 }
    )
  }
}
