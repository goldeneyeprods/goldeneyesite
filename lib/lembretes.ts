import { sql } from './db'
import { enviarEmailLembrete } from './email'
import { chaveLinkPedido } from './ticket'
import { linkDoIngresso } from './url'
import { enviarLembreteWhatsapp, whatsappConfigurado } from './whatsapp'

// ============================================================================
//  LEMBRETES DO EVENTO — véspera e dia
//
//  Rodam junto com a rotina de 10 em 10 minutos. Cada pedido pago recebe no
//  máximo dois, a partir das 11h de Brasília: por e-mail sempre e, se a API do
//  WhatsApp estiver ligada e a pessoa aceitou, também por lá.
//  O pedido é marcado ANTES do envio (fora de transação travada); se o e-mail
//  falhar, a marca sai e a próxima rodada tenta de novo.
// ============================================================================

const HORA_DO_ENVIO = 11

type Alvo = {
  id: string
  comprador_nome: string
  comprador_email: string
  comprador_telefone: string
  whatsapp_optin: boolean
  tem_meia: boolean
  nome: string
  local_nome: string
  endereco: string
  abertura_portoes: Date
}

async function reservar(qual: 'vespera' | 'dia'): Promise<Alvo[]> {
  const coluna = qual === 'vespera' ? 'lembrete_vespera_em' : 'lembrete_dia_em'
  const diasAntes = qual === 'vespera' ? 1 : 0

  return sql<Alvo[]>`
    with alvos as (
      select p.id
        from pedidos p
        join eventos e on e.id = p.evento_id
       where p.status = 'pago'
         and p.${sql(coluna)} is null
         and (e.data_inicio at time zone 'America/Sao_Paulo')::date - ${diasAntes}::int
             = (now() at time zone 'America/Sao_Paulo')::date
         and extract(hour from now() at time zone 'America/Sao_Paulo') >= ${HORA_DO_ENVIO}
         and now() < e.abertura_portoes
         -- quem acabou de comprar já recebeu o ingresso agora há pouco
         and p.pago_em < now() - interval '3 hours'
       limit 40
       for update of p skip locked
    )
    update pedidos p
       set ${sql(coluna)} = now()
      from alvos, eventos e
     where p.id = alvos.id and e.id = p.evento_id
    returning p.id, p.comprador_nome, p.comprador_email, p.comprador_telefone,
              p.whatsapp_optin, e.nome, e.local_nome, e.endereco, e.abertura_portoes,
              (not e.meia_solidaria and exists (
                 select 1 from ingressos i
                  where i.pedido_id = p.id and i.tipo = 'meia' and i.status = 'valido'
              )) as tem_meia
  `
}

export async function enviarLembretes(): Promise<{ enviados: number; falhas: number }> {
  let enviados = 0
  let falhas = 0
  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
  const zap = whatsappConfigurado()

  for (const qual of ['vespera', 'dia'] as const) {
    const coluna = qual === 'vespera' ? 'lembrete_vespera_em' : 'lembrete_dia_em'
    for (const p of await reservar(qual)) {
      const comum = {
        nome: p.comprador_nome,
        quando: qual === 'vespera' ? ('Amanhã' as const) : ('Hoje' as const),
        eventoNome: p.nome,
        horaPortoes: hora.format(new Date(p.abertura_portoes)),
        local: p.local_nome,
        endereco: p.endereco,
      }

      try {
        await enviarEmailLembrete({
          ...comum,
          para: p.comprador_email,
          temMeia: p.tem_meia,
          linkIngresso: linkDoIngresso(p.id, chaveLinkPedido(p.id)),
        })
        enviados++
      } catch (erro) {
        falhas++
        console.error('[lembretes] e-mail falhou', qual, p.id, erro)
        await sql`update pedidos set ${sql(coluna)} = null where id = ${p.id}`.catch(() => {})
        continue
      }

      // WhatsApp é extra: se falhar, o e-mail já saiu e não repetimos.
      if (zap && p.whatsapp_optin) {
        await enviarLembreteWhatsapp({ ...comum, telefone: p.comprador_telefone }).catch((erro) =>
          console.error('[lembretes] WhatsApp falhou', qual, p.id, erro)
        )
      }
    }
  }

  return { enviados, falhas }
}
