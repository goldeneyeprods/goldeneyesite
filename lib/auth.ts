import { SignJWT, jwtVerify } from 'jose'

// ============================================================================
//  SESSÃO DO APP DE PORTARIA
//  JWT curto assinado no servidor. O celular do segurança guarda só isso —
//  se o aparelho sumir no meio da festa, o token expira sozinho em 12h.
// ============================================================================

export interface SessaoPortaria {
  operadorId: number
  eventoId: number
  nome: string
  gate: string
}

function segredo(): Uint8Array {
  const s = process.env.PORTARIA_JWT_SECRET
  if (!s || s.length < 32) {
    throw new Error(
      'PORTARIA_JWT_SECRET ausente ou curto demais. Gere com: openssl rand -hex 32'
    )
  }
  return new TextEncoder().encode(s)
}

export async function criarSessao(dados: SessaoPortaria): Promise<string> {
  return new SignJWT({ ...dados })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(segredo())
}

export async function lerSessao(token: string | null): Promise<SessaoPortaria | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, segredo())
    return {
      operadorId: Number(payload.operadorId),
      eventoId: Number(payload.eventoId),
      nome: String(payload.nome),
      gate: String(payload.gate ?? ''),
    }
  } catch {
    return null
  }
}

/** Lê a sessão a partir do header Authorization: Bearer <token>. */
export async function sessaoDaRequisicao(req: Request): Promise<SessaoPortaria | null> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return lerSessao(auth.slice(7))
}
