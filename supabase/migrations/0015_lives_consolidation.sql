-- =============================================================================
-- 0015 — Consolida Lives: move replays do Modulo 7 (education) pra live_events
-- =============================================================================
-- Decisao: lives reais vivem na tabela live_events (que ja existe pra agendar
-- encontros). O Modulo 7 ("Lives") que tinha sido criado no seed 0014 ficou
-- duplicando essa responsabilidade. Aqui:
--
--   1) Inserimos as 3 lives com YT ID que o Felipe entregou direto em
--      live_events (com starts_at correto, fuso BR -03).
--   2) Removemos o Modulo 7 e suas 5 aulas (3 ja viram replays via #1, e 2
--      eram placeholders rich sem YT que o Felipe vai cadastrar via
--      /admin/ao-vivo quando tiver o link).
--
-- Idempotente: ON CONFLICT no insert + DELETE com subquery condicional.
-- =============================================================================

-- ============================================================================
-- 1) Insere as lives reais como events
-- ============================================================================
-- Horario padrao: 19h00 BR (-03 UTC offset). Felipe pode ajustar via
-- /admin/ao-vivo se algum horario estiver diferente.

insert into public.live_events
  (slug, title, description, cover_url, youtube_id, starts_at, duration_minutes, is_published)
values
  ('live-estrategias-validadas-29-04',
   'Estratégias Validadas + Análise de Perfil',
   'Análises ao vivo de perfis das alunas e as estratégias que mais funcionaram.',
   null,
   'H0O8mWIsEfY',
   '2026-04-29 22:00:00+00',  -- 19h BR
   60,
   true),

  ('live-2mil-seguidores-06-05',
   'Como ter 2 mil seguidores · novidades, ferramentas, estratégias',
   'Passo a passo pra crescer de 0 a 2k em ritmo consistente. Novidades da plataforma.',
   null,
   'DKcUtQkOSl0',
   '2026-05-06 22:00:00+00',
   60,
   true),

  ('live-como-criar-conexao-13-05',
   'Como Criar Conexão',
   'Conexão emocional com a audiência — o que toda criadora de sucesso faz e ninguém percebe.',
   null,
   'J7hwa6h8uIo',
   '2026-05-13 22:00:00+00',
   60,
   true)
on conflict (slug) do nothing;

-- ============================================================================
-- 2) Remove Modulo 7 (lives-arquivo) e suas 5 aulas
-- ============================================================================
-- As 3 lives com YT ja viraram live_events (acima).
-- As 2 placeholders (vitrine 17/04 e desafio 10/05) sao descartadas — Felipe
-- cadastra pelo /admin/ao-vivo quando tiver o link real.
-- Tambem remove progresso de aluna (CASCADE pelo ON DELETE da FK).

delete from public.education_videos
  where module_id = (select id from public.education_modules where slug = 'lives-arquivo');

delete from public.education_modules where slug = 'lives-arquivo';
