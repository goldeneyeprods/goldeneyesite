import { sql } from './db'
import { enviarLembreteWhatsapp, whatsappConfigurado } from './whatsapp'

// ============================================================================
//  LEMBRETES DO EVENTO NO WHATSAPP
//
//  Rodam junto com a rotina de 10 em 10 minutos. Cada pedido pago, que aceitou
//  WhatsApp, recebe no máximo dois: na véspera e no dia, a partir das 11h de
//  Brasília. O pedido é marcado ANTES do envio (fora de transação travada) e
//  desmarcado se falhar, para tentar de novo na próxima rodada.
// ============================================================================

const HORA_DO_ENVIO = 11

type Alvo = {
  id: string
  comprador_nome: string
  comprador_telefone: string
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
         and p.whatsapp_optin
         and p.whatsapp_enviado_em is not null
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
    returning p.id, p.comprador_nome, p.comprador_telefone,
              e.nome, e.local_nome, e.endereco, e.abertura_portoes
  `
}

export async function enviarLembretes(): Promise<{ enviados: number; falhas: number }> {
  if (!whatsappConfigurado()) return { enviados: 0, falhas: 0 }

  let enviados = 0
  let falhas = 0
  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

  for (const qual of ['vespera', 'dia'] as const) {
    const coluna = qual === 'vespera' ? 'lembrete_vespera_em' : 'lembrete_dia_em'
    for (const p of await reservar(qual)) {
      try {
        await enviarLembreteWhatsapp({
          telefone: p.comprador_telefone,
          nome: p.comprador_nome,
          quando: qual === 'vespera' ? 'Amanhã' : 'Hoje',
          eventoNome: p.nome,
          horaPortoes: hora.format(new Date(p.abertura_portoes)),
          local: p.local_nome,
          endereco: p.endereco,
        })
        enviados++
      } catch (erro) {
        falhas++
        console.error('[lembretes] falhou', qual, p.id, erro)
        await sql`update pedidos set ${sql(coluna)} = null where id = ${p.id}`.catch(() => {})
      }
    }
  }

  return { enviados, falhas }
}
