-- =============================================================================
-- 0028 — Opt-in WhatsApp: aluna controla se quer receber mensagens
-- =============================================================================
-- Por padrao TRUE (todas recebem). Aluna desativa em /conta se quiser parar.
-- Triggers e blasts respeitam essa flag — se false, sao pulados.
-- =============================================================================

alter table public.profiles
  add column if not exists whatsapp_opt_in boolean not null default true;

create index if not exists profiles_whatsapp_opt_in_idx
  on public.profiles (whatsapp_opt_in)
  where whatsapp_opt_in = true;

comment on column public.profiles.whatsapp_opt_in is
  'Aluna quer receber mensagens WhatsApp (motivacionais/triggers). Default true. Aluna desativa em /conta.';
