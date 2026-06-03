-- =============================================================================
-- 0027 — Campanhas de WhatsApp: multi-instancia + sticky + fila
-- =============================================================================
-- Infra pra mandar mensagens (motivacionais, triggers, etc) via Evolution API
-- com:
--   - Multiplas instancias (numeros de WhatsApp) com load-balance + failover
--   - "Sticky routing": cada aluna fica vinculada permanentemente ao 1o numero
--     que mandou mensagem pra ela (evita que ela receba do "desconhecido")
--   - Fila com cadencia (scheduled_at) pra evitar ban por volume
--   - Janela de horario (8h-22h BRT) — controlada no cron, nao no schema
--   - Dedup: nao manda mesmo template_key pra mesma aluna em < N dias
--   - Limite global: max 3 msgs/semana por aluna
--
-- Crons (Vercel cron, ver vercel.json):
--   - /api/cron/whatsapp-flush     a cada 1min   processa pendentes
--   - /api/cron/whatsapp-triggers  1x por dia   varre triggers e enfileira
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. whatsapp_instances — numeros disponiveis pra envio
-- -----------------------------------------------------------------------------
-- name = exatamente o nome da instance no Evolution API (case-sensitive).
-- priority menor = mais preferida no round-robin de novos atribuidos.
-- purpose define em que campanhas a instancia pode entrar.
create table if not exists public.whatsapp_instances (
  id              uuid primary key default gen_random_uuid(),
  name            text unique not null,
  display_name    text not null,
  phone_number    text,
  is_active       boolean not null default true,
  priority        int not null default 100,
  daily_limit     int not null default 500,
  purpose         text not null default 'all'
                  check (purpose in ('all', 'marketing', 'transactional', 'support')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists whatsapp_instances_active_idx
  on public.whatsapp_instances (is_active, priority);

-- Seed: instancia atual (lendo o que voce ja tem nas envs do Vercel)
insert into public.whatsapp_instances (name, display_name, priority, purpose)
values ('metodotts', 'Principal', 1, 'all')
on conflict (name) do nothing;

-- RLS: admin tudo (service_role bypassa). Aluna nao le.
alter table public.whatsapp_instances enable row level security;

drop policy if exists "whatsapp_instances_admin_all" on public.whatsapp_instances;
create policy "whatsapp_instances_admin_all" on public.whatsapp_instances
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- 2. profiles.whatsapp_instance_id — sticky routing
-- -----------------------------------------------------------------------------
-- Quando setado, TODAS as mensagens futuras pra essa aluna vao por essa
-- instancia (mesmo se outras estiverem livres). Null = ainda nao recebeu
-- nenhuma mensagem; sera atribuida no 1o envio.
alter table public.profiles
  add column if not exists whatsapp_instance_id uuid
  references public.whatsapp_instances(id) on delete set null;

create index if not exists profiles_whatsapp_instance_idx
  on public.profiles (whatsapp_instance_id)
  where whatsapp_instance_id is not null;

-- -----------------------------------------------------------------------------
-- 3. whatsapp_outbox — fila + historico unificados
-- -----------------------------------------------------------------------------
-- Linha eh criada quando admin/cron decide enviar. status='pending' ate o
-- cron flush processar. Sucesso vira 'sent', falha vira 'failed', e
-- 'skipped' eh quando a logica decide nao enviar (sticky inativa, limit
-- semanal estourado, etc).
create table if not exists public.whatsapp_outbox (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  instance_id    uuid references public.whatsapp_instances(id) on delete set null,
  template_key   text not null,
  phone          text not null,
  text           text not null,
  status         text not null default 'pending'
                 check (status in ('pending', 'sent', 'failed', 'skipped')),
  scheduled_at   timestamptz not null default now(),
  sent_at        timestamptz,
  attempts       int not null default 0,
  error          text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

-- Index pra cron flush — pega os pendentes ja maduros, mais antigos primeiro
create index if not exists whatsapp_outbox_pending_idx
  on public.whatsapp_outbox (status, scheduled_at)
  where status = 'pending';

-- Index pra timeline por aluna (admin abrir o perfil de uma aluna ve historico)
create index if not exists whatsapp_outbox_user_idx
  on public.whatsapp_outbox (user_id, created_at desc);

-- Index pra dedup (essa aluna ja recebeu esse template recentemente?)
create index if not exists whatsapp_outbox_dedup_idx
  on public.whatsapp_outbox (user_id, template_key, created_at desc);

-- Index pra dashboard ("mensagens enviadas hoje/semana")
create index if not exists whatsapp_outbox_status_created_idx
  on public.whatsapp_outbox (status, created_at desc);

-- RLS: admin tudo. Aluna NAO acessa (msg WhatsApp eh interno-admin).
alter table public.whatsapp_outbox enable row level security;

drop policy if exists "whatsapp_outbox_admin_all" on public.whatsapp_outbox;
create policy "whatsapp_outbox_admin_all" on public.whatsapp_outbox
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- COMMENTS
-- -----------------------------------------------------------------------------
comment on table public.whatsapp_instances is
  'Numeros de WhatsApp disponiveis pra envio via Evolution API. name = nome da instance no Evo.';
comment on column public.profiles.whatsapp_instance_id is
  'Sticky routing: aluna sempre recebe pelo mesmo numero. Setado no 1o envio.';
comment on table public.whatsapp_outbox is
  'Fila + historico de mensagens WhatsApp. Cron whatsapp-flush processa pending.';
comment on column public.whatsapp_outbox.template_key is
  'Identificador do template usado. Ex: motivacional_geral_v1, dia1_nao_logou, sumiu_7d, streak_3.';
comment on column public.whatsapp_outbox.scheduled_at is
  'Quando o cron deve enviar. Usado pra cadencia (escalonar blasts).';
