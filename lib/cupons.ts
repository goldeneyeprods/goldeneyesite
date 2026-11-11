// ============================================================================
//  CUPONS — regra única, usada no checkout (servidor) e na prévia da tela
//
//  Código: 6 caracteres, só letras e números que não se confundem no papel
//  (sem 0/O, 1/I/L). O desconto vale para UM ingresso do pedido, o mais caro,
//  e é calculado sobre o preço sem a parte de doação da entrada solidária:
//  o repasse ao Lar Betânia não muda.
// ============================================================================

export const ALFABETO_CUPOM = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const TAMANHO_CUPOM = 6

/** Maiúsculas e sem espaços; o resto do código é conferido pelo formato. */
export function normalizarCupom(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/[\s-]/g, '')
}

export function formatoDeCupom(codigo: string): boolean {
  return new RegExp(`^[${ALFABETO_CUPOM}]{${TAMANHO_CUPOM}}$`).test(codigo)
}

/** Desconto em centavos (inteiro) para os itens do pedido. */
export function descontoDoCupom(
  itens: { precoCentavos: number; doacaoCentavos: number; quantidade: number }[],
  percentual: number
): number {
  const bases = itens
    .filter((i) => i.quantidade > 0)
    .map((i) => Math.max(i.precoCentavos - i.doacaoCentavos, 0))
  if (bases.length === 0) return 0
  return Math.round((Math.max(...bases) * percentual) / 100)
}
