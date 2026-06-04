-- =============================================================================
-- 0031 — Progresso de lives (similar a education_progress, mas pra live_events)
-- =============================================================================
-- Aluna marca uma live como "assistida" (replay). Permite trackear quem
-- consumiu cada live alem do agendamento original.
-- =============================================================================

create table if not exists public.live_progress (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  live_id     uuid not null references public.live_events(id) on delete cascade,
  completed   boolean not null default false,
  watched_at  timestamptz not null default now(),
  primary key (user_id, live_id)
);

create index if not exists live_progress_user_idx
  on public.live_progress (user_id, watched_at desc);

create index if not exists live_progress_live_idx
  on public.live_progress (live_id);

-- RLS — aluna so ve/escreve seu proprio progresso
alter table public.live_progress enable row level security;

drop policy if exists "live_progress_owner_select" on public.live_progress;
create policy "live_progress_owner_select" on public.live_progress
  for select using (auth.uid() = user_id);

drop policy if exists "live_progress_owner_insert" on public.live_progress;
create policy "live_progress_owner_insert" on public.live_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "live_progress_owner_update" on public.live_progress;
create policy "live_progress_owner_update" on public.live_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "live_progress_owner_delete" on public.live_progress;
create policy "live_progress_owner_delete" on public.live_progress
  for delete using (auth.uid() = user_id);

-- Admin tudo (service role bypassa, mas deixo policy explicita)
drop policy if exists "live_progress_admin_all" on public.live_progress;
create policy "live_progress_admin_all" on public.live_progress
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

comment on table public.live_progress is
  'Marca quais lives (live_events) cada aluna ja assistiu. Equivalente a education_progress pra aulas.';
