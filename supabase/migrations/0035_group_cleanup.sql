-- =============================================================================
-- 0035 — Group cleanup: aviso + remocao automatica do grupo de alunas
-- =============================================================================
-- Quando aluna cancela/reembolsa/inativa, worker hourly:
--   Fase A: manda aviso WhatsApp 24h antes da remocao (template
--           trigger_group_removal_warning) e marca group_removal_warned_at
--   Fase B: 24h depois, remove dos grupos via Evolution updateParticipant
--           e marca group_removed_at
--
-- Se aluna reativa o plano (plan_active vira true), trigger postgres
-- zera as 2 colunas — ciclo limpo se cancelar de novo no futuro.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Colunas em profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists group_removal_warned_at timestamptz null;

alter table public.profiles
  add column if not exists group_removed_at timestamptz null;

comment on column public.profiles.group_removal_warned_at is
  'Quando o worker mandou aviso de 24h antes da remocao do grupo. Null = ainda nao avisada.';

comment on column public.profiles.group_removed_at is
  'Quando o worker removeu (ou confirmou que ja estava fora) dos grupos. Idempotente.';

-- Index parcial: so candidatas reais do cron (plano caiu, ainda nao removida)
create index if not exists profiles_group_cleanup_pending_idx
  on public.profiles (plan_status, group_removal_warned_at)
  where plan_active = false
    and group_removed_at is null
    and whatsapp is not null;

-- ---------------------------------------------------------------------------
-- 2) Tabela de audit append-only
-- ---------------------------------------------------------------------------
-- action: warned | removed | failed | skipped
-- reason: string livre (warning_enqueued, already_out, instance_not_admin,
--         evo_error, opt_out_no_warning, warn_enqueue_<reason>, ...)
-- payload: estrutura por kind. Ex: { groups: [{groupJid, ok, reason, error}] }
create table if not exists public.group_removal_audit (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  action      text not null check (action in (
    'warned',
    'removed',
    'failed',
    'skipped'
  )),
  reason      text,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.group_removal_audit is
  'Audit append-only do pipeline group-cleanup (aviso 24h -> remocao Evolution).';

create index if not exists group_removal_audit_user_idx
  on public.group_removal_audit (user_id, created_at desc);

create index if not exists group_removal_audit_action_idx
  on public.group_removal_audit (action, created_at desc);

-- ---------------------------------------------------------------------------
-- 3) RLS na tabela de audit
-- ---------------------------------------------------------------------------
alter table public.group_removal_audit enable row level security;

drop policy if exists "group_removal_audit_staff_read" on public.group_removal_audit;
create policy "group_removal_audit_staff_read" on public.group_removal_audit
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'crm_agent')
    )
  );

drop policy if exists "group_removal_audit_self_read" on public.group_removal_audit;
create policy "group_removal_audit_self_read" on public.group_removal_audit
  for select using (user_id = auth.uid());

-- Insert/update: NENHUMA policy. So service_role escreve.

-- ---------------------------------------------------------------------------
-- 4) Trigger: zera flags quando aluna reativa o plano
-- ---------------------------------------------------------------------------
-- Se plan_active vira false -> true (reativou), zera warned_at + removed_at
-- pra ciclo limpo caso ela cancele de novo no futuro. Sem isso, se cancelar
-- de novo, o cron ja acharia warned_at > 24h e removeria sem novo aviso.
--
-- DEFENSIVO (review#8): so dispara o reset se a chamada vem do service_role
-- (auth.uid() IS NULL identifica chamadas de webhook Kiwify / cron / RPC
-- service-role). Aluna autenticada NUNCA deveria estar mexendo em plan_active
-- direto (policy profiles_self_update permite tecnicamente, mas eh issue
-- pre-existente que devera ser corrigida em outra PR via column-level check).
create or replace function public.reset_group_cleanup_on_reactivation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     and old.plan_active is distinct from new.plan_active
     and old.plan_active = false
     and new.plan_active = true then
    new.group_removal_warned_at = null;
    new.group_removed_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_reset_group_cleanup on public.profiles;
create trigger profiles_reset_group_cleanup
  before update on public.profiles
  for each row execute function public.reset_group_cleanup_on_reactivation();
