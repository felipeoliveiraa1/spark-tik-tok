-- =============================================================================
-- 0030 — Audit log de mudanças de plano (plan_status_history)
-- =============================================================================
-- Cada mudança em profiles.plan_status / plan_active / plan_expires_at gera
-- uma linha automaticamente via TRIGGER. Permite reconstituir a timeline
-- completa de cada aluna: quando virou trial, quando converteu, quando
-- cancelou, quando voltou, etc.
--
-- Tabela imutavel (append-only). Source identifica origem:
--   - kiwify_webhook: mudanca veio do webhook Kiwify
--   - admin_grant: criada/extendida via /admin/grant-trial
--   - admin_manual: SQL direto / outra atualizacao manual
--   - trial_expired_auto: futuro cron que marca trials expirados
--   - backfill: backfill historico (criado nessa migration)
-- =============================================================================

create table if not exists public.plan_status_history (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  -- Estado anterior (null pra criacao inicial)
  from_status     text,
  from_active     boolean,
  from_expires_at timestamptz,
  -- Estado novo
  to_status       text,
  to_active       boolean,
  to_expires_at   timestamptz,
  -- Metadata
  source          text not null default 'unknown',
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists plan_status_history_user_idx
  on public.plan_status_history (user_id, created_at desc);

create index if not exists plan_status_history_created_idx
  on public.plan_status_history (created_at desc);

create index if not exists plan_status_history_status_idx
  on public.plan_status_history (to_status, created_at desc);

-- =============================================================================
-- TRIGGER: insere linha em plan_status_history em cada UPDATE relevante
-- =============================================================================
-- Detecta MUDANCA REAL em plan_status, plan_active OU plan_expires_at.
-- Source eh setado via session variable se a app quiser identificar a origem
-- (kiwify_webhook, admin_grant, etc). Se nao setado, fica 'unknown'.

create or replace function public.log_plan_status_change()
returns trigger
language plpgsql
as $$
declare
  v_source text;
  v_changed boolean := false;
begin
  -- So loga se MUDOU algo relevante
  if (new.plan_status is distinct from old.plan_status)
     or (new.plan_active is distinct from old.plan_active)
     or (new.plan_expires_at is distinct from old.plan_expires_at) then
    v_changed := true;
  end if;

  if not v_changed then
    return new;
  end if;

  -- Pega source da session var se setada (app pode setar antes do UPDATE)
  v_source := coalesce(
    current_setting('app.plan_change_source', true),
    'unknown'
  );

  insert into public.plan_status_history (
    user_id,
    from_status, from_active, from_expires_at,
    to_status,   to_active,   to_expires_at,
    source,
    metadata
  ) values (
    new.id,
    old.plan_status, old.plan_active, old.plan_expires_at,
    new.plan_status, new.plan_active, new.plan_expires_at,
    v_source,
    jsonb_build_object(
      'changed_status', new.plan_status is distinct from old.plan_status,
      'changed_active', new.plan_active is distinct from old.plan_active,
      'changed_expires', new.plan_expires_at is distinct from old.plan_expires_at
    )
  );

  return new;
end;
$$;

drop trigger if exists profiles_log_plan_change on public.profiles;
create trigger profiles_log_plan_change
  after update on public.profiles
  for each row
  execute function public.log_plan_status_change();

-- =============================================================================
-- BACKFILL: reconstrucao retroativa baseada em sinais disponiveis
-- =============================================================================
-- 1. Cria entrada de "subscription_created" pra cada profile (created_at)
-- 2. Cria entradas a partir dos kiwify_events (paid, renewed, canceled, refunded)
-- 3. Se profile tem plan_canceled_at, cria entrada de cancel se nao tiver vindo
--    do kiwify_events
--
-- Comecou-com-trial: profile criado antes do primeiro order_approved → trial
-- Comprou-direto: profile criado <1h antes do primeiro order_approved → active
-- =============================================================================

-- 1. Subscription created (linha 0 da timeline de cada aluna)
insert into public.plan_status_history (
  user_id, from_status, from_active, from_expires_at,
  to_status, to_active, to_expires_at, source, metadata, created_at
)
select p.id,
       null, null, null,
       coalesce(p.plan_status, 'inactive'),
       coalesce(p.plan_active, false),
       p.plan_expires_at,
       'backfill',
       jsonb_build_object('event', 'subscription_created'),
       p.created_at
  from public.profiles p
 where p.created_at is not null
   and not exists (
     select 1 from public.plan_status_history h
     where h.user_id = p.id
       and h.source = 'backfill'
       and (h.metadata->>'event') = 'subscription_created'
   );

-- 2. order_approved (paid) do kiwify_events → marca como active
insert into public.plan_status_history (
  user_id, from_status, from_active, from_expires_at,
  to_status, to_active, to_expires_at, source, metadata, created_at
)
select p.id,
       null, null, null,
       'active', true, null,
       'backfill',
       jsonb_build_object(
         'event', 'kiwify_paid',
         'amount_cents', (e.payload->'Commissions'->>'charge_amount')::numeric,
         'order_id', e.payload->>'order_id'
       ),
       e.processed_at
  from public.kiwify_events e
  join public.profiles p on lower(p.email) = lower(e.customer_email)
 where e.event_type = 'order_approved'
   and e.payload->>'order_status' = 'paid'
   and not exists (
     select 1 from public.plan_status_history h
     where h.user_id = p.id
       and h.source = 'backfill'
       and h.metadata->>'event' = 'kiwify_paid'
       and h.metadata->>'order_id' = (e.payload->>'order_id')
   );

-- 3. order_refunded
insert into public.plan_status_history (
  user_id, from_status, from_active, from_expires_at,
  to_status, to_active, to_expires_at, source, metadata, created_at
)
select p.id,
       'active', true, null,
       'refunded', false, e.processed_at,
       'backfill',
       jsonb_build_object('event', 'kiwify_refunded', 'order_id', e.payload->>'order_id'),
       e.processed_at
  from public.kiwify_events e
  join public.profiles p on lower(p.email) = lower(e.customer_email)
 where e.event_type = 'order_refunded'
   and not exists (
     select 1 from public.plan_status_history h
     where h.user_id = p.id
       and h.source = 'backfill'
       and h.metadata->>'event' = 'kiwify_refunded'
       and h.metadata->>'order_id' = (e.payload->>'order_id')
   );

-- 4. subscription_canceled
insert into public.plan_status_history (
  user_id, from_status, from_active, from_expires_at,
  to_status, to_active, to_expires_at, source, metadata, created_at
)
select p.id,
       'active', true, null,
       'canceled', false, p.plan_expires_at,
       'backfill',
       jsonb_build_object('event', 'kiwify_canceled'),
       e.processed_at
  from public.kiwify_events e
  join public.profiles p on lower(p.email) = lower(e.customer_email)
 where e.event_type = 'subscription_canceled'
   and not exists (
     select 1 from public.plan_status_history h
     where h.user_id = p.id
       and h.source = 'backfill'
       and h.metadata->>'event' = 'kiwify_canceled'
   );

-- 5. subscription_renewed
insert into public.plan_status_history (
  user_id, from_status, from_active, from_expires_at,
  to_status, to_active, to_expires_at, source, metadata, created_at
)
select p.id,
       null, null, null,
       'active', true, null,
       'backfill',
       jsonb_build_object('event', 'kiwify_renewed', 'order_id', e.payload->>'order_id'),
       e.processed_at
  from public.kiwify_events e
  join public.profiles p on lower(p.email) = lower(e.customer_email)
 where e.event_type = 'subscription_renewed'
   and not exists (
     select 1 from public.plan_status_history h
     where h.user_id = p.id
       and h.source = 'backfill'
       and h.metadata->>'event' = 'kiwify_renewed'
       and h.metadata->>'order_id' = (e.payload->>'order_id')
   );

comment on table public.plan_status_history is
  'Audit log de mudancas em profiles.plan_*. Populado via trigger + backfill kiwify_events.';
