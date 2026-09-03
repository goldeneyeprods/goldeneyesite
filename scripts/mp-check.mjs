// ============================================================================
//  npm run mp:check
//
//  Diagnóstico da integração com o Mercado Pago. Roda contra a API DE VERDADE
//  e diz exatamente o que está faltando — em vez de você descobrir no dia da
//  venda que a chave PIX não estava cadastrada.
//
//  O que ele testa:
//    1. Se o Access Token existe e é válido
//    2. Se é token de TESTE ou de PRODUÇÃO (e avisa)
//    3. Se a conta tem chave PIX cadastrada
//    4. Se consegue criar uma cobrança PIX de R$ 0,01 de verdade
//    5. Se o QR Code volta legível
//    6. Se o webhook está configurado e o segredo bate
//    7. Cancela a cobrança de teste no fim
// ============================================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createHmac } from 'node:crypto'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

try {
  const env = readFileSync(join(raiz, '.env.local'), 'utf8')
  for (const linha of env.split('\n')) {
    const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  console.error('⚠  .env.local não encontrado. Copie o .env.example primeiro.\n')
  process.exit(1)
}

const V = '\x1b[32m✓\x1b[0m'
const X = '\x1b[31m✗\x1b[0m'
const A = '\x1b[33m!\x1b[0m'
const dim = (t) => `\x1b[2m${t}\x1b[0m`

let problemas = 0
const falha = (msg, comoResolver) => {
  problemas++
  console.log(`${X} ${msg}`)
  if (comoResolver) console.log(dim(`    → ${comoResolver}`))
}
const ok = (msg, extra) => {
  console.log(`${V} ${msg}`)
  if (extra) console.log(dim(`    ${extra}`))
}
const aviso = (msg, extra) => {
  console.log(`${A} ${msg}`)
  if (extra) console.log(dim(`    ${extra}`))
}

console.log('\n═══ DIAGNÓSTICO DO MERCADO PAGO ═══\n')

// ---------------------------------------------------------------------------
// 1. Access Token
// ---------------------------------------------------------------------------
const token = process.env.MP_ACCESS_TOKEN

if (!token || token.includes('troque') || token.length < 20) {
  falha(
    'MP_ACCESS_TOKEN não configurado',
    'Painel do MP > Suas integrações > sua app > Credenciais > copie o Access Token'
  )
  console.log('\nSem o token não dá para testar mais nada. Configure e rode de novo.\n')
  process.exit(1)
}

const ehTeste = token.startsWith('TEST-')
const ehProducao = token.startsWith('APP_USR-')

if (ehTeste) {
  ok('Access Token de TESTE detectado', 'Nenhum dinheiro real será movimentado.')
} else if (ehProducao) {
  aviso(
    'Access Token de PRODUÇÃO detectado',
    'Este teste vai criar uma cobrança REAL de R$ 0,01 e cancelá-la em seguida.'
  )
} else {
  aviso('Formato de token não reconhecido', 'Esperado começar com TEST- ou APP_USR-')
}

const api = async (caminho, opcoes = {}) => {
  const r = await fetch(`https://api.mercadopago.com${caminho}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...opcoes.headers,
    },
  })
  const texto = await r.text()
  let corpo
  try {
    corpo = JSON.parse(texto)
  } catch {
    corpo = texto
  }
  return { status: r.status, corpo }
}

// ---------------------------------------------------------------------------
// 2. O token é válido? Quem é a conta?
// ---------------------------------------------------------------------------
const usuario = await api('/users/me')

if (usuario.status === 401 || usuario.status === 403) {
  falha(
    'O Mercado Pago recusou este token',
    'Ou ele está errado/expirado, ou foi copiado da app errada. ' +
      'Pegue de novo em: Suas integrações > sua app > Credenciais. ' +
      'Cuidado para não copiar a Public Key no lugar do Access Token.'
  )
  console.log('\nInterrompendo — o resto dos testes depende de um token válido.\n')
  process.exit(1)
}
if (usuario.status !== 200) {
  falha(`A API respondeu ${usuario.status}`, JSON.stringify(usuario.corpo).slice(0, 200))
  process.exit(1)
}

ok(
  `Conta autenticada: ${usuario.corpo.nickname ?? usuario.corpo.id}`,
  `${usuario.corpo.email ?? ''} · país ${usuario.corpo.site_id ?? '?'}`
)

if (usuario.corpo.site_id && usuario.corpo.site_id !== 'MLB') {
  falha(
    `A conta é do país "${usuario.corpo.site_id}", não do Brasil (MLB)`,
    'PIX só existe em contas brasileiras.'
  )
}

// ---------------------------------------------------------------------------
// 3. PIX está habilitado na conta?
// ---------------------------------------------------------------------------
const metodos = await api('/v1/payment_methods')

if (metodos.status === 200 && Array.isArray(metodos.corpo)) {
  const pix = metodos.corpo.find((m) => m.id === 'pix')
  if (pix) {
    ok('Método PIX disponível na conta')
  } else {
    falha(
      'PIX NÃO aparece entre os métodos desta conta',
      'Cadastre uma chave PIX na sua conta Mercado Pago (app > Seu negócio > PIX)'
    )
  }
} else {
  aviso('Não foi possível listar os métodos de pagamento')
}

// ---------------------------------------------------------------------------
// 4. Criar uma cobrança PIX de verdade
// ---------------------------------------------------------------------------
console.log('\n--- Teste real de cobrança PIX (R$ 0,01) ---\n')

const idempotencia = `diagnostico-${Date.now()}`
const expiraEm = new Date(Date.now() + 10 * 60_000).toISOString()

const cobranca = await api('/v1/payments', {
  method: 'POST',
  headers: { 'X-Idempotency-Key': idempotencia },
  body: JSON.stringify({
    transaction_amount: 0.01,
    description: 'Teste de integracao - Golden Eye Prods',
    payment_method_id: 'pix',
    date_of_expiration: expiraEm,
    external_reference: idempotencia,
    payer: {
      email: 'teste@exemplo.com',
      first_name: 'Teste',
      last_name: 'Diagnostico',
      identification: { type: 'CPF', number: '19119119100' },
    },
  }),
})

if (cobranca.status !== 201 && cobranca.status !== 200) {
  const erro = cobranca.corpo
  falha(`Não foi possível criar a cobrança PIX (HTTP ${cobranca.status})`)
  console.log(dim(`    ${erro?.message ?? JSON.stringify(erro).slice(0, 300)}`))

  const causa = JSON.stringify(erro).toLowerCase()
  if (causa.includes('collector') || causa.includes('pix')) {
    console.log(
      dim(
        '    → Causa mais comum: falta cadastrar uma CHAVE PIX na conta.\n' +
          '      Abra o app do Mercado Pago > Seu negócio > PIX > cadastrar chave.'
      )
    )
  }
} else {
  const p = cobranca.corpo
  const dados = p.point_of_interaction?.transaction_data

  ok(`Cobrança criada — id ${p.id}, status "${p.status}"`)

  if (dados?.qr_code && dados?.qr_code_base64) {
    ok(
      'QR Code PIX gerado com sucesso',
      `copia-e-cola com ${dados.qr_code.length} caracteres`
    )
  } else {
    falha(
      'A cobrança foi criada mas SEM QR Code',
      'Confirme que existe uma chave PIX cadastrada na conta.'
    )
  }

  // ---- 5. Cancela a cobrança de teste -----------------------------------
  const cancelamento = await api(`/v1/payments/${p.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'cancelled' }),
  })
  if (cancelamento.status === 200) {
    ok('Cobrança de teste cancelada', 'Nada ficou pendente na sua conta.')
  } else {
    aviso(
      `Não consegui cancelar a cobrança de teste (id ${p.id})`,
      'Ela expira sozinha em 10 minutos. Nenhum valor é cobrado se ninguém pagar.'
    )
  }
}

