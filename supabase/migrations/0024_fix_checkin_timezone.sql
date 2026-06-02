-- =============================================================================
-- 0024 — Corrige bug de timezone em daily_completions + habit_checkins
-- =============================================================================
-- Codigo antigo usava new Date().toISOString().slice(0, 10) que retorna data
-- em UTC. Quando aluna concluia rotina apos 21h BRT (= 00h UTC do dia
-- seguinte), o campo `date` era salvo como o dia UTC seguinte ao real BR.
--
-- Resultado: no dia seguinte de manha, o app pegava today_utc, encontrava
-- completion gravado, e mostrava 'voce ja bateu hoje' sem ela ter feito nada.
--
-- Esse SQL recalcula a date correta usando o timestamp real do momento
-- (completed_at / created_at) convertido pro fuso America/Sao_Paulo.
-- NOT EXISTS protege contra colisao de PK (caso raro de aluna ter 2 entries
-- pra mesma data).
-- =============================================================================

UPDATE public.daily_completions
SET date = (completed_at AT TIME ZONE 'America/Sao_Paulo')::date
WHERE date <> (completed_at AT TIME ZONE 'America/Sao_Paulo')::date
  AND NOT EXISTS (
    SELECT 1 FROM public.daily_completions d2
    WHERE d2.user_id = daily_completions.user_id
      AND d2.date = (daily_completions.completed_at AT TIME ZONE 'America/Sao_Paulo')::date
  );

UPDATE public.habit_checkins
SET date = (created_at AT TIME ZONE 'America/Sao_Paulo')::date
WHERE date <> (created_at AT TIME ZONE 'America/Sao_Paulo')::date
  AND NOT EXISTS (
    SELECT 1 FROM public.habit_checkins h2
    WHERE h2.user_id = habit_checkins.user_id
      AND h2.habit_id = habit_checkins.habit_id
      AND h2.date = (habit_checkins.created_at AT TIME ZONE 'America/Sao_Paulo')::date
  );
