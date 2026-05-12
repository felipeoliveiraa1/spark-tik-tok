-- =============================================================================
-- Spark — viral research persistence layer
--
-- These tables back the Vyral-scraping flow. They live independently of
-- products/scripts so the cache works even when products haven't been
-- registered yet, and so we can show "top virals" globally.
-- =============================================================================

-- Cache for Vyral search results (keyed by query hash so the same search
-- across users hits the worker only once per TTL window).
create table if not exists public.viral_cache (
  query_hash      text primary key,                       -- sha256(canonical query json)
  query           jsonb not null,                         -- canonical query payload
  response        jsonb not null,                         -- VyralSearchResult
  source          text not null default 'vyral',
  fetched_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '24 hours')
);

create index if not exists viral_cache_expires_at_idx on public.viral_cache (expires_at);

-- One row per viral video the scraper has seen.
-- Multiple products may reference the same viral via `viral_research_products`.
create table if not exists public.viral_videos (
  id                       text primary key,              -- Vyral video id (e.g. vy-001)
  url                      text not null,
  creator                  text not null,
  thumbnail_url            text,
  posted_at                date,
  country                  text not null check (country in ('BR','US')),
  niche                    text,
  views                    bigint not null default 0,
  likes                    bigint not null default 0,
  comments                 bigint not null default 0,
  shares                   bigint,
  estimated_revenue_brl    numeric(12,2),
  product_name             text,
  product_shop_url         text,
  product_price_brl        numeric(12,2),
  hook_preview             text,
  raw                      jsonb not null,                -- full VyralVideoSummary payload
  first_seen_at            timestamptz not null default now(),
  last_seen_at             timestamptz not null default now()
);

create index if not exists viral_videos_country_views_idx on public.viral_videos (country, views desc);
create index if not exists viral_videos_niche_idx on public.viral_videos (niche);
create index if not exists viral_videos_posted_at_idx on public.viral_videos (posted_at desc);

-- AI transcription (hook / problem / solution / cta) — separate table because
-- it's fetched on-demand and is larger than the summary.
create table if not exists public.viral_transcriptions (
  video_id        text primary key references public.viral_videos(id) on delete cascade,
  language        text not null,
  full_text       text not null,
  hook_text       text,
  hook_start_sec  numeric,
  hook_end_sec    numeric,
  problem_text    text,
  solution_text   text,
  cta_text        text,
  insights        jsonb,
  raw             jsonb not null,                         -- full VyralTranscription
  fetched_at      timestamptz not null default now()
);

-- Link table — which products are associated with which viral videos.
-- Built up when a user explicitly attaches a viral to a product, OR when the
-- agent decides they match (via product_name normalization).
create table if not exists public.viral_research_products (
  product_id      uuid not null,                          -- FK added when products table exists
  video_id        text not null references public.viral_videos(id) on delete cascade,
  attached_by     text not null default 'agent' check (attached_by in ('user','agent')),
  attached_at     timestamptz not null default now(),
  primary key (product_id, video_id)
);

-- Per-user usage counter for quota enforcement.
-- Applied on the Next.js side before calling the scraper.
create table if not exists public.usage_counters (
  user_id            uuid not null,
  period_month       text not null,                       -- 'YYYY-MM'
  viral_searches     int not null default 0,
  scripts_generated  int not null default 0,
  tokens_in          bigint not null default 0,
  tokens_out         bigint not null default 0,
  updated_at         timestamptz not null default now(),
  primary key (user_id, period_month)
);

-- Track raw scraper jobs for debugging + admin visibility.
create table if not exists public.scraper_jobs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid,
  kind            text not null,
  params          jsonb not null,
  status          text not null check (status in ('queued','running','done','error')),
  result          jsonb,
  error           text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index if not exists scraper_jobs_user_kind_idx on public.scraper_jobs (user_id, kind, created_at desc);

-- RLS will be enabled in a later migration once the user tables exist.
