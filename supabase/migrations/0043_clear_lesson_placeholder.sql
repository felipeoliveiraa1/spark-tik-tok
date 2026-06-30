-- =============================================================================
-- 0043 — Limpa placeholder de body_md das aulas seedadas
-- =============================================================================
-- Migration 0040 seedou todas as aulas com:
--   body_md = '_Aula em produção. Yara vai preencher em breve._'
-- Quando 0041 adicionou youtube_id real, NAO limpou body_md. Resultado:
-- pagina da aula mostra video iframe + texto placeholder embaixo, confunde
-- aluna.
--
-- Fix: setar body_md=NULL onde for exatamente o placeholder. Nao afeta:
--   - Aulas M4 (live) com body_md "Aula ao vivo agendada..." (texto diferente)
--   - Aulas que admin/Yara ja preencheu manualmente via /admin
--
-- Idempotente. Match exato no texto.
-- =============================================================================

update public.journey_lessons
set body_md = null
where body_md = E'_Aula em produção. Yara vai preencher em breve._';
