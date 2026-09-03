import { Resend } from 'resend'
import QRCode from 'qrcode'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { produtora } from '@/config/site'
import { formatarBRL } from './validacao'

// ============================================================================
//  E-MAIL TRANSACIONAL (Resend) + geração do QR e do PDF do ingresso
// ============================================================================

function resend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada')
  return new Resend(key)
}

const REMETENTE = () =>
  process.env.EMAIL_REMETENTE ?? `Golden Eye Prods. <onboarding@resend.dev>`

export interface IngressoParaEmail {
  id: string
  tipo: 'inteira' | 'meia'
  titularNome: string
  tokenQr: string
}

/** PNG do QR Code em base64, para embutir no e-mail e no PDF. */
export async function gerarQrPng(token: string): Promise<Buffer> {
  return QRCode.toBuffer(token, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 600,
    color: { dark: '#0B0710', light: '#FFFFFF' },
  })
}

// ----------------------------------------------------------------------------
//  PDF do ingresso — um ingresso por página
// ----------------------------------------------------------------------------
export async function gerarPdfIngressos(
  ingressos: IngressoParaEmail[],
  evento: { nome: string; local: string; endereco: string; data: string }
): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  const fonte = await pdf.embedFont(StandardFonts.Helvetica)
  const fonteBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const ouro = rgb(0.83, 0.65, 0.29)
  const noite = rgb(0.04, 0.03, 0.06)
  const claro = rgb(0.92, 0.9, 0.95)

  for (const ing of ingressos) {
    const pagina = pdf.addPage([595, 420]) // meia A4 paisagem
    const { width, height } = pagina.getSize()

    pagina.drawRectangle({ x: 0, y: 0, width, height, color: noite })
    pagina.drawRectangle({
      x: 16, y: 16, width: width - 32, height: height - 32,
      borderColor: ouro, borderWidth: 1.5,
    })

    pagina.drawText('GOLDEN EYE PRODS.', {
      x: 40, y: height - 62, size: 11, font: fonteBold, color: ouro,
    })

    pagina.drawText(evento.nome, {
      x: 40, y: height - 106, size: 26, font: fonteBold, color: claro,
    })

    const linhas = [
      ['DATA', evento.data],
      ['LOCAL', `${evento.local} — ${evento.endereco}`],
      ['TITULAR', ing.titularNome],
      ['TIPO', ing.tipo === 'meia' ? 'MEIA-ENTRADA' : 'INTEIRA'],
    ]
    let y = height - 152
    for (const [rotulo, valor] of linhas) {
      pagina.drawText(rotulo, { x: 40, y, size: 8, font: fonteBold, color: ouro })
      pagina.drawText(valor.slice(0, 58), {
        x: 40, y: y - 15, size: 12, font: fonte, color: claro,
      })
      y -= 42
    }

    if (ing.tipo === 'meia') {
      pagina.drawText('Comprovante de meia-entrada obrigatorio na portaria.', {
        x: 40, y: 46, size: 8, font: fonte, color: rgb(0.95, 0.8, 0.3),
      })
    }
    pagina.drawText(`Ingresso ${ing.id.slice(0, 8).toUpperCase()}`, {
      x: 40, y: 32, size: 7, font: fonte, color: rgb(0.5, 0.45, 0.55),
    })

    // QR à direita, sobre fundo branco para o leitor pegar rápido no escuro
    const qrPng = await gerarQrPng(ing.tokenQr)
    const qrImg = await pdf.embedPng(qrPng)
    const lado = 200
    pagina.drawRectangle({
      x: width - lado - 52, y: (height - lado) / 2 - 10,
      width: lado + 20, height: lado + 20, color: rgb(1, 1, 1),
    })
    pagina.drawImage(qrImg, {
      x: width - lado - 42, y: (height - lado) / 2,
      width: lado, height: lado,
    })
  }

  return Buffer.from(await pdf.save())
}

