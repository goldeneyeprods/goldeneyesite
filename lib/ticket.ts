import { createHmac, timingSafeEqual, randomBytes, createHash } from 'crypto'

// ============================================================================
//  ASSINATURA DO INGRESSO
//
//  O QR Code NÃO carrega um id sequencial — se carregasse, qualquer pessoa
//  geraria ingressos falsos contando de 1 em 1. Ele carrega um payload curto
//  assinado com HMAC-SHA256. Sem o TICKET_HMAC_SECRET é matematicamente
//  inviável forjar um token válido.
//
//  Formato:  <payload em base64url>.<assinatura em base64url truncada>
//  Exemplo:  eyJpIjoiYTFiMmMz...In0.k3Jq9x2ZpQ
// ============================================================================

interface PayloadIngresso {
  i: string // ingresso_id (uuid)
  e: number // evento_id
  t: 'inteira' | 'meia'
  v: 1 // versão do formato, para poder evoluir sem quebrar QRs antigos
}

function segredo(): Buffer {
  const s = process.env.TICKET_HMAC_SECRET
  if (!s || s.length < 32) {
    throw new Error(
      'TICKET_HMAC_SECRET ausente ou curto demais. Gere com: openssl rand -hex 32'
    )
  }
  return Buffer.from(s, 'utf8')
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function assinar(payloadB64: string): string {
  // 16 bytes de assinatura = 128 bits. Suficiente contra forja e mantém o QR
  // pequeno o bastante para ser lido rápido, no escuro, numa tela suja de festa.
  const mac = createHmac('sha256', segredo()).update(payloadB64).digest().subarray(0, 16)
  return b64url(mac)
}

/** Gera o token que vai dentro do QR Code do ingresso. */
export function gerarTokenIngresso(p: Omit<PayloadIngresso, 'v'>): string {
  const payload: PayloadIngresso = { ...p, v: 1 }
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), 'utf8'))
  return `${payloadB64}.${assinar(payloadB64)}`
}

/**
 * Verifica a assinatura e devolve o payload — ou null se o token foi adulterado.
 * Isto roda ANTES de qualquer consulta ao banco: token forjado nem chega no DB.
 */
export function verificarTokenIngresso(token: string): PayloadIngresso | null {
  if (typeof token !== 'string' || token.length > 512) return null

  const partes = token.split('.')
  if (partes.length !== 2) return null

  const [payloadB64, assinaturaRecebida] = partes
  const assinaturaEsperada = assinar(payloadB64)

  // Comparação em tempo constante — evita ataque de timing na assinatura.
  const a = Buffer.from(assinaturaRecebida)
  const b = Buffer.from(assinaturaEsperada)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(deB64url(payloadB64).toString('utf8'))
    if (payload?.v !== 1 || typeof payload.i !== 'string') return null
    return payload as PayloadIngresso
  } catch {
    return null
  }
}

/**
 * Hash do token, usado no modo offline da portaria.
 * O celular do segurança baixa só os hashes — se o aparelho for perdido ou
 * roubado, ninguém consegue reconstruir os QR Codes a partir da lista.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 32)
}

// --- Magic link para /meus-ingressos -----------------------------------------

/** Gera um token de uso único para acesso sem senha. */
export function gerarMagicToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex')
  // No banco guardamos só o hash. Vazamento do banco não dá acesso a ninguém.
  const hash = createHash('sha256').update(token).digest('hex')
  return { token, hash }
}

export function hashMagicToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
