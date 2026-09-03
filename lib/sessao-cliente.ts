import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// ============================================================================
//  SESSÃO DO COMPRADOR (/meus-ingressos)
//
//  Sem senha: o comprador pede um magic link, clica no e-mail dele e ganha um
//  cookie httpOnly de 2 horas. Login por "CPF + e-mail" seria mais simples,
//  mas qualquer pessoa que souber o CPF de alguém entraria — e CPF vaza toda
//  semana no Brasil. O e-mail é a prova de posse.
// ============================================================================

const COOKIE = 'ge_sessao'

function segredo(): Uint8Array {
  const s = process.env.PORTARIA_JWT_SECRET
  if (!s || s.length < 32) throw new Error('PORTARIA_JWT_SECRET não configurado')
  return new TextEncoder().encode(s)
}

export async function criarSessaoCliente(email: string): Promise<string> {
  return new SignJWT({ email, escopo: 'cliente' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(segredo())
}

export async function emailDaSessao(): Promise<string | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, segredo())
    if (payload.escopo !== 'cliente') return null
    return String(payload.email)
  } catch {
    return null
  }
}

export const NOME_COOKIE = COOKIE

export const opcoesCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 2,
}
