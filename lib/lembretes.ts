import { sql } from './db'
import { enviarEmailLembrete } from './email'
import { chaveLinkPedido } from './ticket'
import { linkDoIngresso } from './url'
import { enviarLembreteWhatsapp, telefoneInternacional, whatsappConfigurado } from './whatsapp'

// ============================================================================
//  LEMBRETES DO EVENTO — véspera e dia
//
//  Rodam junto com a rotina de 10 em 10 minutos. Cada pedido pago recebe no
//  máximo dois, a partir das 11h de Brasília: por e-mail sempre e, se a API do
//  WhatsApp estiver ligada e a pessoa aceitou, também por lá. Sem a API, o
//  lembrete do WhatsApp é mandado à mão pelo painel da portaria.
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
        const colunaZap = qual === 'vespera' ? 'whatsapp_vespera_em' : 'whatsapp_dia_em'
        await enviarLembreteWhatsapp({ ...comum, telefone: p.comprador_telefone })
          // marcado, o lembrete some da lista de envio manual do painel
          .then(() => sql`update pedidos set ${sql(colunaZap)} = now() where id = ${p.id}`)
          .catch((erro) => console.error('[lembretes] WhatsApp falhou', qual, p.id, erro))
      }
    }
  }

  return { enviados, falhas }
}

// ----------------------------------------------------------------------------
//  Lembretes do WhatsApp mandados à mão pelo painel. Só aparecem na véspera
//  (o dia todo) e no dia (até abrir os portões). Quem pagou há menos de
//  3 horas acabou de receber o ingresso e fica de fora.
// ----------------------------------------------------------------------------
export async function lembretesWhatsappDoDia(eventoId: number) {
  const [evento] = await sql<
    {
      nome: string
      local_nome: string
      endereco: string
      abertura_portoes: Date
      meia_solidaria: boolean
      qual: 'vespera' | 'dia' | null
    }[]
  >`
    select nome, local_nome, endereco, abertura_portoes, meia_solidaria,
           case
             when now() >= abertura_portoes then null
             when (data_inicio at time zone 'America/Sao_Paulo')::date
                  = (now() at time zone 'America/Sao_Paulo')::date then 'dia'
             when (data_inicio at time zone 'America/Sao_Paulo')::date - 1
                  = (now() at time zone 'America/Sao_Paulo')::date then 'vespera'
           end as qual
      from eventos
     where id = ${eventoId}
  `
  if (!evento?.qual) return null
  const qual = evento.qual
  const coluna = qual === 'vespera' ? 'whatsapp_vespera_em' : 'whatsapp_dia_em'

  const pedidos = await sql<
    { id: string; comprador_nome: string; comprador_telefone: string; enviado_em: Date | null; tem_meia: boolean }[]
  >`
    select p.id, p.comprador_nome, p.comprador_telefone, p.${sql(coluna)} as enviado_em,
           exists (select 1 from ingressos i
                    where i.pedido_id = p.id and i.tipo = 'meia' and i.status = 'valido') as tem_meia
      from pedidos p
     where p.evento_id = ${eventoId}
       and p.status = 'pago'
       and p.whatsapp_optin
       and p.pago_em < now() - interval '3 hours'
     order by (p.${sql(coluna)} is not null), p.pago_em
  `

  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
  const portoes = hora.format(new Date(evento.abertura_portoes))
  const itens = pedidos.map((p) => {
    const meia = p.tem_meia && !evento.meia_solidaria ? ' e o comprovante da meia-entrada' : ''
    const texto =
      `Olá ${p.comprador_nome.trim().split(/\s+/)[0]}!\n\n` +
      `${qual === 'vespera' ? 'Amanhã' : 'Hoje'} tem "${evento.nome}"! ` +
      `Os portões abrem às ${portoes} no ${evento.local_nome}, ${evento.endereco}.\n\n` +
      `Seu ingresso está aqui:\n${linkDoIngresso(p.id, chaveLinkPedido(p.id))}\n\n` +
      `Leve um documento com foto${meia}.\n\n` +
      `Qualquer dúvida conte com nossa equipe por este número de WhatsApp.\n` +
      (qual === 'vespera' ? 'Até amanhã!' : 'Te esperamos!')

    const numero = telefoneInternacional(p.comprador_telefone)
    return {
      id: p.id,
      nome: p.comprador_nome,
      telefone: p.comprador_telefone,
      enviadoEm: p.enviado_em,
      link: numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : null,
    }
  })

  return { qual, itens }
}
