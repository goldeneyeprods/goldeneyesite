import postgres from 'postgres'

// ============================================================================
//  Conexão com o Postgres.
//  Em serverless (Vercel) cada invocação pode criar uma conexão nova, por isso
//  reaproveitamos a instância no globalThis e usamos o POOLER do Supabase
//  (porta 6543). Com a porta 5432 direta, o banco esgota conexões em um pico
//  de vendas — que é exatamente quando você não pode ficar fora do ar.
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined
}

function criarConexao() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL não configurada. Copie o .env.example para .env.local.'
    )
  }

  return postgres(url, {
    max: 5, // poucas conexões por instância; o pooler cuida do resto
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // obrigatório com o transaction pooler do Supabase
  })
}

export const sql = globalThis.__sql ?? criarConexao()

if (process.env.NODE_ENV !== 'production') globalThis.__sql = sql

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
