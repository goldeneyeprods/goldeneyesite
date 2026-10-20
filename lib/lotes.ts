import type { Sql, TransactionSql } from 'postgres'

// ============================================================================
//  ESTOQUE E VIRADA DE LOTE
//
//  Os lotes de um evento se organizam em fases. A meia e a inteira da mesma
//  fase dividem a quantidade da fase, e só a menor fase ainda aberta vende:
//  ela fecha quando passa do `valido_ate` ou quando esgota, o que vier antes.
//
//  Por cima de tudo há o teto do evento (`ingressos_a_venda`). O último lote
//  costuma ter quantidade igual ao teto, e é o teto que faz dele "o que
//  sobrou" dos lotes anteriores.
// ============================================================================

type Consulta = Sql | TransactionSql

export interface LoteVigente {
  id: number
  nome: string
  tipo: 'inteira' | 'meia'
  precoCentavos: number
  fase: number
  validoAte: Date | null
  /** já descontados a fase e o teto do evento */
  disponivel: number
}

export interface Estoque {
  /** lotes da fase que está vendendo agora; vazio se nada está à venda */
  vigentes: LoteVigente[]
  /** quanto ainda cabe na fase vigente (meia + inteira somadas) */
  restanteFase: number
  /** quanto ainda cabe no evento inteiro */
  restanteEvento: number
  /** espaço livre de cada lote, ignorando fase e data — para casos de exceção */
  livrePorLote: Map<number, number>
}

interface Linha {
  id: number
  nome: string
  tipo: 'inteira' | 'meia'
  preco_centavos: number
  fase: number
  ordem: number
  valido_ate: Date | null
  quantidade_total: number
  ocupado: number
}

/**
 * Lê o estoque de um evento. Com `travar`, as linhas dos lotes ficam
 * travadas até o fim da transação: dois compradores disputando o último
 * ingresso entram em fila, não empatam.
 */
export async function lerEstoque(
  q: Consulta,
  eventoId: number,
  { travar = false } = {}
): Promise<Estoque> {
  const [evento] = await q<{ ingressos_a_venda: number | null }[]>`
    select ingressos_a_venda from eventos where id = ${eventoId}
  `

  // `id::int`: o Postgres devolve bigint como texto, e o checkout compara com
  // o número que veio do formulário.
  // Ordenar por id antes de travar evita deadlock entre duas compras.
  const linhas = travar
    ? await q<Linha[]>`
        select id::int as id, nome, tipo, preco_centavos, fase, ordem, valido_ate, quantidade_total,
               (quantidade_vendida + quantidade_reservada) as ocupado
          from lotes
         where evento_id = ${eventoId} and ativo = true
         order by id
           for update
      `
    : await q<Linha[]>`
        select id::int as id, nome, tipo, preco_centavos, fase, ordem, valido_ate, quantidade_total,
               (quantidade_vendida + quantidade_reservada) as ocupado
          from lotes
         where evento_id = ${eventoId} and ativo = true
      `

  // Agrupa por fase.
  const fases = new Map<number, Linha[]>()
  for (const l of linhas) fases.set(l.fase, [...(fases.get(l.fase) ?? []), l])
  const ordemFases = [...fases.keys()].sort((a, b) => a - b)

  const capacidadeFase = (ls: Linha[]) => Math.max(...ls.map((l) => l.quantidade_total))
  const ocupadoFase = (ls: Linha[]) => ls.reduce((s, l) => s + l.ocupado, 0)

  const teto =
    evento?.ingressos_a_venda ??
    ordemFases.reduce((s, f) => s + capacidadeFase(fases.get(f)!), 0)
  const restanteEvento = Math.max(teto - linhas.reduce((s, l) => s + l.ocupado, 0), 0)

  const livrePorLote = new Map(
    linhas.map((l) => [l.id, Math.max(l.quantidade_total - l.ocupado, 0)])
  )

  const agora = Date.now()
  let vigentes: LoteVigente[] = []
  let restanteFase = 0

  if (restanteEvento > 0) {
    for (const f of ordemFases) {
      const ls = fases.get(f)!
      const sobra = capacidadeFase(ls) - ocupadoFase(ls)
      const noPrazo = ls.every((l) => !l.valido_ate || new Date(l.valido_ate).getTime() > agora)
      if (!noPrazo || sobra <= 0) continue

      restanteFase = Math.min(sobra, restanteEvento)
      vigentes = ls
        .sort((a, b) => a.ordem - b.ordem)
        .map((l) => ({
          id: l.id,
          nome: l.nome,
          tipo: l.tipo,
          precoCentavos: l.preco_centavos,
          fase: l.fase,
          validoAte: l.valido_ate,
          disponivel: Math.min(livrePorLote.get(l.id)!, restanteFase),
        }))
      break
    }
  }

  return { vigentes, restanteFase, restanteEvento, livrePorLote }
}
