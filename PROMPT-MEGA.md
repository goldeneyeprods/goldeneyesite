# MEGA PROMPT — Site + Backend + App de Portaria (Produtora de Eventos)

> Cole o bloco abaixo inteiro em uma IA de código (Claude Opus 5 / Sonnet 5, ou Claude Code).
> Se a resposta for cortada, digite: **"Continue exatamente de onde parou, sem repetir código já escrito."**

---

Atue como **Engenheiro de Software Full-Stack Sênior** especializado em pagamentos, segurança e UI/UX.
Construa o ecossistema completo de venda e validação de ingressos da minha produtora de eventos.
Escreva **código pronto para produção**, comentado em português, sem pseudocódigo e sem "TODO" vago.

## 0. REGRAS DE OURO (não viole)

1. **Nenhuma chave secreta no front-end.** `MP_ACCESS_TOKEN`, segredo de webhook, chave de e-mail e `TICKET_HMAC_SECRET` só existem no servidor, via variáveis de ambiente.
2. **A venda só é confirmada pelo webhook do Mercado Pago**, nunca pela resposta do navegador. O navegador pode mentir; o webhook não.
3. **O ingresso é um token assinado (HMAC-SHA256)**, não um número sequencial. Impossível de forjar sem o segredo.
4. **Check-in é atômico e idempotente**: `UPDATE ... WHERE status='valido'` conferindo a linha afetada. Dois seguranças escaneando o mesmo QR ao mesmo tempo — só um passa.
5. **Idempotência de pagamento**: use `X-Idempotency-Key` no Mercado Pago e trate webhook duplicado (o MP reenvia várias vezes).
6. **Estoque nunca pode vender a mais**: reserva com expiração, liberada se o PIX não for pago.

## 1. ARQUITETURA

- **Opção A (RECOMENDADA — use esta por padrão):** projeto único **Next.js 15 (App Router) na Vercel**, plano gratuito. Front e API no mesmo deploy, mesmo domínio, sem dor de cabeça com CORS.
- **Opção B (alternativa, gere também as instruções):** front-end estático puro no **GitHub Pages** + back-end **Node/Express na Vercel ou Render**, com CORS restrito à origem do GitHub Pages.

Banco de dados: **Postgres gratuito (Supabase ou Neon)**. Entregue o `schema.sql` completo.
Estilo: **Tailwind CSS**. E-mail transacional: **Resend**. Sem dependências pagas.

## 2. BANCO DE DADOS (`schema.sql`)

Crie as tabelas com índices e constraints:

- `eventos` — id, slug, nome, descricao, data_inicio, abertura_portoes, local, endereco, mapa_url, classificacao_etaria, capacidade, ativo, imagem_hero.
- `lotes` — id, evento_id, nome ("1º Lote"), tipo (`inteira` | `meia`), preco_centavos (**sempre inteiro em centavos, nunca float**), quantidade_total, quantidade_vendida, quantidade_reservada, ativo, valido_ate.
- `pedidos` — id (uuid), evento_id, comprador_nome, comprador_email, comprador_cpf (só dígitos), comprador_telefone, valor_total_centavos, status (`pendente` | `pago` | `expirado` | `cancelado` | `reembolsado`), mp_payment_id, pix_qr_code, pix_expira_em, criado_em, pago_em, ip_origem, aceite_termos_em.
- `ingressos` — id (uuid), pedido_id, lote_id, tipo, titular_nome, titular_cpf, token_qr (único), status (`valido` | `usado` | `cancelado`), usado_em, usado_por (id do operador), gate.
- `operadores` — id, nome, pin_hash (bcrypt/argon2), evento_id, ativo. Para o app de portaria.
- `webhook_log` — id, mp_topic, mp_id, payload jsonb, recebido_em. Auditoria e trava anti-duplicidade.
- `checkin_log` — id, ingresso_id, operador_id, resultado (`ok` | `ja_usado` | `invalido` | `cancelado`), criado_em.

