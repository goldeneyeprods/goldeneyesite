import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { emailDaSessao } from '@/lib/sessao-cliente'
import { cpfValido, soDigitos } from '@/lib/validacao'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  POST /api/ingressos/:id/transferir
//  Troca o titular do ingresso até 24h antes da abertura dos portões.
//  O token do QR NÃO muda — ele aponta para o id do ingresso, e o nome é lido
//  do banco na hora do check-in. Quem já baixou o PDF não fica na mão.
// ============================================================================

const schema = z.object({
  nome: z
    .string()
    .trim()
    .min(5, 'Informe o nome completo')
    .max(120)
    .refine((n) => n.split(/\s+/).length >= 2, 'Informe nome e sobrenome'),
  cpf: z.string().transform(soDigitos).refine(cpfValido, 'CPF inválido'),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const email = await emailDaSessao()
  if (!email) {
    return NextResponse.json({ erro: 'Sessão expirada.' }, { status: 401 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message ?? 'Dados inválidos' },
      { status: 400 }
    )
  }

  const [ingresso] = await sql<
    { id: string; status: string; abertura_portoes: Date }[]
  >`
    select i.id, i.status, e.abertura_portoes
      from ingressos i
      join pedidos p on p.id = i.pedido_id
      join eventos e on e.id = i.evento_id
     where i.id = ${id} and lower(p.comprador_email) = ${email}
  `

  if (!ingresso) {
    return NextResponse.json({ erro: 'Ingresso não encontrado.' }, { status: 404 })
  }
  if (ingresso.status !== 'valido') {
    return NextResponse.json(
      { erro: 'Este ingresso não está mais válido para transferência.' },
      { status: 409 }
    )
  }

  const horas =
    (new Date(ingresso.abertura_portoes).getTime() - Date.now()) / 3_600_000
  if (horas < 24) {
    return NextResponse.json(
      {
        erro:
          'A transferência de titularidade fecha 24 horas antes da abertura ' +
          'dos portões. Fale com a produção pelo WhatsApp.',
      },
      { status: 403 }
    )
  }

  await sql`
    update ingressos
       set titular_nome = ${parsed.data.nome}, titular_cpf = ${parsed.data.cpf}
     where id = ${id}
  `

  return NextResponse.json({
    ok: true,
    mensagem: `Ingresso transferido para ${parsed.data.nome}. Avise a pessoa de levar documento com foto.`,
  })
}
