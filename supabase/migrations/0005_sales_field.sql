-- =============================================================================
-- Spark — métrica "vendas" (sales) na pipeline de virais
--
-- O 3º bloco de métrica do card do Vyral (ícone laranja, classe css-1oa66e7)
-- é VENDAS de produto, não shares. Adicionamos coluna dedicada `sales` em
-- viral_videos e saved_virals + índice composto para o fallback DB-first.
-- A coluna `shares` continua existindo (histórico), mas o pipeline novo
-- não escreve mais nela.
-- =============================================================================

alter table public.viral_videos
  add column if not exists sales bigint default 0;

alter table public.saved_virals
  add column if not exists sales bigint;

-- Índice para o fallback DB-first quando o scraper falha:
-- "videos recentes, do país X, ordenados por vendas".
create index if not exists viral_videos_country_sales_idx
  on public.viral_videos (country, sales desc, last_seen_at desc);

-- Índice auxiliar para o filtro por nicho + sales (segunda janela de fallback).
create index if not exists viral_videos_niche_sales_idx
  on public.viral_videos (niche, sales desc, last_seen_at desc);
