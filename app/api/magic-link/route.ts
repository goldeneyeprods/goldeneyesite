import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { gerarMagicToken, hashMagicToken } from '@/lib/ticket'
import { enviarMagicLink } from '@/lib/email'
import { permitir, ipDaRequisicao } from '@/lib/ratelimit'
import { criarSessaoCliente, NOME_COOKIE, opcoesCookie } from '@/lib/sessao-cliente'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  POST /api/magic-link        -> pede o link por e-mail
//  GET  /api/magic-link?token= -> troca o token por um cookie de sessão
// ============================================================================

const schema = z.object({ email: z.string().trim().toLowerCase().email() })

export async function POST(req: Request) {
  const ip = ipDaRequisicao(req)
  if (!(await permitir(`magic:ip:${ip}`, 5, 900))) {
    return NextResponse.json(
      { erro: 'Muitos pedidos. Aguarde alguns minutos.' },
      { status: 429 }
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ erro: 'E-mail inválido' }, { status: 400 })
  }
  const { email } = parsed.data

  const [existe] = await sql<{ n: number }[]>`
    select count(*)::int as n from pedidos
     where lower(comprador_email) = ${email} and status in ('pago','reembolsado')
  `

  // Só manda o e-mail se houver compra, mas a resposta é SEMPRE a mesma.
  // Isso impede que alguém use esta rota para descobrir quem comprou ingresso.
  if (existe.n > 0) {
    if (await permitir(`magic:email:${email}`, 3, 900)) {
      const { token, hash } = gerarMagicToken()
      await sql`
        insert into magic_links (token, email, expira_em)
        values (${hash}, ${email}, now() + interval '15 minutes')
      `
      const link = `${process.env.NEXT_PUBLIC_SITE_URL}/meus-ingressos?token=${token}`
      try {
        await enviarMagicLink(email, link)
      } catch (e) {
        console.error('[magic-link] falha ao enviar', e)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    mensagem:
      'Se houver uma compra com este e-mail, o link de acesso chegou na caixa de entrada. Confira também o spam.',
  })
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token || token.length !== 64) {
    return NextResponse.json({ erro: 'Link inválido' }, { status: 400 })
  }

  const hash = hashMagicToken(token)

  // Marca como usado na mesma consulta que valida: o link não serve duas vezes,
  // nem se dois cliques chegarem ao mesmo tempo.
  const [link] = await sql<{ email: string }[]>`
    update magic_links
       set usado_em = now()
     where token = ${hash}
       and usado_em is null
       and expira_em > now()
    returning email
  `

  if (!link) {
    return NextResponse.json(
      { erro: 'Link expirado ou já utilizado. Peça um novo.' },
      { status: 401 }
    )
  }

  const sessao = await criarSessaoCliente(link.email)
  const res = NextResponse.json({ ok: true, email: link.email })
  res.cookies.set(NOME_COOKIE, sessao, opcoesCookie)
  return res
}
