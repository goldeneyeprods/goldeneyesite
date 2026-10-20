# Golden Eye Prods. — site, venda de ingressos e portaria

Next.js 15 (App Router) + Postgres (Supabase) + Mercado Pago (PIX, Checkout
Transparente / API de Payments) + Resend. Deploy na **Netlify** (não Vercel:
o plano grátis da Vercel proíbe uso comercial). O README.md é o manual de
quem opera o site; este arquivo é para quem mexe no código.

## Comandos

```bash
npm run dev        # desenvolvimento
npm run build      # confere tipos e build de produção
npx tsc --noEmit   # só os tipos
npm run db:setup   # roda schema.sql (idempotente: create/alter if not exists)
npm run db:seed    # grava eventos/lotes do config/site.ts e pede operadores da portaria
npm run mp:check   # diagnóstico real da conta Mercado Pago (cria e cancela PIX de R$ 0,01)
```

Não há testes automatizados. Valide com `tsc`/`build` e com o checklist de
sandbox do README.

## Onde mora cada coisa

- `config/site.ts` — **fonte única** dos dados: produtora, eventos, lotes,
  bandas, FAQ. É lido também pelo `scripts/seed.mjs` fora do Next, por isso
  **não pode ter `import`**.
- `lib/lotes.ts` — regra de estoque e virada de lote (fases + teto do evento).
- `lib/pedidos.ts` — aprovar/liberar pedido; `sincronizarPagamento` consulta o MP.
- `lib/mercadopago.ts` — criação do PIX, consulta, estorno, assinatura do webhook.
- `app/api/checkout` → cria pedido pendente e reserva estoque.
- `app/api/webhook/mercadopago` → aviso do MP; sempre reconsulta a API.
- `app/api/pedidos/[id]/status` → polling da tela do PIX; consulta o MP se o webhook atrasar.
- `app/api/cron/expirar` → chamado pela função agendada `netlify/functions/expirar-pix.mts`.
- `app/portaria` → PWA de check-in (funciona offline com hashes, não tokens).

## Regras que não podem quebrar

- **Dinheiro em centavos, inteiro.** Reais decimais só na fronteira com o MP.
- **Preço e estoque vêm do banco**, nunca do navegador.
- **Ingresso só nasce com o MP dizendo `approved`** na API. O corpo do webhook
  não é fonte de verdade. Um mesmo pagamento recebe vários avisos com o mesmo
  id (criado → aprovado), então o `webhook_log` não pode servir para descartar
  aviso; a idempotência fica no `aprovarPedido` (`for update` + status).
- Chamada de rede (MP, e-mail) **nunca** dentro de transação com linha travada.
- `TICKET_HMAC_SECRET` não muda depois que houve venda: invalida todos os QR.
- Meia-entrada: o seed recusa evento com menos de 40% de meia (Lei 12.933/13).
  `meiaSolidaria: true` = meia aberta a todos, sem comprovante em lugar nenhum.

## Lotes

Lotes com a mesma `fase` dividem a `quantidade` (meia + inteira) e só a menor
fase aberta vende. A fase fecha no `validoAte` ou ao esgotar. `ingressosAVenda`
é o teto do evento; o último lote tem quantidade igual ao teto para ficar com
"o que sobrou". Use o atalho `lote(fase, nome, precoMeia, qtd, validoAte?)`.
Rodar o seed de novo atualiza preço/quantidade/data sem tocar no vendido.

## Conteúdo

- Texto em português do Brasil, no tom da cena (direto, sem jargão de
  marketing). Pronomes neutros quando não se sabe.
- **Não inventar fato sobre gente real** (bandas, artistas). O que não veio da
  banda fica marcado `>>> REVISAR`; dado que falta, `>>> SUBSTITUIR`.
- Fotos de banda: originais em `arquivosbandas/<banda>/`, versões do site
  (1800px, JPEG q82; logo PNG 800px) em `public/imagens/bandas/<banda>/`.
  `scripts/processar-bandas.mjs` faz isso para arquivos soltos na pasta da banda.
- Mudou o slug de um evento já divulgado? Redirecione o antigo em `next.config.mjs`.

## Git e publicação

A Netlify publica só o ramo `producao`; a `main` é o trabalho do dia a dia.
Publicar = `git push origin main:producao`, e só quando o usuário pedir: cada
publicação gasta créditos do plano gratuito, e sem créditos o site sai do ar.

Mensagens de commit em português, uma linha, verbo no presente da 3ª pessoa
("Troca a Reverb Band pela Nada Basta"). `.env.local` nunca vai pro git.
