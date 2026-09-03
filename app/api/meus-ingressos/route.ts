import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { emailDaSessao } from '@/lib/sessao-cliente'
import { mascararCpf } from '@/lib/validacao'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET /api/meus-ingressos
//  Lista as compras do e-mail autenticado e já calcula, no servidor, se cada
//  pedido pode ou não ser cancelado. A tela apenas exibe — a regra do CDC não
//  vive no navegador.
// ============================================================================

export async function GET() {
  const email = await emailDaSessao()
  if (!email) {
    return NextResponse.json({ erro: 'Sessão expirada' }, { status: 401 })
  }

  const pedidos = await sql<
    {
      id: string
      status: string
      valor_total_centavos: number
      pago_em: Date | null
      comprador_nome: string
      comprador_cpf: string
      evento_nome: string
      evento_local: string
      evento_data: Date
      abertura_portoes: Date
    }[]
  >`
    select p.id, p.status, p.valor_total_centavos, p.pago_em,
           p.comprador_nome, p.comprador_cpf,
           e.nome as evento_nome, e.local_nome as evento_local,
           e.data_inicio as evento_data, e.abertura_portoes
      from pedidos p
      join eventos e on e.id = p.evento_id
     where lower(p.comprador_email) = ${email}
       and p.status in ('pago','reembolsado')
     order by p.pago_em desc nulls last
  `

  const ingressos = await sql<
    {
      id: string
      pedido_id: string
      tipo: string
      titular_nome: string
      titular_cpf: string
      token_qr: string
      status: string
      usado_em: Date | null
    }[]
  >`
    select i.id, i.pedido_id, i.tipo, i.titular_nome, i.titular_cpf,
           i.token_qr, i.status, i.usado_em
      from ingressos i
      join pedidos p on p.id = i.pedido_id
     where lower(p.comprador_email) = ${email}
     order by i.criado_em
  `

  const agora = Date.now()

  const resposta = pedidos.map((p) => {
    const meus = ingressos.filter((i) => i.pedido_id === p.id)

    // ---- REGRA DO CDC ART. 49 (avaliada no servidor) --------------------
    const diasDesdeCompra = p.pago_em
      ? (agora - new Date(p.pago_em).getTime()) / 86_400_000
      : 999
    const horasAteEvento =
      (new Date(p.abertura_portoes).getTime() - agora) / 3_600_000
    const algumUsado = meus.some((i) => i.status === 'usado')

    let podeCancelar = false
    let motivo = ''

    if (p.status !== 'pago') {
      motivo = 'Este pedido já foi reembolsado.'
    } else if (algumUsado) {
      motivo = 'Um dos ingressos já foi utilizado na portaria.'
    } else if (diasDesdeCompra > 7) {
      motivo = 'O prazo de 7 dias corridos previsto no Art. 49 do CDC já passou.'
    } else if (horasAteEvento < 48) {
      motivo =
        'Faltam menos de 48 horas para a abertura dos portões. Fale com a produção pelo WhatsApp.'
    } else {
      podeCancelar = true
    }

    return {
      id: p.id,
      status: p.status,
      valorTotal: p.valor_total_centavos,
      pagoEm: p.pago_em,
      evento: {
        nome: p.evento_nome,
        local: p.evento_local,
        data: p.evento_data,
        aberturaPortoes: p.abertura_portoes,
      },
      podeCancelar,
      motivoBloqueio: motivo,
      // Transferência de titularidade fecha 24h antes.
      podeTransferir: p.status === 'pago' && horasAteEvento >= 24,
      ingressos: meus.map((i) => ({
        id: i.id,
        tipo: i.tipo,
        titularNome: i.titular_nome,
        titularCpf: mascararCpf(i.titular_cpf),
        tokenQr: i.status === 'valido' ? i.token_qr : null,
        status: i.status,
        usadoEm: i.usado_em,
      })),
    }
  })

  return NextResponse.json(
    { email, pedidos: resposta },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
