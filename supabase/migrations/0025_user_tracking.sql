-- =============================================================================
-- 0025 — Tracking de atividade das alunas (last_seen + user_events)
-- =============================================================================
-- Objetivo: visibilidade completa do ciclo de vida da aluna pra o admin
-- conseguir responder perguntas como:
--   - quem ta ativa hoje? quantas voltaram essa semana?
--   - quanto tempo demora desde criar conta ate bater primeira rotina?
--   - quais eventos sao mais comuns no D1? no D7?
--   - quem sumiu ha mais de 7 dias e era pagante?
--
-- Estrategia:
--   1. profiles.last_seen_at — heartbeat atualizado em cada acesso (throttle
--      5min no app pra evitar UPDATE em todo request). Indexado pra
--      consultas "ativas hoje", "ativas semana", "sumidas".
--   2. tabela user_events — eventos discretos imutaveis. metadata jsonb pra
--      detalhes (ex: { product_id: 'xxx', niche: 'skincare' }). Indexes
--      cobrem queries por user (timeline), por evento (volume) e por dia.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. profiles.last_seen_at
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- Backfill: pra contas existentes, usa o updated_at como proxy do ultimo acesso
update public.profiles
  set last_seen_at = coalesce(updated_at, created_at)
  where last_seen_at is null;

create index if not exists profiles_last_seen_at_idx
  on public.profiles (last_seen_at desc nulls last);

-- -----------------------------------------------------------------------------
-- 2. user_events — eventos discretos
-- -----------------------------------------------------------------------------
create table if not exists public.user_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  event       text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Index pra "timeline da aluna X" (mais comum)
create index if not exists user_events_user_created_idx
  on public.user_events (user_id, created_at desc);

-- Index pra "quantos eventos do tipo Y nos ultimos N dias"
create index if not exists user_events_event_created_idx
  on public.user_events (event, created_at desc);

-- Index pra "atividade do dia D" (DAU / report diario)
create index if not exists user_events_created_at_idx
  on public.user_events (created_at desc);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.user_events enable row level security;

-- Aluna le seus proprios eventos (pra historico/timeline pessoal futura)
drop policy if exists "user_events_select_own" on public.user_events;
create policy "user_events_select_own" on public.user_events
  for select using (auth.uid() = user_id);

-- Aluna pode inserir eventos pra ela mesma (tracking client-side opcional)
drop policy if exists "user_events_insert_own" on public.user_events;
create policy "user_events_insert_own" on public.user_events
  for insert with check (auth.uid() = user_id);

-- Admin tudo (service_role bypassa RLS, mas deixo policy explicita pra
-- futuros admins via JWT)
drop policy if exists "user_events_admin_all" on public.user_events;
create policy "user_events_admin_all" on public.user_events
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- COMMENTS
-- -----------------------------------------------------------------------------
comment on column public.profiles.last_seen_at is
  'Ultima atividade da aluna no app. Atualizado via heartbeat (throttle 5min).';
comment on table public.user_events is
  'Eventos discretos do ciclo de vida da aluna. Imutaveis. Usar trackEvent() do lib/track.ts.';
comment on column public.user_events.event is
  'Nome do evento em snake_case. Ex: login, routine_check, product_create, script_generate, lesson_view, live_join, cola_rapida_use, revenue_save, install_pwa.';
comment on column public.user_events.metadata is
  'JSON livre com detalhes do evento. Schema varia por tipo.';
