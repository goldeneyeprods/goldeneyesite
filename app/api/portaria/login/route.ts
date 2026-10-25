import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { criarSessao } from '@/lib/auth'
import { schemaLoginPortaria } from '@/lib/validacao'
import { permitir, ipDaRequisicao } from '@/lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
//  POST /api/portaria/login  -> troca usuário + senha por um JWT de 12h
//
//  A tela não lista mais quem é da equipe: a pessoa digita o próprio usuário.
//  Três travas contra força bruta:
//    - por conexão: 10 tentativas a cada 5 minutos
//    - por usuário: 5 erros seguidos bloqueiam esse usuário por 15 minutos
//    - senha escrita de no mínimo 8 caracteres
// ============================================================================

const MAX_FALHAS = 5
const MINUTOS_BLOQUEIO = 15
// Hash de mentira: usuário inexistente gasta o mesmo tempo que senha errada,
// para o tempo de resposta não revelar quem existe.
const HASH_FALSO = '$2a$10$Bfjq4wGF0/Q58fCNCI6kLus.oEF6ww8wilU5Dnrk9dhawAKiDvzn.'

export async function GET() {
  return NextResponse.json({ erro: 'Método não permitido' }, { status: 405 })
}

export async function POST(req: Request) {
  const ip = ipDaRequisicao(req)
  if (!(await permitir(`portaria:login:${ip}`, 10, 300))) {
    return NextResponse.json({ erro: 'Muitas tentativas. Aguarde 5 minutos.' }, { status: 429 })
  }

  const parsed = schemaLoginPortaria.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ erro: 'Usuário ou senha incorretos.' }, { status: 401 })
  }
  const { usuario, senha } = parsed.data

  // O evento mais próximo em que esse usuário trabalha (e que ainda não acabou).
  const [op] = await sql<
    {
      id: number
      nome: string
      pin_hash: string
      gate: string
      evento_id: number
      admin: boolean
      bloqueado_ate: Date | null
      meia_solidaria: boolean
    }[]
  >`
    select o.id, o.nome, o.pin_hash, o.gate, o.evento_id, o.admin, o.bloqueado_ate,
           e.meia_solidaria
      from operadores o
      join eventos e on e.id = o.evento_id
     where lower(o.usuario) = lower(${usuario})
       and o.ativo = true and e.ativo = true
       and e.data_inicio > now() - interval '2 days'
     order by e.data_inicio
     limit 1
  `

  if (op?.bloqueado_ate && new Date(op.bloqueado_ate) > new Date()) {
    await bcrypt.compare(senha, HASH_FALSO)
    return NextResponse.json(
      { erro: `Usuário bloqueado por excesso de tentativas. Tente em ${MINUTOS_BLOQUEIO} minutos.` },
      { status: 423 }
    )
  }

  const ok = await bcrypt.compare(senha, op?.pin_hash ?? HASH_FALSO)
  if (!op || !ok) {
    if (op) {
      await sql`
        update operadores
           set falhas = falhas + 1,
               bloqueado_ate = case when falhas + 1 >= ${MAX_FALHAS}
                                    then now() + make_interval(mins => ${MINUTOS_BLOQUEIO})
                                    else bloqueado_ate end
         where id = ${op.id}
      `
    }
    // Mesma mensagem para usuário inexistente e senha errada — não entrega dica.
    return NextResponse.json({ erro: 'Usuário ou senha incorretos.' }, { status: 401 })
  }

  await sql`update operadores set falhas = 0, bloqueado_ate = null where id = ${op.id}`

  const token = await criarSessao({
    operadorId: op.id,
    eventoId: op.evento_id,
    nome: op.nome,
    gate: op.gate,
    admin: op.admin,
  })

  return NextResponse.json({
    token,
    operador: {
      id: op.id,
      nome: op.nome,
      gate: op.gate,
      admin: op.admin,
      meiaSolidaria: op.meia_solidaria,
    },
  })
}
