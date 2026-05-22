-- Tabela pra idempotência do webhook Kiwify. Eles podem reenviar o mesmo
-- evento (retry quando o servidor não responde 200 rápido), e a gente
-- não pode criar conta duplicada nem reativar plano várias vezes.
--
-- Strategy: antes de processar, INSERT (event_id). Se duplica, ignora.

create table if not exists public.kiwify_events (
  id            uuid primary key default gen_random_uuid(),
  event_id      text unique not null,           -- id único do evento Kiwify
  event_type    text not null,                  -- order_approved, subscription_renewed, etc
  order_id      text,
  customer_email text,
  payload       jsonb not null,                 -- payload bruto pra auditoria
  processed_at  timestamptz not null default now()
);

create index if not exists kiwify_events_email_idx on public.kiwify_events (customer_email, processed_at desc);
create index if not exists kiwify_events_type_idx on public.kiwify_events (event_type, processed_at desc);

-- RLS: só service_role acessa. Anon/authenticated bloqueados — webhook
-- roda com service role key.
alter table public.kiwify_events enable row level security;
-- Sem policies = ninguém via PostgREST consegue ler. service_role bypassa RLS.

comment on table public.kiwify_events is
  'Eventos recebidos do webhook Kiwify. Usado pra idempotência e auditoria.';
