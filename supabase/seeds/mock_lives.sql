-- =============================================================================
-- Seed mock — Lives ao vivo (1 ao vivo + 2 futuras + 2 replays)
--
-- Roda no Supabase Studio → SQL Editor → cola tudo → Run.
-- Pra limpar: DELETE FROM live_events WHERE slug LIKE 'mock-%';
-- =============================================================================

insert into public.live_events
  (slug, title, description, youtube_id, starts_at, ends_at, duration_minutes, is_published)
values
-- AO VIVO AGORA (começou há 30 min, dura 1h30)
('mock-aovivo-qa-julho',
 'Q&A com a Yara: dúvidas de quem tá começando no TikTok Shop',
 E'Trazendo respostas pras 10 dúvidas mais comuns de quem tá entrando agora. \n\n- Comissões e impostos\n- Cadastro de produto\n- Frete e logística\n- Erros que mais derrubam vídeo',
 'dQw4w9WgXcQ',
 now() - interval '30 minutes',
 now() + interval '60 minutes',
 90, true),

-- UPCOMING (em 3h)
('mock-aovivo-hooks-vendas',
 'Live especial: 30 hooks que estão vendendo em 2026',
 'Vamos abrir o painel ao vivo e analisar 30 hooks que tão bombando AGORA no nicho de beleza e suplemento. Traz papel e caneta. 💕',
 'jNQXAC9IVRw',
 now() + interval '3 hours',
 null,
 60, true),

-- UPCOMING (em 2 dias)
('mock-aovivo-estrategia-funil',
 'Funil completo: do primeiro vídeo à primeira venda recorrente',
 E'Aula prática mostrando o funil que minhas alunas usam. Vou montar do zero ao vivo.\n\n- Captação\n- Aquecimento\n- Conversão\n- Pós-venda (essencial pra repetir)',
 '9bZkp7q19f0',
 now() + interval '2 days',
 null,
 90, true),

-- REPLAY (10 dias atrás)
('mock-aovivo-tendencias-junho',
 'Tendências de junho — o que tá pegando no TikTok Shop',
 'Live de fechamento de mês comentando os 5 produtos que mais venderam em junho e o porquê.',
 'kJQP7kiw5Fk',
 now() - interval '10 days',
 now() - interval '10 days' + interval '90 minutes',
 90, true),

-- REPLAY (1 mês atrás)
('mock-aovivo-erros-comuns',
 'Os 7 erros que matam vídeo de criadora iniciante',
 'Replay da live de maio. Análise dos erros que fazem o vídeo não passar dos 200 views.',
 'tgbNymZ7vqY',
 now() - interval '30 days',
 now() - interval '30 days' + interval '60 minutes',
 60, true);