## 3. SITE PÚBLICO (front-end)

Visual: **dark mode**, tipografia forte, acento neon (defina como CSS variable para eu trocar), estética de festa/cultura noturna, **100% responsivo e mobile-first** (quase todo mundo compra pelo celular). Acessível: contraste AA, foco visível, `alt` em todas as imagens.

Seções:

1. **Header** — logo, navegação (Próximo Evento, Ingressos, Galeria, Sobre, FAQ, Contato), redes sociais, botão fixo "Ingressos".
2. **Hero** — imagem/vídeo do próximo evento em tela cheia, nome, data por extenso, local, **contador regressivo em JS** (com `Intl.DateTimeFormat`, fuso `America/Sao_Paulo`), CTA "Garantir Ingressos".
3. **Próximo Evento** — descrição, line-up com horários, endereço + mapa embed, classificação etária, o que é permitido/proibido levar.
4. **Compra de Ingressos**
   - Seletor de lote com **preço, quantidade restante e contagem regressiva do lote**.
   - **Meia-entrada (Lei 12.933/2013)**: mínimo **40% do total de ingressos** reservado. Ao escolher meia, exibir aviso de que a comprovação (carteirinha, documento, CadÚnico) será exigida na portaria sob pena de pagar a diferença.
   - Formulário: Nome completo, E-mail (confirmar e-mail), CPF **com validação real de dígitos verificadores**, Telefone com máscara, quantidade (máx. 6 por CPF).
   - Checkbox obrigatório de aceite dos Termos e da Política de Privacidade (LGPD), com timestamp salvo.
   - Máscaras e validação client-side **e** revalidação server-side (nunca confie no cliente).
5. **Galeria de Eventos Anteriores** — grid responsivo com `loading="lazy"`, lightbox em JS puro (sem biblioteca), navegação por teclado (setas, Esc), agrupado por edição. Placeholders claros: `imagens/eventos/2024-edicao-01/foto-01.jpg`.
6. **Sobre a Produtora** — história, proposta, números (público, edições).
7. **FAQ** — accordion: horários, meia-entrada, reembolso, transferência de ingresso, itens proibidos, acessibilidade.
8. **Footer** — CNPJ, razão social, e-mail de contato, WhatsApp, Termos de Compra, Política de Privacidade (LGPD), Política de Reembolso, copyright.

Página adicional: **`/meus-ingressos`** (autoatendimento) — ver item 6.

## 4. FLUXO DE PAGAMENTO PIX (Mercado Pago Checkout Transparente)

`POST /api/checkout`
1. Valida payload no servidor (use **Zod**): CPF válido, e-mail válido, quantidade, lote ativo.
2. **Rate limit por IP e por CPF** (ex.: 5 tentativas / 10 min).
3. Recalcula o preço **a partir do banco** — jamais aceita valor vindo do cliente.
4. Verifica estoque com `SELECT ... FOR UPDATE` dentro de transação; incrementa `quantidade_reservada`.
5. Cria pagamento PIX no MP com `date_of_expiration` de **30 minutos** e `X-Idempotency-Key`.
6. Grava `pedido` como `pendente` e retorna `{ pedido_id, qr_code, qr_code_base64, expira_em }`.

Front: exibe QR code, botão **"Copiar código PIX"** usando `navigator.clipboard.writeText()` (com fallback — `document.execCommand` está obsoleto), cronômetro de expiração e **polling em `GET /api/pedidos/:id/status` a cada 4s** (com backoff) até virar `pago` → tela de sucesso.

`POST /api/webhook/mercadopago`
1. **Valida a assinatura** do header `x-signature` / `x-request-id` conforme a documentação oficial do MP. Rejeita o que não bater.
2. Grava em `webhook_log`; se `mp_id` já processado, responde `200` e sai (idempotência).
3. Busca o pagamento na API do MP pelo id (**nunca confie no corpo do webhook**).
4. Se `approved`: transação → marca pedido `pago`, converte reserva em `quantidade_vendida`, **gera N ingressos** com `token_qr`, dispara e-mail.
5. Se `cancelled` / `expired`: libera a reserva.
6. Responde `200` sempre que processou (senão o MP reenvia infinitamente).

