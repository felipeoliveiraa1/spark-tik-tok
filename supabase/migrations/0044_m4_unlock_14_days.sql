-- =============================================================================
-- 0044 — M4 da Jornada 1: 7 dias -> 14 dias (2 semanas)
-- =============================================================================
-- User pediu unlock do M4 ("Semana 2 — Ao Vivo") em 2 semanas em vez de 1.
-- Spec original do programa eh 4 semanas, semana 1 = M1+M2+M3, semana 2 vira
-- a aula ao vivo. 14 dias da `journey_progress.started_at` da aluna.
--
-- Idempotente. Match por slug.
-- =============================================================================

update public.journey_modules m
set unlock_days_after_start = 14,
    description = 'Modulo gravado ao vivo na Semana 2: atrair seguidores, estrutura de video, copywriting, live shop e tipos de live. Libera 14 dias depois que voce comeca a Jornada.'
from public.journeys j
where m.journey_id = j.id
  and j.slug = 'jornada-1-bebe'
  and m.slug = 'atraindo-seguidores';
