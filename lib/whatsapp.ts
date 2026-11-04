import { gerarQrPng } from './email'

// ============================================================================
//  WHATSAPP — Cloud API oficial da Meta
//
//  Mensagem que a empresa inicia só pode sair por modelo (template) aprovado
//  pela Meta. Usamos dois, ambos da categoria "Utilidade":
//    - ingresso_confirmado: imagem do QR no cabeçalho, um por ingresso;
//    - lembrete_evento:     véspera e dia do show, um por pedido.
//  O texto exato de cada modelo está no README.
//
//  Sem WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID, nada é enviado e nada
//  quebra: o e-mail continua sendo o canal garantido do ingresso.
// ============================================================================

const VERSAO_API = 'v23.0'

function credenciais() {
  const token = process.env.WHATSAPP_TOKEN
  const numeroId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !numeroId) return null
  return { token, numeroId }
}

export function whatsappConfigurado(): boolean {
  return credenciais() !== null
}

/** Telefone guardado no pedido (DDD + número) → formato internacional. */
export function telefoneInternacional(telefone: string): string | null {
  const d = telefone.replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) return `55${d}`
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return null
}

async function chamar(caminho: string, init: RequestInit): Promise<any> {
  const c = credenciais()!
  const r = await fetch(`https://graph.facebook.com/${VERSAO_API}/${c.numeroId}/${caminho}`, {
    ...init,
    headers: { Authorization: `Bearer ${c.token}`, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(10_000),
  })
  const corpo = await r.json().catch(() => ({}))
  if (!r.ok) {
    const msg = corpo?.error?.message ?? `HTTP ${r.status}`
    throw new Error(`[whatsapp] ${caminho}: ${msg}`)
  }
  return corpo
}

/**
 * Sobe o PNG do QR para a Meta e devolve o id da mídia. Assim o QR nunca
 * precisa ficar numa URL pública: o token do ingresso só vai para a Meta e
 * para o celular do comprador.
 */
async function subirQr(token: string): Promise<string> {
  const png = await gerarQrPng(token)
  const form = new FormData()
  form.append('messaging_product', 'whatsapp')
  form.append('type', 'image/png')
  form.append('file', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'ingresso.png')
  const r = await chamar('media', { method: 'POST', body: form })
  return String(r.id)
}

async function enviarModelo(para: string, nome: string, componentes: unknown[]) {
  await chamar('messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: para,
      type: 'template',
      template: { name: nome, language: { code: 'pt_BR' }, components: componentes },
    }),
  })
}

const texto = (t: string) => ({ type: 'text', text: t })

/** Um ingresso = uma mensagem com o QR, para a pessoa achar fácil na portaria. */
export async function enviarIngressoWhatsapp(dados: {
  telefone: string
  nome: string
  eventoNome: string
  /** "20/11" */
  data: string
  /** "19:00" */
  hora: string
  ingressos: { tokenQr: string; descricao: string }[]
}): Promise<void> {
  const para = telefoneInternacional(dados.telefone)
  if (!para) throw new Error(`[whatsapp] telefone inválido: ${dados.telefone}`)
  const modelo = process.env.WHATSAPP_MODELO_INGRESSO ?? 'ingresso_confirmado'
  const primeiroNome = dados.nome.trim().split(/\s+/)[0]

  for (const ing of dados.ingressos) {
    const midiaId = await subirQr(ing.tokenQr)
    await enviarModelo(para, modelo, [
      { type: 'header', parameters: [{ type: 'image', image: { id: midiaId } }] },
      {
        type: 'body',
        parameters: [
          texto(primeiroNome),
          texto(dados.eventoNome),
          texto(dados.data),
          texto(dados.hora),
          texto(ing.descricao),
        ],
      },
    ])
  }
}

/** Véspera ("Amanhã") ou dia do show ("Hoje"). */
export async function enviarLembreteWhatsapp(dados: {
  telefone: string
  nome: string
  quando: 'Amanhã' | 'Hoje'
  eventoNome: string
  horaPortoes: string
  local: string
  endereco: string
}): Promise<void> {
  const para = telefoneInternacional(dados.telefone)
  if (!para) throw new Error(`[whatsapp] telefone inválido: ${dados.telefone}`)
  const modelo = process.env.WHATSAPP_MODELO_LEMBRETE ?? 'lembrete_evento'

  await enviarModelo(para, modelo, [
    {
      type: 'body',
      parameters: [
        texto(dados.nome.trim().split(/\s+/)[0]),
        texto(dados.quando),
        texto(dados.eventoNome),
        texto(dados.horaPortoes),
        texto(dados.local),
        texto(dados.endereco),
      ],
    },
  ])
}