**Job de expiração** (`/api/cron/expirar`, Vercel Cron a cada 5 min): pedidos `pendente` com `pix_expira_em` vencido → `expirado`, devolve estoque.

## 5. INGRESSO E E-MAIL

- `token_qr` = `base64url(payload) + "." + HMAC_SHA256(payload, TICKET_HMAC_SECRET)`, onde payload = `{ ingresso_id, evento_id, tipo, v:1 }`. Curto o suficiente para caber num QR legível no escuro.
- Gere o PNG do QR no servidor (pacote `qrcode`) e anexe no e-mail.
- E-mail via **Resend**: HTML responsivo, dados do evento, nome do titular, tipo (inteira/meia), QR embutido, link para `/meus-ingressos`, aviso de meia-entrada e a política de reembolso. Anexe também um **PDF do ingresso** (use `pdf-lib`).
- **Retry**: se o envio falhar, marque para reenvio e disponibilize o ingresso mesmo assim em `/meus-ingressos`.

## 6. AUTOATENDIMENTO E REEMBOLSO (CDC Art. 49)

Página `/meus-ingressos`: acesso por **magic link** enviado ao e-mail do comprador (token de uso único, 15 min) — **sem senha e sem login só com CPF** (LGPD).

Regra de cancelamento implementada no servidor (`POST /api/pedidos/:id/cancelar`):

```
PODE CANCELAR SE:
  (agora - pedido.pago_em) <= 7 dias corridos
  E (evento.abertura_portoes - agora) >= 48 horas
  E nenhum ingresso do pedido está com status 'usado'
```

Ao aprovar: chama o **refund da API do Mercado Pago**, marca pedido `reembolsado`, ingressos `cancelado` (invalidando o QR na hora), devolve estoque, envia e-mail de confirmação do estorno. Registre tudo em log de auditoria.
Se estiver fora da regra, retorne mensagem clara explicando o motivo e o e-mail de contato — nunca um erro genérico.

Texto obrigatório no site (Termos + rodapé + e-mail de compra):

> **Política de Cancelamento e Reembolso** — Nos termos do Artigo 49 do Código de Defesa do Consumidor, o comprador pode solicitar o cancelamento e o reembolso integral em até **7 (sete) dias corridos contados da data da confirmação do pagamento**. Caso o evento ocorra dentro desse período, a solicitação deve ser feita com no mínimo **48 (quarenta e oito) horas de antecedência da abertura dos portões**. Após a realização do evento não há direito a reembolso, pois o serviço já foi prestado.

## 7. APP DE PORTARIA (PWA de check-in) — **prioridade alta**

Rota `/portaria`, instalável no celular (manifest + service worker), pensada para uso **na mão, no escuro, com uma mão só**.

- **Login por PIN** do operador (`POST /api/portaria/login` → JWT curto, 12h, com escopo do evento). Sem segredo em URL.
- **Scanner**: use a **`BarcodeDetector` nativa** quando disponível, com fallback para **`html5-qrcode`**. Câmera traseira, foco contínuo, lanterna se o dispositivo suportar.
- **Feedback imediato ocupando a tela inteira**:
  - ✅ **VERDE** + vibração curta + som — nome do titular e tipo do ingresso. Se for **MEIA**, banner amarelo: "EXIGIR COMPROVANTE DE MEIA-ENTRADA".
  - 🟠 **LARANJA** — "JÁ UTILIZADO às 23h14, portão A" (mostra quando e por quem).
  - ❌ **VERMELHO** — inválido / cancelado / reembolsado / de outro evento.
