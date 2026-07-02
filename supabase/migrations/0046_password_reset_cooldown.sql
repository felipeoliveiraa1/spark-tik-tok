-- =============================================================================
-- 0046 — Cooldown do "esqueci senha" (last_password_reset_at)
-- =============================================================================
-- Incidente: aluna clicou "esqueci senha" 5x seguidas em 3min e sistema
-- disparou 5 emails identicos (Maiara 2026-07-XX). Nao havia rate limit
-- no server action forgotPasswordAction (frontend/lib/auth.ts) — Supabase
-- default rate limit eh por IP e permissivo (~30/h).
--
-- Fix: coluna last_password_reset_at em profiles. Server action so
-- dispara resetPasswordForEmail se ultimo envio for > 120s atras.
-- Idempotente. Coluna nullable — usuarias antigas ficam null e podem
-- disparar 1 email imediato (comportamento correto).
-- =============================================================================

alter table public.profiles
  add column if not exists last_password_reset_at timestamptz;

comment on column public.profiles.last_password_reset_at is
  'Timestamp do ultimo email de reset senha enviado. Server action verifica antes de disparar novo (cooldown 120s). Nullable = nunca pediu reset.';
