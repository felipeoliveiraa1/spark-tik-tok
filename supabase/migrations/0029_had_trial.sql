-- =============================================================================
-- 0029 — Rastreio histórico: had_trial
-- =============================================================================
-- Vira true quando a aluna passa por trial pela primeira vez. Fica true pra
-- SEMPRE (mesmo virando pagante, expirando ou cancelando). Permite separar:
--   - Trial ativo agora: plan_status='trial' AND plan_active=true
--   - Trial expirado: plan_status='trial' AND plan_expires_at < now()
--   - Conversão (virou pagante): had_trial=true AND plan_status='active'
--   - Conversão perdida (cancelou): had_trial=true AND plan_status IN ('canceled','refunded','inactive')
-- =============================================================================

alter table public.profiles
  add column if not exists had_trial boolean not null default false;

-- Backfill: marca todo mundo que ATUALMENTE tem trial OU tem plan_expires_at
-- setado (sinal forte de que passou por trial em algum momento — criadas via
-- /admin/grant sempre tinham plan_expires_at).
update public.profiles
   set had_trial = true
 where plan_status = 'trial'
    or plan_expires_at is not null;

create index if not exists profiles_had_trial_idx
  on public.profiles (had_trial)
  where had_trial = true;

comment on column public.profiles.had_trial is
  'TRUE pra sempre depois que aluna entra em trial. Permite metricas de conversao trial->pagante.';
