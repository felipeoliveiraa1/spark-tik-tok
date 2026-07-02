-- =============================================================================
-- 0047 — email_events: audit + dedup de emails transacionais
-- =============================================================================
-- Sistema dispara varios emails (onboarding D1/D3/D7, milestones de aula,
-- avisos de renovacao, winback, prova aprovada, etc). Sem tabela de audit
-- ficamos cegos: nao da pra:
--   a) provar que um email foi enviado (suporte "nao recebi nada")
--   b) prevenir duplicata (cron rodou 2x, worker travou e retry, etc)
--
-- dedup_key eh a chave semantica do envio:
--   - emails unicos:     user_id || '::' || kind             (ex: milestone_primeira_aula)
--   - emails periodicos: user_id || '::' || kind || '::' || YYYYMMDD  (1x por dia)
--   - emails por evento: user_id || '::' || kind || '::' || <event_id> (ex: renewal_3d::<subscription_id>)
--
-- Sender monta dedup_key ANTES de disparar e faz insert. Se violar UNIQUE
-- (user_id, dedup_key) — email ja foi enviado, aborta silenciosamente.
--
-- RLS: admin le tudo (dashboard de audit); user le so os proprios (transparencia).
-- Inserts vem via service_role (bypass RLS) do worker/cron.
--
-- Idempotente. Safe pra rodar 2x.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Tabela
-- ---------------------------------------------------------------------------
create table if not exists public.email_events (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  kind       text        not null,
  sent_at    timestamptz not null default now(),
  dedup_key  text,
  meta       jsonb       not null default '{}'::jsonb
);

comment on table public.email_events is
  'Audit + dedup de emails transacionais enviados. Sender monta dedup_key semantica e faz insert antes de disparar; violacao de UNIQUE (user_id, dedup_key) = email ja enviado, aborta.';

comment on column public.email_events.id is
  'PK uuid gerada no server.';

comment on column public.email_events.user_id is
  'Destinatario (FK profiles.id, cascade). Email vem via profiles.email — snapshot nao armazenado aqui pra evitar drift.';

comment on column public.email_events.kind is
  'Tipo do email. Ex: onboarding_d1, onboarding_d3, milestone_primeira_aula, milestone_modulo_completo, renewal_3d, renewal_1d, winback_d3, winback_d7, prova_aprovada, prova_rejeitada, boss_fight_desbloqueado.';

comment on column public.email_events.sent_at is
  'Timestamp do disparo. Default now() no insert.';

comment on column public.email_events.dedup_key is
  'Chave semantica pra dedup. Formatos: (a) user_id::kind pra email unico por usuaria; (b) user_id::kind::YYYYMMDD pra email periodico diario; (c) user_id::kind::<event_id> pra email por evento (ex: renewal por subscription).';

comment on column public.email_events.meta is
  'Extras JSON: badge_slug, lesson_slug, module_slug, subscription_id, template_id, provider_message_id, etc.';

-- ---------------------------------------------------------------------------
-- 2) Indexes
-- ---------------------------------------------------------------------------
-- UNIQUE em (user_id, dedup_key) — bloqueia duplo envio.
-- Nulls sao permitidos e nao colidem entre si (Postgres default) —
-- se algum kind opta por nao dedupar, envia dedup_key=null e passa.
create unique index if not exists email_events_user_dedup_uniq
  on public.email_events (user_id, dedup_key)
  where dedup_key is not null;

-- Historico por usuario, ordem cronologica descendente
create index if not exists email_events_user_sent_idx
  on public.email_events (user_id, sent_at desc);

-- Bonus: query por kind (dashboard "quantos onboarding_d1 sairam hoje?")
create index if not exists email_events_kind_sent_idx
  on public.email_events (kind, sent_at desc);

-- ---------------------------------------------------------------------------
-- 3) RLS
-- ---------------------------------------------------------------------------
alter table public.email_events enable row level security;

-- Admin le tudo
drop policy if exists "email_events_admin_read" on public.email_events;
create policy "email_events_admin_read" on public.email_events
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- User le so os proprios
drop policy if exists "email_events_owner_read" on public.email_events;
create policy "email_events_owner_read" on public.email_events
  for select using (user_id = auth.uid());

-- Sem policies de insert/update/delete: service_role (worker/cron) bypassa RLS.
-- Usuarias nao inserem nem editam email_events pela API publica.
