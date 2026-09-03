import { sql } from './db'

// ============================================================================
//  RATE LIMIT
//  Implementado no Postgres para não depender de Redis pago. Suficiente para
//  a escala de um evento de casa noturna, e resistente a serverless (o estado
//  não vive na memória da instância, que morre a cada requisição).
// ============================================================================

/**
 * Retorna true se a requisição PODE prosseguir.
 * @param chave  identificador do balde, ex.: "checkout:ip:189.4.0.1"
 * @param limite quantas requisições são permitidas na janela
 * @param janelaSegundos tamanho da janela
 */
export async function permitir(
  chave: string,
  limite: number,
  janelaSegundos: number
): Promise<boolean> {
  // Arredonda o instante para o início da janela — janela fixa, simples e barata.
  const agora = Date.now()
  const inicioJanela = new Date(
    Math.floor(agora / (janelaSegundos * 1000)) * janelaSegundos * 1000
  )

  const [linha] = await sql<{ contagem: number }[]>`
    insert into rate_limit (chave, janela, contagem)
    values (${chave}, ${inicioJanela}, 1)
    on conflict (chave, janela)
      do update set contagem = rate_limit.contagem + 1
    returning contagem
  `

  return linha.contagem <= limite
}

/** Limpa janelas antigas. Chamado pelo cron, junto da expiração de pedidos. */
export async function limparRateLimit(): Promise<void> {
  await sql`delete from rate_limit where janela < now() - interval '1 day'`
}

/** Extrai o IP real do visitante atrás do proxy da Vercel. */
export function ipDaRequisicao(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'desconhecido'
}
