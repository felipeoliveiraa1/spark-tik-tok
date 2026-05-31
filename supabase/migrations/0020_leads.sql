-- =============================================================================
-- 0020 — Leads (captacao via /formulario publico)
-- =============================================================================
-- Pagina /formulario fica aberta pra qualquer um (linkada na bio do TikTok).
-- Aluna em potencial responde: nome, telefone, @ tiktok, se ja vende, e se
-- sim qual o faturamento. Salva aqui pra time de vendas trabalhar.
--
-- status: 'new' | 'contacted' | 'converted' | 'dismissed'
-- revenue_range: 'ate_5k' | 'de_5k_a_20k' | 'de_20k_a_50k' | 'acima_50k'
-- =============================================================================

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null check (length(nome) between 2 and 120),
  telefone        text not null check (length(telefone) between 8 and 30),
  tiktok_handle   text not null check (length(tiktok_handle) between 2 and 60),
  already_selling boolean not null,
  revenue_range   text check (revenue_range in (
    'ate_5k', 'de_5k_a_20k', 'de_20k_a_50k', 'acima_50k'
  )),
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  ip              text,
  user_agent      text,
  status          text not null default 'new'
                  check (status in ('new', 'contacted', 'converted', 'dismissed')),
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists leads_status_created_idx
  on public.leads (status, created_at desc);
create index if not exists leads_already_selling_idx
  on public.leads (already_selling, created_at desc);

alter table public.leads enable row level security;

-- Insert publico (qualquer um pode criar lead — POST do form sem auth)
drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert" on public.leads
  for insert with check (true);

-- Admin le tudo e atualiza
drop policy if exists "leads_admin_read" on public.leads;
create policy "leads_admin_read" on public.leads
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "leads_admin_update" on public.leads;
create policy "leads_admin_update" on public.leads
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "leads_admin_delete" on public.leads;
create policy "leads_admin_delete" on public.leads
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create or replace function public.touch_leads_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch
  before update on public.leads
  for each row execute function public.touch_leads_updated_at();