- **Validação server-side** em `POST /api/portaria/checkin`: confere HMAC, confere o evento, faz o `UPDATE ... WHERE status='valido'` atômico, grava `checkin_log`.
- **Modo offline**: no login, baixa a lista de hashes dos tokens válidos para **IndexedDB**; sem internet, valida localmente, marca como usado e **enfileira a sincronização**, subindo assim que a rede voltar. Badge visível "OFFLINE — N pendentes".
- **Busca manual** por nome ou CPF, para quem chegou sem o QR (celular descarregado). Permite check-in manual, registrando que foi manual.
- **Painel ao vivo** `/portaria/painel`: vendidos, presentes, taxa de comparecimento, entradas por minuto, últimos 20 check-ins.
- **Exportar CSV** da lista de compradores (nome, CPF, tipo, status) como backup impresso.

## 8. SEGURANÇA E CONFORMIDADE

- Headers: CSP, `X-Frame-Options`, `Referrer-Policy`, HSTS.
- CORS restrito à origem do site (na Opção B, à URL do GitHub Pages).
- Rate limit em todas as rotas de escrita.
- CPF e telefone exibidos mascarados na interface (`***.456.789-**`).
- **LGPD**: política de privacidade real, base legal (execução de contrato), prazo de retenção definido, rota de exclusão de dados a pedido do titular, nenhum dado pessoal em log.
- Nunca logue payload completo de pagamento.
- `.gitignore` com `.env`, `.env.local`, `node_modules`.
- **Só PIX na v1** — elimina chargeback de cartão clonado. Deixe a estrutura preparada para cartão com **3-D Secure** ativado (transfere a responsabilidade da fraude ao banco emissor), mas não habilite agora.

## 9. ENTREGÁVEIS (nesta ordem, um bloco por vez)

```
/
├── schema.sql
├── package.json
├── .env.example                # todas as variáveis, com comentário do que é cada uma
├── next.config.js
├── tailwind.config.js
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # site público completo
│   ├── termos/page.tsx
│   ├── privacidade/page.tsx
│   ├── meus-ingressos/page.tsx
│   ├── portaria/page.tsx       # PWA scanner
│   ├── portaria/painel/page.tsx
│   └── api/
│       ├── checkout/route.ts
│       ├── pedidos/[id]/status/route.ts
│       ├── pedidos/[id]/cancelar/route.ts
│       ├── webhook/mercadopago/route.ts
│       ├── cron/expirar/route.ts
│       ├── magic-link/route.ts
│       └── portaria/{login,checkin,sync,painel}/route.ts
├── lib/
│   ├── db.ts  mercadopago.ts  ticket.ts  email.ts  validacao.ts  ratelimit.ts
├── components/                 # Hero, Countdown, Galeria, Lightbox, FormCompra, PixModal, FAQ
├── public/
│   ├── manifest.json  sw.js
│   └── imagens/eventos/...     # AQUI ENTRAM MINHAS FOTOS
└── README.md
```

E, ao final:

1. **README.md** com passo a passo real: criar conta no Supabase e rodar o `schema.sql`; criar a aplicação no Mercado Pago Developers (tipo Checkout Transparente), pegar o **Access Token de Produção**, cadastrar a **chave PIX** na conta, **configurar a URL do webhook** no painel; criar conta no Resend e verificar o domínio; deploy na Vercel e cadastro das variáveis de ambiente; como cadastrar o primeiro evento, lotes e operadores.
2. **Instruções da Opção B** (GitHub Pages + backend separado), com o que muda.
3. **Checklist de teste em sandbox** do Mercado Pago antes de vender de verdade: simular pagamento aprovado, expirado e reembolso.
4. **Checklist do dia do evento**: testar o scanner na luz real do local, carregar power banks, imprimir a lista de backup, testar a internet do local, ter um segundo celular pronto.
5. Marque com `// >>> SUBSTITUIR:` **todo** ponto onde eu preciso colocar minhas informações (nome da produtora, CNPJ, chaves, imagens, cores, redes sociais).

Comece pelo `schema.sql` e pelo `.env.example`, depois o back-end, depois o site, e por último o app de portaria. Não resuma código.
