import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { validarAssinaturaWebhook } from '@/lib/mercadopago'
import { sincronizarPagamento } from '@/lib/pedidos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  POST /api/webhook/mercadopago
//
//  O aviso do Mercado Pago é só um "vá conferir": o corpo nunca é fonte de
//  verdade. A cada aviso o pagamento é consultado na API, e o ingresso só
//  existe depois que ela responde "approved".
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

  // ---- 2. Registro --------------------------------------------------------
  // Um mesmo pagamento recebe vários avisos com o mesmo id: "criado" quando o
  // PIX é gerado e "atualizado" quando é pago. Por isso o registro NÃO serve
  // para descartar avisos — ele guarda o último, para auditoria. Quem impede
  // ingresso em dobro é o aprovarPedido, que trava o pedido e confere o status.
  await sql`
    insert into webhook_log (mp_topic, mp_id, payload)
    values (${topic}, ${dataId}, ${sql.json(corpo as never)})
    on conflict (mp_topic, mp_id)
      do update set payload = excluded.payload, processado = false, recebido_em = now()
  `

  try {
    // ---- 3. Consulta a verdade na API do MP -------------------------------
    await sincronizarPagamento(dataId)
    await sql`update webhook_log set processado = true where mp_topic = ${topic} and mp_id = ${dataId}`
    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error('[webhook] erro ao processar', erro)
    // Devolve 500 de propósito: o MP vai reenviar, e o registro fica marcado
    // como não processado para auditoria.
    return NextResponse.json({ erro: 'falha ao processar' }, { status: 500 })
  }
}
