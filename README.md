# Golden Eye Prods.

Site oficial, venda de ingressos por PIX e app de portaria — tudo num projeto só.

**Evento configurado:** TO THE OTHER SIDE · Reverb Band (Tributo The Doors) + Delírio Parabólico + Discotecagem · Hangar7 · 20/11 às 19h

---

## O que isso faz

| Endereço | O que é |
|---|---|
| `/` | Site público: hero com contador, line-up, galeria, FAQ, compra de ingresso |
| `/meus-ingressos` | Área do comprador: ver QR, transferir titular, **cancelar sozinho** |
| `/portaria` | App de check-in para a equipe (instalável no celular, funciona offline) |
| `/portaria/painel` | Números ao vivo durante o evento + exportar CSV |
| `/termos` · `/privacidade` | Páginas legais (CDC + LGPD) |

---

## Antes de qualquer coisa: edite um arquivo só

Tudo que é seu está em **`config/site.ts`**, marcado com `>>> SUBSTITUIR`:

- CNPJ, razão social, e-mail, WhatsApp, redes sociais
- Endereço do Hangar7 e link do mapa
- **Preços dos ingressos** (em centavos: `6000` = R$ 60,00)
- Quantidade de cada lote
- Fotos dos eventos anteriores

Nada de design ou de código precisa ser tocado para o site ficar seu.

---

## Instalação (uma vez)

```bash
npm install
cp .env.example .env.local
```

### 1. Banco de dados — Supabase (grátis)

