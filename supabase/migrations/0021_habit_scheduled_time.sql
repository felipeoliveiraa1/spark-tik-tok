-- =============================================================================
-- 0021 — Horario sugerido por habito (rotina)
-- =============================================================================
-- Aluna pode opcionalmente atribuir um horario "HH:MM" pra cada habito
-- da rotina, virando uma agenda do dia em vez de checklist solto.
-- Nullable — habitos sem horario continuam funcionando como antes.
-- =============================================================================

alter table public.user_habits
  add column if not exists scheduled_time text
  check (scheduled_time is null or scheduled_time ~ '^[0-2][0-9]:[0-5][0-9]$');
