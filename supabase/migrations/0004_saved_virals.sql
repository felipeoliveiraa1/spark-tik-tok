-- =============================================================================
-- Spark — biblioteca de virais salvos pela aluna
--
-- A aluna conversa com o agente Virais, escolhe um vídeo e diz "salva esse".
-- O agente chama a tool save_viral, que grava aqui com TODOS os campos
-- denormalizados (thumbnail, métricas, hook, caption, link do produto) pra
-- conseguir mostrar depois mesmo se o cache global expirar.
--
-- Diferente de viral_videos (cache global de tudo que o scraper já viu),
-- saved_virals é por usuário — a aluna só vê o que ela escolheu guardar.
-- =============================================================================

create table if not exists public.saved_virals (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  -- ID original do vídeo (do scraper) — usado pra detectar duplicação
  source_video_id          text not null,
  -- Produto da aluna que esse viral inspira (opcional)
  product_id               uuid references public.products(id) on delete set null,

  -- Identidade do vídeo
  url                      text not null,
  thumbnail_url            text,
  rank                     int,

  -- Criadora
  creator                  text,
  creator_avatar_url       text,

  -- Categoria
  country                  text,
  niche                    text,

  -- Conteúdo
  caption                  text,
  hook                     text,

  -- Métricas
  views                    bigint,
  likes                    bigint,
  comments                 bigint,
  shares                   bigint,
  estimated_revenue_brl    numeric(12,2),

  -- Produto vendido no vídeo
  product_name             text,
  product_shop_url         text,
  product_price_brl        numeric(12,2),

  -- Payload bruto da tool pra histórico (não confiar pra rendering)
  raw                      jsonb,

  saved_at                 timestamptz not null default now()
);

create index if not exists saved_virals_user_idx
  on public.saved_virals (user_id, saved_at desc);

create unique index if not exists saved_virals_user_video_idx
  on public.saved_virals (user_id, source_video_id);

alter table public.saved_virals enable row level security;

drop policy if exists "saved_virals_owner" on public.saved_virals;
create policy "saved_virals_owner" on public.saved_virals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