1. Crie um projeto em [supabase.com](https://supabase.com) — região **South America (São Paulo)**.
2. **Project Settings → Database → Connection string → Transaction pooler**.
3. Copie para `DATABASE_URL` no `.env.local`.

> ⚠ Use a porta **6543** (pooler), não a 5432. Com a 5432 o banco esgota conexões exatamente no pico de vendas.

```bash
npm run db:setup    # cria as tabelas
npm run db:seed     # cadastra o evento, os lotes e os operadores da portaria
```

O `db:seed` **recusa rodar** se a meia-entrada ficar abaixo de 40% do total — é a exigência da Lei 12.933/2013.

### 2. Mercado Pago

1. [mercadopago.com.br/developers/panel](https://www.mercadopago.com.br/developers/panel) → **Suas integrações** → criar aplicação → tipo **Checkout Transparente**.
2. **Credenciais de teste** → copie o *Access Token* para `MP_ACCESS_TOKEN`.
3. Na sua conta Mercado Pago, **cadastre uma chave PIX** — sem isso o PIX não é gerado.
4. Depois do deploy, volte em **Webhooks**:
   - URL: `https://SEUDOMINIO/api/webhook/mercadopago`
   - Evento: **Pagamentos**
   - Copie a **Assinatura secreta** para `MP_WEBHOOK_SECRET`

> Sem `MP_WEBHOOK_SECRET`, o webhook rejeita tudo. Isso é proposital: sem a assinatura, qualquer pessoa que descubra a URL libera ingresso de graça.

### 3. Segredos

```bash
openssl rand -hex 32   # TICKET_HMAC_SECRET   (assina os QR Codes)
openssl rand -hex 32   # PORTARIA_JWT_SECRET  (sessões)
openssl rand -hex 16   # CRON_SECRET
```

No Windows, sem openssl:
```powershell
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

> Se o `TICKET_HMAC_SECRET` mudar depois de vender, **todos os ingressos já emitidos param de validar**. Gere uma vez e não mexa mais.

### 4. E-mail — Resend

1. [resend.com](https://resend.com) → API Keys → `RESEND_API_KEY`.
2. Verifique seu domínio e ajuste `EMAIL_REMETENTE`.
3. Sem domínio verificado, use `onboarding@resend.dev` — só envia para o seu próprio e-mail, serve para testar.

### 5. Rodar

```bash
npm run dev
```

---

## Deploy na Netlify

**Por que Netlify e não Vercel.** O plano gratuito da Vercel (Hobby) proíbe
uso comercial nos termos, e vender ingresso é uso comercial — marcar o
projeto como "pessoal" não resolve, é declarar errado e o site pode cair
justamente quando estiver vendendo. O plano gratuito da Netlify permite uso
comercial, não pede cartão no cadastro, e tem limite rígido: acabaram os
créditos do mês, o serviço para em vez de gerar fatura.

1. Suba o projeto para o GitHub (o `.gitignore` já protege o `.env.local`).
2. [netlify.com](https://netlify.com) → **Sign up** → **GitHub**.
3. **Add new site** → **Import an existing project** → escolha o repositório.
4. Ela detecta o Next.js sozinha. Antes de clicar em Deploy, abra
   **Environment variables** e cadastre todas as chaves do `.env.local`.
5. `NEXT_PUBLIC_SITE_URL` = a URL final (ex.: `https://goldeneye.netlify.app`).
6. Deploy.
7. **Volte no Mercado Pago** e cadastre a URL do webhook com o domínio real.

O `netlify.toml` e a função em `netlify/functions/expirar-pix.mts` já cuidam
da rotina que devolve ao estoque os PIX não pagos, a cada 5 minutos.

### Dá para publicar antes de ter banco e pagamento

O site público — home, agenda, LP dos eventos, galeria, páginas legais — não
toca no banco de dados. Ele sobe e funciona sem nenhuma variável configurada.
Isso permite publicar hoje e divulgar um evento de entrada gratuita, deixando
Supabase e Mercado Pago para quando a venda de ingresso realmente começar.

---

## Antes de vender de verdade — checklist de sandbox

Rode tudo isso **com as credenciais de TESTE**:

- [ ] Compra com 1 inteira + 1 meia — o valor bate?
- [ ] Pagar o PIX de teste → o e-mail chega com PDF e QR?
- [ ] Consultar `/meus-ingressos` com o magic link — o QR aparece?
- [ ] Escanear o QR em `/portaria` → **VERDE**
- [ ] Escanear o **mesmo** QR de novo → **LARANJA "já utilizado"**
- [ ] Meia-entrada → aparece o banner amarelo "EXIGIR COMPROVANTE"?
- [ ] Cancelar em `/meus-ingressos` → estorno cai e o QR fica **VERMELHO**
- [ ] Deixar um PIX expirar → o ingresso volta ao estoque?
- [ ] CPF inválido é recusado? Tentar `111.111.111-11`
- [ ] Colocar o celular em modo avião e escanear → valida offline e mostra "N pendentes"?
- [ ] Voltar o wi-fi → a fila sincroniza sozinha?

Só depois disso troque para as credenciais de **produção**.

---

## Checklist do dia do evento

**Uma semana antes**
- [ ] Testar o scanner **na iluminação real do Hangar7** (luz de festa engana)
- [ ] Cadastrar todos os operadores com PIN próprio (`npm run db:seed`)
- [ ] Instalar o app no celular de cada um: abrir `/portaria` → menu → *Adicionar à tela de início*

**No dia**
- [ ] Cada operador faz login **com internet** antes de abrir os portões — é quando o pacote offline é baixado
- [ ] Power bank por celular
- [ ] **Imprimir o CSV** do painel (plano B se internet e bateria caírem juntas)
- [ ] Testar a internet do local; se for ruim, o modo offline já cobre
- [ ] Um celular reserva, carregado e já logado

**Durante**
- [ ] Acompanhar `/portaria/painel` — comparecimento e fluxo por minuto
- [ ] Se aparecer "OFFLINE · N pendentes", isso é normal — sincroniza sozinho quando a rede volta

---

## Decisões de segurança (por que está assim)

**Só PIX na v1.** Elimina chargeback de cartão clonado, que sairia do seu bolso. A estrutura aceita cartão depois — mas só com **3-D Secure** ligado, que transfere a responsabilidade da fraude ao banco emissor.

> Ressalva honesta: PIX não é risco zero. Existe o **MED** (Mecanismo Especial de Devolução) do Banco Central para casos de fraude comprovada. É incomparavelmente melhor que cartão, mas não é imunidade total.

**O QR é assinado com HMAC-SHA256.** Se fosse um número sequencial, qualquer pessoa geraria ingressos falsos contando de 1 em 1.

**O check-in é atômico.** `UPDATE ... WHERE status='valido'` conferindo a linha afetada. Dois seguranças lendo o mesmo QR no mesmo segundo: só um passa.

**A venda só é confirmada pelo webhook.** A tela do comprador pode dizer qualquer coisa — o ingresso só nasce quando o Mercado Pago confirma no servidor.

**O modo offline baixa hashes, não tokens.** Celular perdido no meio da festa não vira gerador de ingresso.

**Login sem senha na área do comprador.** CPF vaza toda semana no Brasil; o magic link por e-mail é prova de posse de verdade.

---

## Estrutura

```
config/site.ts          ← SEUS DADOS (o único arquivo que você edita)
schema.sql              ← tabelas do banco
lib/                    ← db, mercadopago, ticket (HMAC), email, validação
app/api/                ← checkout, webhook, cron, portaria, reembolso
app/portaria/           ← PWA de check-in
components/             ← Hero, Galeria, Ingressos, ModalPix…
public/imagens/eventos/ ← SUAS FOTOS vão aqui
```

---

## Onde colocar as fotos

1. Crie `public/imagens/eventos/nome-da-edicao/`
2. Jogue os arquivos lá (jpg ou webp, até ~1600px de largura)
3. Liste os caminhos em `config/site.ts` → `galeria`

Enquanto a lista estiver vazia, a galeria mostra gradientes psicodélicos gerados em CSS — nunca fotos falsas.

Também falta:
- `public/imagens/og.jpg` — a prévia no WhatsApp e no Instagram
- `public/imagens/icone-192.png` e `icone-512.png` — ícone do app de portaria

---

## E o GitHub Pages?

**Não dá.** O GitHub Pages só entrega arquivos estáticos — não executa nada
no servidor. E o servidor é justamente quem gera o PIX, recebe o webhook de
pagamento, assina o ingresso, valida o QR na portaria e processa o estorno.
Nenhuma dessas coisas pode rodar no navegador: a chave do Mercado Pago e o
segredo que assina os ingressos ficariam expostos.

Se o Pages estiver ligado no repositório, ele publica o README como se fosse
o site. Desligue em **Settings → Pages → Source: None**, para não deixar um
endereço quebrado no ar com o nome da produtora.

O GitHub é onde o código mora; a Netlify é onde o site roda.

---

## Suporte

Problemas comuns:

| Sintoma | Causa provável |
|---|---|
| "MP_ACCESS_TOKEN não configurado" | Falta cadastrar a variável na Netlify |
| PIX gera mas nunca confirma | Webhook não cadastrado, ou `MP_WEBHOOK_SECRET` errado |
| E-mail não chega | Domínio não verificado no Resend |
| Câmera não abre na portaria | Precisa de HTTPS — em `localhost` funciona; em rede local, não |
| Ingressos "esgotados" mas ninguém comprou | Reservas presas: confira se o cron `/api/cron/expirar` está rodando |
