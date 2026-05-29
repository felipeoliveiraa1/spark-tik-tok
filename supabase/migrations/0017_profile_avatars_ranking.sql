-- =============================================================================
-- 0017 — Perfil expandido + Storage de avatars + tracking de faturamento
-- =============================================================================
-- Fundacao pro sistema de ranking (com peso duplo: faturamento + checkin).
-- Adiciona campos sociais/meta no profile, cria tabela de revenue mensal e
-- bucket publico de avatars com RLS owner-only.
--
-- Ranking eh opt-in (privacidade) — aluna escolhe se quer aparecer.
-- =============================================================================

-- ============================================================================
-- 1) PROFILES — campos extras pra perfil rico + ranking
-- ============================================================================

alter table public.profiles
  add column if not exists avatar_url       text,
  add column if not exists bio              text,
  add column if not exists instagram_handle text,
  add column if not exists tiktok_handle    text,
  add column if not exists cidade_uf        text,
  add column if not exists meta_mensal_brl  numeric(10,2),
  add column if not exists ranking_opt_in   boolean not null default false;

-- ============================================================================
-- 2) MONTHLY_REVENUE — faturamento mensal registrado pela aluna
-- ============================================================================

create table if not exists public.monthly_revenue (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  year_month   text not null check (year_month ~ '^[0-9]{4}-[0-9]{2}$'),  -- "2026-05"
  amount_brl   numeric(10,2) not null default 0,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, year_month)
);

create index if not exists monthly_revenue_user_idx
  on public.monthly_revenue (user_id, year_month desc);

alter table public.monthly_revenue enable row level security;

drop policy if exists "monthly_revenue_owner" on public.monthly_revenue;
create policy "monthly_revenue_owner" on public.monthly_revenue
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Pra ranking precisar ler de outras alunas, criamos policy especifica
-- que respeita o opt-in delas via JOIN com profiles.
drop policy if exists "monthly_revenue_ranking_read" on public.monthly_revenue;
create policy "monthly_revenue_ranking_read" on public.monthly_revenue
  for select using (
    user_id in (
      select id from public.profiles where ranking_opt_in = true
    )
  );

create or replace function public.touch_monthly_revenue_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists monthly_revenue_touch on public.monthly_revenue;
create trigger monthly_revenue_touch
  before update on public.monthly_revenue
  for each row execute function public.touch_monthly_revenue_updated_at();

-- ============================================================================
-- 3) RANKING — policy pra ler profiles publicos das que estao no ranking
-- ============================================================================
-- A API de ranking precisa ler nome/avatar/cidade de outras alunas que
-- optaram por aparecer. Policy permissiva de SELECT pra esses campos quando
-- ranking_opt_in = true.

drop policy if exists "profiles_ranking_public_read" on public.profiles;
create policy "profiles_ranking_public_read" on public.profiles
  for select using (
    ranking_opt_in = true
    or id = auth.uid()
  );

-- ============================================================================
-- 4) STORAGE — bucket avatars publico, RLS owner-only pra writes
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Read: qualquer um (inclusive nao logado, pra avatars aparecerem em
-- contextos como ranking publico no futuro)
drop policy if exists "avatars_read_all" on storage.objects;
create policy "avatars_read_all" on storage.objects
  for select using (bucket_id = 'avatars');

-- Write: so o dono do folder (folder = auth.uid())
drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
