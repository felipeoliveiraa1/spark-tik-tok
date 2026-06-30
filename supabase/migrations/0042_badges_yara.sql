-- =============================================================================
-- 0042 — Catalogo de selos Metodo TTS (spec Yara)
-- =============================================================================
-- Spec Yara define 6 selos progressivos pela jornada:
--   Iniciante      — primeira aula completada
--   Criadora       — desbloqueou o Modulo 4 (completou M1+M2+M3 da J1)
--   Consistente    — passou na prova final (Boss Fight)
--   Afiliada       — passou na prova final
--   Vendedora      — passou na prova final E provou vendas > 0
--   ELITE TTS      — passou na prova final (rarity legendary)
--
-- O badge 'consistente' antigo do seed 0039 era "7 dias seguidos com aula"
-- (kind=streak_days). Conflito de slug: renomeado pra 'streak-7-dias'
-- preservando criteria + user_badges existentes (FK e por id, nao slug).
--
-- 2 kinds novos no badge-engine:
--   modules_complete — todas aulas de N modulos de uma jornada concluidas
--   proof_with_sales — prova aprovada com ocr_detected_sales >= threshold
--
-- Idempotente. on conflict (slug) do update — sobrescreve criteria/copy.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Renomeia o 'consistente' antigo pra 'streak-7-dias' (libera slug)
-- ---------------------------------------------------------------------------
update public.badges
set slug = 'streak-7-dias',
    title = '7 Dias de Streak',
    description = 'Completou aula 7 dias seguidos.'
where slug = 'consistente'
  and criteria_json->>'kind' = 'streak_days';

-- ---------------------------------------------------------------------------
-- 2) Insere os 6 selos novos do spec Yara
-- ---------------------------------------------------------------------------
insert into public.badges (slug, title, description, criteria_json, xp_bonus, rarity, is_active)
values
  ('iniciante',
   'Iniciante',
   'Você começou! Primeira aula concluída. Bora pra próxima ✨',
   '{"kind":"lesson_complete","count":1}'::jsonb,
   10, 'common', true),

  ('criadora',
   'Criadora',
   'Você terminou os 3 módulos da Semana 1 (Fundamentos + Rotina + Mentalidade). Bora pra Semana 2!',
   '{"kind":"modules_complete","journey_slug":"jornada-1-bebe","module_slugs":["organizando-a-casa","rotina-de-milhoes","mentalidade-blindada"]}'::jsonb,
   75, 'epic', true),

  ('consistente',
   'Consistente',
   'Você chegou no fim da Jornada 1. Persistência é o seu superpoder.',
   '{"kind":"proof_approved","count":1}'::jsonb,
   50, 'rare', true),

  ('afiliada',
   'Afiliada',
   'Sua prova foi aprovada — você é oficialmente uma afiliada do Método TTS 💕',
   '{"kind":"proof_approved","count":1}'::jsonb,
   50, 'rare', true),

  ('vendedora',
   'Vendedora',
   'Você vendeu! Não é mais teoria — é resultado.',
   '{"kind":"proof_with_sales","min_sales":0.01}'::jsonb,
   100, 'epic', true),

  ('elite-tts',
   'ELITE TTS',
   'Top do top — você passou na prova final e entrou pro grupo de Elite do Método TTS.',
   '{"kind":"proof_approved","count":1}'::jsonb,
   150, 'legendary', true)

on conflict (slug) do update
  set title = excluded.title,
      description = excluded.description,
      criteria_json = excluded.criteria_json,
      xp_bonus = excluded.xp_bonus,
      rarity = excluded.rarity,
      is_active = excluded.is_active;