// ---------------------------------------------------------------------------
// 6. Webhook
// ---------------------------------------------------------------------------
console.log('\n--- Webhook ---\n')

const segredo = process.env.MP_WEBHOOK_SECRET
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

if (!segredo || segredo.includes('troque') || segredo.length < 10) {
  falha(
    'MP_WEBHOOK_SECRET não configurado',
    'Painel do MP > sua app > Webhooks > "Assinatura secreta". ' +
      'Sem isso o site REJEITA todos os avisos de pagamento — e nenhum ingresso é emitido.'
  )
} else {
  // Reproduz o cálculo que o servidor faz para conferir a assinatura.
  const ts = Date.now().toString()
  const manifesto = `id:123456;request-id:abc;ts:${ts};`
  const hash = createHmac('sha256', segredo).update(manifesto).digest('hex')
  ok(
    'MP_WEBHOOK_SECRET configurado',
    `assinatura de exemplo calculada: ${hash.slice(0, 16)}…`
  )
}

if (!siteUrl || siteUrl.includes('localhost')) {
  aviso(
    'NEXT_PUBLIC_SITE_URL aponta para localhost',
    'O Mercado Pago não consegue chamar localhost. Isto só funciona depois do deploy.'
  )
} else {
  ok(`URL do webhook: ${siteUrl}/api/webhook/mercadopago`)

  // O webhook deve responder 401 a uma chamada sem assinatura — isso prova
  // que a validação está ligada e que a rota está no ar.
  try {
    const r = await fetch(`${siteUrl}/api/webhook/mercadopago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'payment', data: { id: '1' } }),
    })
    if (r.status === 401) {
      ok('O webhook está no ar e recusa chamadas sem assinatura', 'É o comportamento correto.')
    } else if (r.status === 404) {
      falha('O webhook respondeu 404', 'A rota não subiu no deploy.')
    } else {
      aviso(`O webhook respondeu ${r.status} a uma chamada sem assinatura`, 'Esperado 401.')
    }
  } catch {
    aviso('Não consegui alcançar a URL do webhook', 'O site já está publicado?')
  }
}

// ---------------------------------------------------------------------------
// 7. Outros segredos que o fluxo de venda precisa
// ---------------------------------------------------------------------------
console.log('\n--- Outros segredos ---\n')

const conferir = [
  ['TICKET_HMAC_SECRET', 64, 'assina os QR Codes dos ingressos'],
  ['PORTARIA_JWT_SECRET', 32, 'sessões do app de portaria'],
  ['DATABASE_URL', 20, 'banco de dados'],
  ['RESEND_API_KEY', 10, 'envio do ingresso por e-mail'],
  ['CRON_SECRET', 8, 'protege a rotina que expira PIX não pago'],
]

for (const [nome, minimo, paraQue] of conferir) {
  const v = process.env[nome]
  if (!v || v.includes('troque') || v.includes('xxxx') || v.length < minimo) {
    falha(`${nome} ausente ou fraco`, paraQue)
  } else if (v.startsWith('dev')) {
    aviso(`${nome} ainda é o valor de desenvolvimento`, `Gere um definitivo antes de vender. (${paraQue})`)
  } else {
    ok(`${nome} configurado`, paraQue)
  }
}

if (process.env.DATABASE_URL?.includes(':5432')) {
  aviso(
    'DATABASE_URL usa a porta 5432',
    'Em serverless use a 6543 (transaction pooler), senão o banco esgota conexões no pico de vendas.'
  )
}

// ---------------------------------------------------------------------------
console.log('\n═══════════════════════════════════\n')
if (problemas === 0) {
  console.log('✓ Nenhum problema encontrado.\n')
  if (ehTeste) {
    console.log(
      dim(
        '  Você está em modo TESTE. Quando terminar o checklist do README,\n' +
          '  troque para as credenciais de produção e rode este comando de novo.\n'
      )
    )
  }
} else {
  console.log(`${problemas} problema(s) para resolver antes de vender.\n`)
  process.exit(1)
}
