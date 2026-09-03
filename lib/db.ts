import postgres from 'postgres'

// ============================================================================
//  Conexão com o Postgres.
//
//  A conexão é PREGUIÇOSA: só nasce quando alguém realmente consulta o banco.
//  Isso importa por dois motivos:
//
//  1. O site público (home, agenda, LP dos eventos, páginas legais) não toca
//     no banco. Ele precisa subir e funcionar mesmo antes de você configurar
//     o Supabase — dá para publicar e divulgar um evento hoje, e deixar a
//     venda de ingresso para depois.
//  2. Se a conexão fosse criada ao carregar o módulo, o build inteiro
//     quebraria por falta de uma variável que aquela página nem usa.
//
//  Em serverless cada invocação pode criar conexão nova, por isso
//  reaproveitamos a instância e usamos o POOLER do Supabase (porta 6543).
//  Com a 5432 direta, o banco esgota conexões justamente no pico de vendas.
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined
}

function criarConexao() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL não configurada. O site público funciona sem ela, mas ' +
        'venda de ingresso e portaria precisam do banco. Veja o README.'
    )
  }

  return postgres(url, {
    max: 5, // poucas conexões por instância; o pooler cuida do resto
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // obrigatório com o transaction pooler do Supabase
  })
}

function obterConexao(): ReturnType<typeof postgres> {
  if (!globalThis.__sql) globalThis.__sql = criarConexao()
  return globalThis.__sql
}

/**
 * Usado igual a uma conexão normal — `sql\`select ...\``, `sql.begin(...)`,
 * `sql.json(...)`. A diferença é que a conexão só abre no primeiro uso.
 */
export const sql = new Proxy(function () {} as unknown as ReturnType<typeof postgres>, {
  apply(_alvo, _este, argumentos) {
    return (obterConexao() as unknown as (...a: unknown[]) => unknown)(...argumentos)
  },
  get(_alvo, propriedade) {
    const conexao = obterConexao() as unknown as Record<string | symbol, unknown>
    const valor = conexao[propriedade]
    return typeof valor === 'function' ? valor.bind(conexao) : valor
  },
}) as ReturnType<typeof postgres>

// --- Tipos usados pelas rotas ------------------------------------------------

export type StatusPedido =
  | 'pendente'
  | 'pago'
  | 'expirado'
  | 'cancelado'
  | 'reembolsado'

export type StatusIngresso = 'valido' | 'usado' | 'cancelado'

export interface Lote {
  id: number
  evento_id: number
  nome: string
  tipo: 'inteira' | 'meia'
  preco_centavos: number
  quantidade_total: number
  quantidade_vendida: number
  quantidade_reservada: number
  ordem: number
  ativo: boolean
  valido_ate: Date | null
}

export interface Evento {
  id: number
  slug: string
  nome: string
  subtitulo: string | null
  descricao: string | null
  data_inicio: Date
  abertura_portoes: Date
  local_nome: string
  endereco: string
  mapa_url: string | null
  classificacao_etaria: string
  capacidade: number
  ativo: boolean
}
