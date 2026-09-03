import QRCode from 'qrcode'
import { verificarTokenIngresso } from '@/lib/ticket'

export const runtime = 'nodejs'

// ============================================================================
//  GET /api/qr?t=<token>
//  Renderiza o QR Code do ingresso como PNG.
//  Só gera para tokens com assinatura válida — assim a rota não vira um
//  gerador público de QR para qualquer conteúdo.
// ============================================================================

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('t')

  if (!token || !verificarTokenIngresso(token)) {
    return new Response('Token inválido', { status: 400 })
  }

  const png = await QRCode.toBuffer(token, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 560,
    color: { dark: '#0a0610', light: '#ffffff' },
  })

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // privado: é o ingresso de uma pessoa, não pode ficar em cache de CDN
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
