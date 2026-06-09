-- =============================================================================
-- 0033 — Idioma preferido da aluna (i18n UI)
-- =============================================================================
-- Permite que a aluna escolha o idioma da interface do app (PT-BR, EN, ES).
-- Conteudo externo (WhatsApp, emails, agentes, aulas) segue em PT-BR.
-- Default 'pt-BR' garante zero impacto em quem ja usa o app.
-- =============================================================================

alter table public.profiles
  add column if not exists language text not null default 'pt-BR'
  check (language in ('pt-BR', 'en', 'es'));

create index if not exists profiles_language_idx on public.profiles (language);
