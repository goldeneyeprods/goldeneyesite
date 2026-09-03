import { MercadoPagoConfig, Payment, PaymentRefund } from 'mercadopago'
import { createHmac, timingSafeEqual } from 'crypto'

// ============================================================================
//  MERCADO PAGO — Checkout Transparente PIX
// ============================================================================

function cliente() {
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN não configurado')
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 10_000 },
  })
}

export interface RespostaPix {
  mpPaymentId: string
  status: string
  qrCode: string
  qrCodeBase64: string
  expiraEm: string
}

/**
 * Cria a cobrança PIX.
 * A chave de idempotência garante que um duplo clique (ou um retry da rede)
 * não gere duas cobranças para o mesmo pedido.
 */
export async function criarPagamentoPix(params: {
  pedidoId: string
  valorCentavos: number
  descricao: string
  email: string
  nome: string
  sobrenome: string
  cpf: string
  expiraEm: Date
}): Promise<RespostaPix> {
  const payment = new Payment(cliente())

  const resultado = await payment.create({
    body: {
      // O Mercado Pago espera reais em decimal; convertemos só aqui, na fronteira.
      transaction_amount: params.valorCentavos / 100,
      description: params.descricao,
      payment_method_id: 'pix',
      date_of_expiration: params.expiraEm.toISOString(),
      external_reference: params.pedidoId,
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/mercadopago`,
      payer: {
        email: params.email,
        first_name: params.nome,
        last_name: params.sobrenome,
        identification: { type: 'CPF', number: params.cpf },
      },
    },
    requestOptions: { idempotencyKey: params.pedidoId },
  })

  const dados = resultado.point_of_interaction?.transaction_data
  if (!dados?.qr_code || !dados?.qr_code_base64) {
    throw new Error('Mercado Pago não retornou o QR Code do PIX')
  }

  return {
    mpPaymentId: String(resultado.id),
    status: String(resultado.status),
    qrCode: dados.qr_code,
    qrCodeBase64: dados.qr_code_base64,
    expiraEm: params.expiraEm.toISOString(),
  }
}

/**
 * Consulta o pagamento direto na API.
 * O corpo do webhook NUNCA é fonte de verdade — qualquer um pode fazer um POST
 * dizendo "aprovado". Nós sempre perguntamos ao Mercado Pago.
 */
export async function consultarPagamento(mpPaymentId: string) {
  const payment = new Payment(cliente())
  return payment.get({ id: mpPaymentId })
}

/**
 * Estorno total. Usado pelo autoatendimento do CDC Art. 49.
 * `total()` devolve o valor cheio; a chave de idempotência impede estorno em
 * dobro se a requisição for repetida por um retry de rede.
 */
export async function reembolsarPagamento(mpPaymentId: string) {
  const refund = new PaymentRefund(cliente())
  return refund.total({
    payment_id: mpPaymentId,
    requestOptions: { idempotencyKey: `estorno-${mpPaymentId}` },
  })
}

/**
 * Valida a assinatura do webhook.
 *
 * O Mercado Pago manda o header `x-signature: ts=<timestamp>,v1=<hash>` e o
 * `x-request-id`. O manifesto assinado é:
 *     id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 * Sem essa checagem, qualquer pessoa que descubra a URL do seu webhook pode
 * liberar ingressos de graça.
 */
export function validarAssinaturaWebhook(params: {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
}): boolean {
  const segredo = process.env.MP_WEBHOOK_SECRET
  if (!segredo) {
    console.error('[webhook] MP_WEBHOOK_SECRET não configurado — rejeitando')
    return false
  }
  if (!params.xSignature || !params.dataId) return false

  let ts = ''
  let v1 = ''
  for (const parte of params.xSignature.split(',')) {
    const [chave, valor] = parte.split('=').map((s) => s?.trim())
    if (chave === 'ts') ts = valor
    if (chave === 'v1') v1 = valor
  }
  if (!ts || !v1) return false

  // Rejeita replay de mais de 5 minutos.
  const idadeMs = Math.abs(Date.now() - Number(ts))
  if (!Number.isFinite(idadeMs) || idadeMs > 5 * 60 * 1000) {
    console.warn('[webhook] assinatura fora da janela de tempo')
    return false
  }

  // O MP normaliza o id para minúsculas quando ele é alfanumérico.
  const id = params.dataId.toLowerCase()
  const manifesto = `id:${id};request-id:${params.xRequestId ?? ''};ts:${ts};`
  const esperado = createHmac('sha256', segredo).update(manifesto).digest('hex')

  const a = Buffer.from(v1)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}
