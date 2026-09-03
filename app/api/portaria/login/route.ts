import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { criarSessao } from '@/lib/auth'
import { schemaLoginPortaria } from '@/lib/validacao'
import { permitir, ipDaRequisicao } from '@/lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  GET  /api/portaria/login  -> lista os operadores do evento (só nome e id)
//  POST /api/portaria/login  -> troca PIN por um JWT de 12h
// ============================================================================

export async function GET() {
  // Lista operadores de qualquer evento que ainda não terminou. Com vários
  // eventos cadastrados, a equipe escolhe o dela — o evento vem junto no nome
  // para não haver dúvida na hora do login.
  const operadores = await sql<
    { id: number; nome: string; gate: string; evento: string }[]
  >`
    select o.id, o.nome, o.gate, e.nome as evento
      from operadores o
      join eventos e on e.id = o.evento_id
     where e.ativo = true
       and o.ativo = true
       and e.data_inicio > now() - interval '2 days'
     order by e.data_inicio, o.nome
  `
  return NextResponse.json({ operadores })
}

export async function POST(req: Request) {
  const ip = ipDaRequisicao(req)

  // PIN de 6 dígitos é fraco por natureza — o rate limit é que segura a força bruta.
  if (!(await permitir(`portaria:login:${ip}`, 10, 300))) {
    return NextResponse.json(
      { erro: 'Muitas tentativas. Aguarde 5 minutos.' },
      { status: 429 }
    )
  }

  const parsed = schemaLoginPortaria.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 })
  }

  const [operador] = await sql<
    { id: number; nome: string; pin_hash: string; gate: string; evento_id: number }[]
  >`
    select o.id, o.nome, o.pin_hash, o.gate, o.evento_id
      from operadores o
      join eventos e on e.id = o.evento_id
     where o.id = ${parsed.data.operadorId}
       and o.ativo = true and e.ativo = true
  `

  // Mesma mensagem para operador inexistente e PIN errado — não entrega dica.
  const senhaOk =
    operador && (await bcrypt.compare(parsed.data.pin, operador.pin_hash))
  if (!senhaOk) {
    return NextResponse.json({ erro: 'PIN incorreto.' }, { status: 401 })
  }

  const token = await criarSessao({
    operadorId: operador.id,
    eventoId: operador.evento_id,
    nome: operador.nome,
    gate: operador.gate,
  })

  return NextResponse.json({
    token,
    operador: { id: operador.id, nome: operador.nome, gate: operador.gate },
  })
}