// ----------------------------------------------------------------------------
//  Template do e-mail de confirmação
// ----------------------------------------------------------------------------
function htmlConfirmacao(dados: {
  nome: string
  eventoNome: string
  dataFormatada: string
  local: string
  endereco: string
  ingressos: IngressoParaEmail[]
  valorTotal: number
  linkMeusIngressos: string
}): string {
  const temMeia = dados.ingressos.some((i) => i.tipo === 'meia')

  const itens = dados.ingressos
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #2a1f38;color:#e8e3f0;font-size:14px">
          ${i.titularNome}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #2a1f38;color:#d4a64a;font-size:12px;text-align:right;letter-spacing:.08em">
          ${i.tipo === 'meia' ? 'MEIA-ENTRADA' : 'INTEIRA'}
        </td>
      </tr>`
    )
    .join('')

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:#0b0710;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0710;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#120c1c;border:1px solid #2a1f38;border-radius:16px;overflow:hidden">

        <tr><td style="padding:32px 32px 8px;text-align:center">
          <div style="color:#d4a64a;font-size:12px;letter-spacing:.28em;font-weight:700">GOLDEN EYE PRODS.</div>
        </td></tr>

        <tr><td style="padding:16px 32px 0;text-align:center">
          <div style="color:#6ee7b7;font-size:13px;letter-spacing:.06em">✓ PAGAMENTO CONFIRMADO</div>
          <h1 style="margin:12px 0 4px;color:#f4f1f8;font-size:28px;line-height:1.2">${dados.eventoNome}</h1>
          <div style="color:#a99bbd;font-size:14px">${dados.dataFormatada}</div>
        </td></tr>

        <tr><td style="padding:24px 32px 0">
          <p style="color:#cdc4dc;font-size:15px;line-height:1.6;margin:0 0 20px">
            Fala, ${dados.nome.split(' ')[0]}! Seu lugar está garantido.
            O ingresso vai em anexo neste e-mail, em PDF, com o QR Code que a
            equipe vai ler na portaria. Não precisa imprimir — a tela do celular
            resolve.
          </p>

          <div style="background:#0b0710;border:1px solid #2a1f38;border-radius:12px;padding:18px 20px;margin-bottom:20px">
            <div style="color:#d4a64a;font-size:10px;letter-spacing:.16em;margin-bottom:10px">SEUS INGRESSOS</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itens}</table>
            <div style="margin-top:14px;color:#a99bbd;font-size:13px">
              Total pago: <strong style="color:#f4f1f8">${formatarBRL(dados.valorTotal)}</strong>
            </div>
          </div>

          <div style="background:#0b0710;border:1px solid #2a1f38;border-radius:12px;padding:18px 20px;margin-bottom:20px">
            <div style="color:#d4a64a;font-size:10px;letter-spacing:.16em;margin-bottom:8px">ONDE</div>
            <div style="color:#f4f1f8;font-size:15px;font-weight:600">${dados.local}</div>
            <div style="color:#a99bbd;font-size:13px;margin-top:4px">${dados.endereco}</div>
          </div>

          ${
            temMeia
              ? `<div style="background:#2a1f0a;border:1px solid #6b5312;border-radius:12px;padding:16px 18px;margin-bottom:20px">
                   <div style="color:#f4c542;font-size:13px;line-height:1.5">
                     <strong>Atenção — meia-entrada.</strong> Leve o comprovante
                     (carteirinha de estudante, documento de idade, laudo ou CadÚnico).
                     Sem comprovação, a diferença para a inteira será cobrada na portaria.
                   </div>
                 </div>`
              : ''
          }

          <div style="text-align:center;margin:28px 0 8px">
            <a href="${dados.linkMeusIngressos}"
               style="display:inline-block;background:#d4a64a;color:#0b0710;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;font-size:14px">
              Ver meus ingressos
            </a>
          </div>
        </td></tr>

        <tr><td style="padding:24px 32px 32px;border-top:1px solid #2a1f38;margin-top:16px">
          <p style="color:#7e7290;font-size:11px;line-height:1.6;margin:16px 0 0">
            <strong style="color:#a99bbd">Cancelamento e reembolso.</strong>
            Nos termos do Artigo 49 do Código de Defesa do Consumidor, você pode
            cancelar e receber 100% de volta em até 7 dias corridos a contar deste
            pagamento, desde que solicite com no mínimo 48 horas de antecedência da
            abertura dos portões. É só entrar em "Ver meus ingressos".
          </p>
          <p style="color:#5c5270;font-size:11px;margin:16px 0 0">
            ${produtora.razaoSocial} — CNPJ ${produtora.cnpj}<br>
            Dúvidas: ${produtora.email}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}

// ----------------------------------------------------------------------------
export async function enviarEmailConfirmacao(dados: {
  para: string
  nome: string
  eventoNome: string
  dataFormatada: string
  local: string
  endereco: string
  ingressos: IngressoParaEmail[]
  valorTotal: number
  linkMeusIngressos: string
}): Promise<void> {
  const pdf = await gerarPdfIngressos(dados.ingressos, {
    nome: dados.eventoNome,
    local: dados.local,
    endereco: dados.endereco,
    data: dados.dataFormatada,
  })

  await resend().emails.send({
    from: REMETENTE(),
    to: dados.para,
    subject: `🎟 Seu ingresso — ${dados.eventoNome}`,
    html: htmlConfirmacao(dados),
    attachments: [
      {
        filename: `ingressos-${dados.eventoNome.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        content: pdf.toString('base64'),
      },
    ],
  })
}

