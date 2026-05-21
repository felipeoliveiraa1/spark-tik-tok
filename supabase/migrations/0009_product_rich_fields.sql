-- Ficha de produto enriquecida: 7 colunas novas pra alimentar Scripts AI
-- sem precisar pedir contexto à aluna.
--
-- Decisão: jsonb pra arrays (igual aos campos antigos pain_points/strengths)
-- e text pra sazonalidade (1 frase). Tudo opcional na DB — a obrigatoriedade
-- vive no schema do save_product (Zod) pra forçar a IA a preencher.

alter table public.products
  add column if not exists differentiators    jsonb,
  add column if not exists objections         jsonb,
  add column if not exists emotional_triggers jsonb,
  add column if not exists usage_moments      jsonb,
  add column if not exists content_angles     jsonb,
  add column if not exists hook_ideas         jsonb,
  add column if not exists seasonality        text;
