-- =============================================================================
-- 0023 — Whatsapp no profile
-- =============================================================================
-- Coleta o numero de whatsapp da aluna pra contato e processamento manual
-- de compras. Vem do Customer.mobile do payload Kiwify ou input manual.
-- =============================================================================

alter table public.profiles
  add column if not exists whatsapp text;
