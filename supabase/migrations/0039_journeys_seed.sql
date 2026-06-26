-- =============================================================================
-- 0039 — Seed das 3 jornadas + 15 badges base
-- =============================================================================
-- 3 jornadas placeholder (admin edita depois com aulas reais).
-- 1 aula placeholder em cada pra dar tela funcional na primeira navegacao.
-- 15 badges base do catalogo (icon_url null por enquanto — admin sobe sprites).
--
-- Todas em is_admin_only=true (beta interno). Pra liberar pras alunas:
--   UPDATE journeys SET is_admin_only = false WHERE slug = 'jornada-1-bebe';
-- =============================================================================

-- ---------------------------------------------------------------------------
-- JORNADAS
-- ---------------------------------------------------------------------------
insert into public.journeys (slug, title, subtitle, description, character_stage,
                              character_name, hero_color_a, hero_color_b, order_index,
                              xp_required, is_published, is_admin_only)
values
  ('jornada-1-bebe',
   'Jornada 1 — Primeiros passos',
   'O começo de tudo',
   'Você acabou de chegar no TikTok Shop. Vamos aprender o essencial juntas: configurar conta, escolher primeiro produto, gravar o primeiro vídeo.',
   'bebe', 'Lila', '#fdb4c2', '#ffd6a8', 100, 0, true, true),

  ('jornada-2-adolescente',
   'Jornada 2 — Vendendo de verdade',
   'Bora pra primeira venda',
   'Agora que você já posta, vamos focar em conversão. Hooks, CTAs, lives, ranking de produtos.',
   'adolescente', 'Maya', '#d4a8ff', '#fdb4c2', 200, 100, true, true),

  ('jornada-3-adulta',
   'Jornada 3 — Escalando o negócio',
   'Multiplicando resultados',
   'Você já vende. Hora de profissionalizar: rotina, gestão, equipe, escalada via lives e parcerias.',
   'adulta', 'Sofia', '#ffd6a8', '#d4a8ff', 300, 300, true, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 1 AULA PLACEHOLDER por jornada (admin substitui)
-- ---------------------------------------------------------------------------
insert into public.journey_lessons (journey_id, slug, title, description, kind,
                                     body_md, order_index, xp_reward, requires_proof,
                                     map_x, map_y, is_published)
select j.id, 'aula-boas-vindas',
       'Boas-vindas à Jornada ' || j.title,
       'Aula placeholder. Admin edita em /admin/jornadas.',
       'rich',
       E'## Bem-vinda! 💕\n\nEssa é uma aula placeholder. O admin vai substituir pelo conteúdo real em breve.\n\nMarque como concluída pra avançar.',
       100, 10, false, 20, 50, true
from public.journeys j
where not exists (
  select 1 from public.journey_lessons l
  where l.journey_id = j.id and l.slug = 'aula-boas-vindas'
);

-- ---------------------------------------------------------------------------
-- BADGES (15 base do catalogo)
-- ---------------------------------------------------------------------------
insert into public.badges (slug, title, description, criteria_json, xp_bonus, rarity, is_active)
values
  ('primeira-aula', 'Primeira aula', 'Completou sua primeira aula',
   '{"kind":"lesson_complete","count":1}'::jsonb, 5, 'common', true),

  ('primeira-jornada', 'Primeira jornada', 'Completou a Jornada 1',
   '{"kind":"journey_complete","journey_index":1}'::jsonb, 25, 'rare', true),

  ('trilogia', 'Trilogia completa', 'Completou as 3 jornadas',
   '{"kind":"journey_complete","count":3}'::jsonb, 100, 'legendary', true),

  ('primeira-venda', 'Primeira venda', 'Sua primeira prova aprovada',
   '{"kind":"proof_approved","count":1}'::jsonb, 50, 'rare', true),

  ('vendedora-100', 'Vendedora R$100', 'Provas somadas atingiram R$100',
   '{"kind":"proof_sum","threshold":100}'::jsonb, 30, 'epic', true),

  ('vendedora-1000', 'Vendedora R$1.000', 'Provas somadas atingiram R$1.000',
   '{"kind":"proof_sum","threshold":1000}'::jsonb, 150, 'legendary', true),

  ('comentarista', 'Comentarista', 'Postou 10 comentários',
   '{"kind":"comment_count","threshold":10}'::jsonb, 10, 'common', true),

  ('popular', 'Popular', 'Recebeu 50 likes nos comentários',
   '{"kind":"likes_received","threshold":50}'::jsonb, 25, 'rare', true),

  ('madrugadora', 'Madrugadora', 'Completou aula entre 5h e 7h BRT',
   '{"kind":"lesson_time","hour_min":5,"hour_max":7}'::jsonb, 10, 'common', true),

  ('coruja', 'Coruja', 'Completou aula após 23h BRT',
   '{"kind":"lesson_time","hour_min":23,"hour_max":24}'::jsonb, 10, 'common', true),

  ('maratonista', 'Maratonista', 'Completou 5 aulas em 1 dia',
   '{"kind":"daily_lessons","threshold":5}'::jsonb, 25, 'rare', true),

  ('consistente', 'Consistente', '7 dias seguidos com aula completa',
   '{"kind":"streak_days","threshold":7}'::jsonb, 50, 'epic', true),

  ('adolescente', 'Adolescente', 'Atingiu o stage adolescente',
   '{"kind":"stage_reached","stage":"adolescente"}'::jsonb, 30, 'rare', true),

  ('adulta', 'Adulta', 'Atingiu o stage adulta',
   '{"kind":"stage_reached","stage":"adulta"}'::jsonb, 75, 'epic', true),

  ('pioneira', 'Pioneira', 'Entre as 50 primeiras a usar a feature',
   '{"kind":"pioneer","threshold":50}'::jsonb, 100, 'legendary', true)
on conflict (slug) do nothing;
