// ============================================================================
//  Formatação de data e hora — sempre no fuso de São Paulo.
//  Centralizado aqui para que servidor e navegador nunca discordem (o que
//  causaria erro de hidratação no React).
// ============================================================================

const FUSO = 'America/Sao_Paulo'

export function dataLonga(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: FUSO,
  }).format(new Date(iso))
}

export function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: FUSO,
  }).format(new Date(iso))
}

export function mesAno(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: FUSO,
  }).format(new Date(iso))
}

export function hora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: FUSO,
  }).format(new Date(iso))
}

/** "20" e "NOV" separados, para o bloco de data dos cards */
export function diaMes(iso: string): { dia: string; mes: string } {
  const d = new Date(iso)
  return {
    dia: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone: FUSO }).format(d),
    mes: new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: FUSO })
      .format(d)
      .replace('.', '')
      .toUpperCase(),
  }
}
