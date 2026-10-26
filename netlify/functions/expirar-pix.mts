import type { Config } from '@netlify/functions'

// ============================================================================
//  ROTINA AGENDADA — devolve ao estoque os PIX que ninguém pagou.
//
//  Roda a cada 10 minutos e chama a rota interna /api/cron/expirar. O PIX
//  vale 30 minutos e o pagamento já é confirmado pelo webhook e pela tela do
//  PIX; esta rotina só devolve ao estoque o que ninguém pagou, então 10
//  minutos bastam e gastam metade dos créditos da Netlify.
//
//  Sem isto, o evento "esgota" cheio de reserva fantasma: gente que gerou o
//  PIX, não pagou, e deixou o ingresso travado. Você perderia venda de
//  verdade por causa de compra que nunca existiu.
// ============================================================================

export default async function expirarPix() {
  // URL é preenchida pela própria Netlify em cada deploy.
  // NEXT_PUBLIC_SITE_URL com localhost (de um .env.local importado) faria a
  // rotina chamar a própria máquina e nunca expirar nada: usa a URL que a
  // Netlify preenche sozinha.
  const configurada = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const base = (/^https:\/\//.test(configurada) && !configurada.includes('localhost')
    ? configurada
    : process.env.URL ?? 'https://goldeneyeprods.com'
  ).replace(/\/+$/, '')
  const segredo = process.env.CRON_SECRET

  if (!base || !segredo) {
    console.error('[cron] falta NEXT_PUBLIC_SITE_URL ou CRON_SECRET')
    return new Response('configuracao ausente', { status: 500 })
  }

  try {
    const r = await fetch(`${base}/api/cron/expirar`, {
      headers: { Authorization: `Bearer ${segredo}` },
    })
    const corpo = await r.text()
    console.log('[cron] expirar:', r.status, corpo)
    return new Response(corpo, { status: r.status })
  } catch (erro) {
    console.error('[cron] falhou:', erro)
    return new Response('falha ao executar', { status: 500 })
  }
}

export const config: Config = {
  schedule: '*/10 * * * *',
}
