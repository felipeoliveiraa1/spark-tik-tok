-- =============================================================================
-- Spark — transcrição + auto-criação de produto a partir de viral salvo
--
-- Hoje a transcrição vive em viral_transcriptions (cache global do scraper)
-- mas o saved_virals da aluna não tem cópia. Quando ela revisita o card,
-- precisa re-fetchar (que pode falhar se o vídeo saiu do feed).
--
-- Esta migration:
--  - Adiciona `transcription` em saved_virals (denormalizado pra UX rápido)
--  - Adiciona `caption_full` redundante pra garantir histórico completo
--  - Garante que product_id em saved_virals fica linkado ao produto que o
--    save_viral cria automaticamente.
-- =============================================================================

alter table public.saved_virals
  add column if not exists transcription text,
  add column if not exists transcription_fetched_at timestamptz;

create index if not exists saved_virals_product_id_idx
  on public.saved_virals (product_id) where product_id is not null;