export async function enviarMagicLink(para: string, link: string): Promise<void> {
  await resend().emails.send({
    from: REMETENTE(),
    to: para,
    subject: 'Acesso aos seus ingressos — Golden Eye Prods.',
    html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#0b0710;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;padding:40px 16px">
      <table role="presentation" align="center" width="100%" style="max-width:460px;background:#120c1c;border:1px solid #2a1f38;border-radius:16px">
        <tr><td style="padding:32px;text-align:center">
          <div style="color:#d4a64a;font-size:11px;letter-spacing:.28em;font-weight:700;margin-bottom:20px">GOLDEN EYE PRODS.</div>
          <h1 style="color:#f4f1f8;font-size:20px;margin:0 0 12px">Seus ingressos</h1>
          <p style="color:#a99bbd;font-size:14px;line-height:1.6;margin:0 0 24px">
            Clique no botão para ver, baixar, transferir ou cancelar seus ingressos.
            O link vale por 15 minutos e só funciona uma vez.
          </p>
          <a href="${link}" style="display:inline-block;background:#d4a64a;color:#0b0710;text-decoration:none;padding:14px 30px;border-radius:999px;font-weight:700;font-size:14px">Abrir meus ingressos</a>
          <p style="color:#5c5270;font-size:11px;margin:24px 0 0">
            Se você não pediu este acesso, pode ignorar este e-mail.
          </p>
        </td></tr>
      </table>
    </body></html>`,
  })
}

export async function enviarEmailReembolso(dados: {
  para: string
  nome: string
  eventoNome: string
  valor: number
}): Promise<void> {
  await resend().emails.send({
    from: REMETENTE(),
    to: dados.para,
    subject: `Reembolso confirmado — ${dados.eventoNome}`,
    html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#0b0710;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;padding:40px 16px">
      <table role="presentation" align="center" width="100%" style="max-width:460px;background:#120c1c;border:1px solid #2a1f38;border-radius:16px">
        <tr><td style="padding:32px">
          <div style="color:#d4a64a;font-size:11px;letter-spacing:.28em;font-weight:700;margin-bottom:20px">GOLDEN EYE PRODS.</div>
          <h1 style="color:#f4f1f8;font-size:20px;margin:0 0 12px">Reembolso processado</h1>
          <p style="color:#cdc4dc;font-size:14px;line-height:1.6">
            ${dados.nome.split(' ')[0]}, seu pedido de cancelamento do evento
            <strong style="color:#f4f1f8">${dados.eventoNome}</strong> foi aceito e o
            estorno de <strong style="color:#f4f1f8">${formatarBRL(dados.valor)}</strong>
            já foi solicitado ao Mercado Pago.
          </p>
          <p style="color:#a99bbd;font-size:13px;line-height:1.6">
            No PIX o valor costuma voltar para a mesma chave em minutos. Seus
            ingressos foram invalidados e não servem mais para entrar no evento.
          </p>
          <p style="color:#7e7290;font-size:12px;margin-top:24px">
            Esperamos ver você na próxima. Dúvidas: ${produtora.email}
          </p>
        </td></tr>
      </table>
    </body></html>`,
  })
}
