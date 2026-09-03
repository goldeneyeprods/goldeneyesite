-- ============================================================================
--  GOLDEN EYE PRODS. — Esquema do banco de dados (PostgreSQL)
--  Rode este arquivo uma única vez no SQL Editor do Supabase (ou Neon).
-- ============================================================================

create extension if not exists "pgcrypto";  -- para gen_random_uuid()

-- ----------------------------------------------------------------------------
-- EVENTOS
-- ----------------------------------------------------------------------------
create table if not exists eventos (
  id                  bigserial primary key,
  slug                text not null unique,
  nome                text not null,
  subtitulo           text,
  descricao           text,
  data_inicio         timestamptz not null,
  abertura_portoes    timestamptz not null,
  local_nome          text not null,
  endereco            text not null,
  mapa_url            text,
  classificacao_etaria text not null default '18 anos',
  capacidade          integer not null,
  imagem_hero         text,
  ativo               boolean not null default true,
  criado_em           timestamptz not null default now()
);

create index if not exists idx_eventos_ativo on eventos (ativo, data_inicio);

-- ----------------------------------------------------------------------------
-- LOTES  (preços SEMPRE em centavos, inteiro — nunca float)
-- ----------------------------------------------------------------------------
create table if not exists lotes (
  id                   bigserial primary key,
  evento_id            bigint not null references eventos(id) on delete cascade,
  nome                 text not null,
  tipo                 text not null check (tipo in ('inteira','meia')),
  preco_centavos       integer not null check (preco_centavos >= 0),
  quantidade_total     integer not null check (quantidade_total >= 0),
  quantidade_vendida   integer not null default 0 check (quantidade_vendida >= 0),
  quantidade_reservada integer not null default 0 check (quantidade_reservada >= 0),
  ordem                integer not null default 0,
  valido_ate           timestamptz,
  ativo                boolean not null default true,
  -- trava de segurança: é impossível vender+reservar mais que o total
  constraint lote_sem_overbooking
    check (quantidade_vendida + quantidade_reservada <= quantidade_total)
);

create index if not exists idx_lotes_evento on lotes (evento_id, ativo, ordem);

-- ----------------------------------------------------------------------------
-- PEDIDOS
-- ----------------------------------------------------------------------------
create table if not exists pedidos (
  id                   uuid primary key default gen_random_uuid(),
  evento_id            bigint not null references eventos(id),
  comprador_nome       text not null,
  comprador_email      text not null,
  comprador_cpf        text not null,          -- somente dígitos
  comprador_telefone   text not null,
  valor_total_centavos integer not null,
  status               text not null default 'pendente'
                       check (status in ('pendente','pago','expirado','cancelado','reembolsado')),
  mp_payment_id        text unique,
  pix_qr_code          text,
  pix_qr_code_base64   text,
  pix_expira_em        timestamptz,
  ip_origem            text,
  aceite_termos_em     timestamptz not null default now(),
  criado_em            timestamptz not null default now(),
  pago_em              timestamptz,
  cancelado_em         timestamptz
);

create index if not exists idx_pedidos_email   on pedidos (lower(comprador_email));
create index if not exists idx_pedidos_cpf     on pedidos (comprador_cpf);
create index if not exists idx_pedidos_status  on pedidos (status, pix_expira_em);
create index if not exists idx_pedidos_evento  on pedidos (evento_id, status);

-- ----------------------------------------------------------------------------
-- ITENS DO PEDIDO (quantos de cada lote)
-- ----------------------------------------------------------------------------
create table if not exists pedido_itens (
  id             bigserial primary key,
  pedido_id      uuid not null references pedidos(id) on delete cascade,
  lote_id        bigint not null references lotes(id),
  quantidade     integer not null check (quantidade > 0),
  preco_unitario_centavos integer not null
);

create index if not exists idx_itens_pedido on pedido_itens (pedido_id);

-- ----------------------------------------------------------------------------
-- INGRESSOS  (um por pessoa; o token_qr é assinado com HMAC no servidor)
-- ----------------------------------------------------------------------------
create table if not exists ingressos (
  id            uuid primary key default gen_random_uuid(),
  pedido_id     uuid not null references pedidos(id) on delete cascade,
  evento_id     bigint not null references eventos(id),
  lote_id       bigint not null references lotes(id),
  tipo          text not null check (tipo in ('inteira','meia')),
  titular_nome  text not null,
  titular_cpf   text not null,
  token_qr      text not null unique,
  status        text not null default 'valido'
                check (status in ('valido','usado','cancelado')),
  usado_em      timestamptz,
  usado_por     bigint,
  gate          text,
  criado_em     timestamptz not null default now()
);

create index if not exists idx_ingressos_pedido on ingressos (pedido_id);
create index if not exists idx_ingressos_evento on ingressos (evento_id, status);
create index if not exists idx_ingressos_token  on ingressos (token_qr);

-- ----------------------------------------------------------------------------
-- OPERADORES DE PORTARIA
-- ----------------------------------------------------------------------------
create table if not exists operadores (
  id         bigserial primary key,
  evento_id  bigint not null references eventos(id) on delete cascade,
  nome       text not null,
  pin_hash   text not null,       -- bcrypt do PIN de 6 dígitos
  gate       text default 'Portão Principal',
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

create index if not exists idx_operadores_evento on operadores (evento_id, ativo);

-- ----------------------------------------------------------------------------
-- LOG DE WEBHOOK  (auditoria + trava de idempotência)
-- ----------------------------------------------------------------------------
create table if not exists webhook_log (
  id           bigserial primary key,
  mp_topic     text,
  mp_id        text not null,
  payload      jsonb,
  processado   boolean not null default false,
  recebido_em  timestamptz not null default now(),
  unique (mp_topic, mp_id)          -- webhook repetido não processa duas vezes
);

-- ----------------------------------------------------------------------------
-- LOG DE CHECK-IN
-- ----------------------------------------------------------------------------
create table if not exists checkin_log (
  id           bigserial primary key,
  ingresso_id  uuid,
  operador_id  bigint,
  evento_id    bigint,
  resultado    text not null check (resultado in ('ok','ja_usado','invalido','cancelado','manual')),
  detalhe      text,
  criado_em    timestamptz not null default now()
);

create index if not exists idx_checkin_evento on checkin_log (evento_id, criado_em desc);

-- ----------------------------------------------------------------------------
-- MAGIC LINKS  (acesso a /meus-ingressos sem senha — LGPD friendly)
-- ----------------------------------------------------------------------------
create table if not exists magic_links (
  token       text primary key,       -- hash do token, nunca o token puro
  email       text not null,
  expira_em   timestamptz not null,
  usado_em    timestamptz,
  criado_em   timestamptz not null default now()
);

create index if not exists idx_magic_email on magic_links (lower(email));

-- ----------------------------------------------------------------------------
-- RATE LIMIT  (contador simples por chave e janela)
-- ----------------------------------------------------------------------------
create table if not exists rate_limit (
  chave       text not null,
  janela      timestamptz not null,
  contagem    integer not null default 1,
  primary key (chave, janela)
);

-- ----------------------------------------------------------------------------
-- GALERIA DE EVENTOS ANTERIORES
-- ----------------------------------------------------------------------------
create table if not exists galeria (
  id         bigserial primary key,
  edicao     text not null,           -- ex.: "Cosmic Ritual — Ago/2025"
  arquivo    text not null,           -- ex.: "/imagens/eventos/2025-cosmic/01.jpg"
  legenda    text,
  ordem      integer not null default 0
);

create index if not exists idx_galeria_ordem on galeria (edicao, ordem);
