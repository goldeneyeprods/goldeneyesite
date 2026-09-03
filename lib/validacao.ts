import { z } from 'zod'
import { MAX_INGRESSOS_POR_CPF } from '@/config/site'

// ============================================================================
//  VALIDAÇÃO
//  Tudo aqui roda NO SERVIDOR. A validação do navegador serve só para dar
//  feedback bonito ao usuário — ela pode ser burlada com o DevTools aberto.
// ============================================================================

/** Valida CPF de verdade: os dois dígitos verificadores. */
export function cpfValido(cpf: string): boolean {
  const d = (cpf || '').replace(/\D/g, '')
  if (d.length !== 11) return false
  // Rejeita 000.000.000-00, 111.111.111-11 etc. — passam na conta mas são falsos.
  if (/^(\d)\1{10}$/.test(d)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(d[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== parseInt(d[9])) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(d[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  return resto === parseInt(d[10])
}

export function soDigitos(v: string): string {
  return (v || '').replace(/\D/g, '')
}

/** Formata para exibição: 12345678900 -> 123.456.789-00 */
export function formatarCpf(cpf: string): string {
  const d = soDigitos(cpf)
  if (d.length !== 11) return cpf
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Mascara para telas públicas (LGPD): ***.456.789-** */
export function mascararCpf(cpf: string): string {
  const d = soDigitos(cpf)
  if (d.length !== 11) return '***'
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}

export function mascararEmail(email: string): string {
  const [u, dom] = (email || '').split('@')
  if (!dom) return '***'
  const visivel = u.slice(0, 2)
  return `${visivel}${'*'.repeat(Math.max(u.length - 2, 1))}@${dom}`
}

/** Formata centavos para R$ — nunca use float para dinheiro. */
export function formatarBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// --- Schemas ------------------------------------------------------------------

export const schemaCheckout = z.object({
  // Qual evento está sendo comprado. Validado contra o banco na rota.
  eventoSlug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Evento inválido'),

  nome: z
    .string()
    .trim()
    .min(5, 'Informe seu nome completo')
    .max(120)
    .refine((n) => n.split(/\s+/).length >= 2, 'Informe nome e sobrenome'),

  email: z.string().trim().toLowerCase().email('E-mail inválido').max(160),

  telefone: z
    .string()
    .transform(soDigitos)
    .refine((d) => d.length >= 10 && d.length <= 11, 'Telefone inválido'),

  cpf: z
    .string()
    .transform(soDigitos)
    .refine(cpfValido, 'CPF inválido'),

  aceiteTermos: z.literal(true, {
    errorMap: () => ({ message: 'É preciso aceitar os termos para continuar' }),
  }),

  itens: z
    .array(
      z.object({
        loteId: z.coerce.number().int().positive(),
        quantidade: z.coerce.number().int().min(1).max(MAX_INGRESSOS_POR_CPF),
      })
    )
    .min(1, 'Escolha pelo menos um ingresso')
    .max(4, 'Muitos tipos de ingresso em um pedido só'),
})

export type DadosCheckout = z.infer<typeof schemaCheckout>

export const schemaLoginPortaria = z.object({
  operadorId: z.coerce.number().int().positive(),
  pin: z.string().regex(/^\d{4,8}$/, 'PIN deve ter de 4 a 8 dígitos'),
})

export const schemaCheckin = z.object({
  token: z.string().min(10).max(512),
  gate: z.string().max(60).optional(),
})
