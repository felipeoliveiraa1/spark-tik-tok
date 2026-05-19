-- =============================================================================
-- Spark — Encontros ao vivo (lives) integrados com YouTube Live
--
-- Aline cria a live no YouTube (pelo app/studio). Admin cadastra o evento
-- aqui com o video_id + data/hora. O app:
--   - antes do horário: mostra countdown
--   - durante: embed do YouTube Live + chat
--   - depois: vira replay automaticamente (mesmo video_id continua válido)
--
-- O vídeo em si fica armazenado no YouTube (grátis). Aqui só guardamos
-- o card de metadados pra organizar.
-- =============================================================================

create table if not exists public.live_events (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  description     text,
  cover_url       text,
  youtube_id      text not null,                      -- video ID da live YouTube
  starts_at       timestamptz not null,               -- quando começa
  ends_at         timestamptz,                        -- opcional (estimativa)
  duration_minutes int,
  is_published    boolean not null default true,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists live_events_starts_at_idx
  on public.live_events (is_published, starts_at desc);

create index if not exists live_events_slug_idx
  on public.live_events (slug);

alter table public.live_events enable row level security;

-- Alunas leem só lives publicadas
drop policy if exists "live_events_read_published" on public.live_events;
create policy "live_events_read_published" on public.live_events
  for select using (is_published = true);

-- Admin lê tudo (rascunhos)
drop policy if exists "live_events_admin_read_all" on public.live_events;
create policy "live_events_admin_read_all" on public.live_events
  for select using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin')
  );

-- Admin pode tudo
drop policy if exists "live_events_admin_write" on public.live_events;
create policy "live_events_admin_write" on public.live_events
  for all
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================================
-- live_attendance — quem assistiu a quê (replay ou ao vivo)
-- ============================================================================

create table if not exists public.live_attendance (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  live_id     uuid not null references public.live_events(id) on delete cascade,
  watched_at  timestamptz not null default now(),
  watched_live boolean not null default false,        -- true se foi durante a transmissão
  primary key (user_id, live_id)
);

create index if not exists live_attendance_user_idx
  on public.live_attendance (user_id, watched_at desc);

alter table public.live_attendance enable row level security;

drop policy if exists "live_attendance_owner" on public.live_attendance;
create policy "live_attendance_owner" on public.live_attendance
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
