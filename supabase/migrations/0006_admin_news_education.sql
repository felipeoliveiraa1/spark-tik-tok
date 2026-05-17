-- =============================================================================
-- Spark — roles + CRUD admin de News + nova feature Educação (videoaulas YouTube)
--
-- 1) Adiciona role em profiles ('user' | 'admin') pra Felipe/Aline gerenciarem.
-- 2) Habilita writes em news pela UI admin (RLS) + bucket news-covers.
-- 3) Cria tabela education_videos (embeds do YouTube — sem upload).
-- 4) Cria education_progress pra marcar aulas assistidas (bônus).
-- =============================================================================

-- ============================================================================
-- 1. ROLE em profiles
-- ============================================================================

alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user','admin'));

-- ============================================================================
-- 2. NEWS — habilita writes pra admin via UI
-- ============================================================================

drop policy if exists "news_admin_write" on public.news;
create policy "news_admin_write" on public.news
  for all
  using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin')
  );

-- Bucket pra capas de news (admin upload, todos leem)
insert into storage.buckets (id, name, public)
values ('news-covers', 'news-covers', true)
on conflict (id) do nothing;

drop policy if exists "news_covers_read" on storage.objects;
create policy "news_covers_read" on storage.objects
  for select using (bucket_id = 'news-covers');

drop policy if exists "news_covers_admin_write" on storage.objects;
create policy "news_covers_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'news-covers'
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "news_covers_admin_update" on storage.objects;
create policy "news_covers_admin_update" on storage.objects
  for update using (
    bucket_id = 'news-covers'
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "news_covers_admin_delete" on storage.objects;
create policy "news_covers_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'news-covers'
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================================
-- 3. EDUCATION_VIDEOS — videoaulas (embeds do YouTube)
-- ============================================================================

create table if not exists public.education_videos (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  description     text,
  category        text,                       -- ex: "Começando", "Funil", "Edição"
  -- YouTube — armazenamos só o ID (11 chars) e derivamos URL/thumb no client.
  -- Aceita URL completa também (ex https://youtu.be/abc), o admin UI extrai
  -- o ID antes de salvar.
  youtube_id      text not null,
  cover_url       text,                       -- opcional; default: thumbnail YouTube
  duration_seconds int,                       -- opcional; admin pode preencher
  order_index     int not null default 0,     -- ordena dentro da categoria
  is_published    boolean not null default true,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists education_videos_order_idx
  on public.education_videos (is_published, category, order_index);

create index if not exists education_videos_slug_idx
  on public.education_videos (slug);

alter table public.education_videos enable row level security;

-- Alunas leem só o que tá publicado
drop policy if exists "education_read_published" on public.education_videos;
create policy "education_read_published" on public.education_videos
  for select using (is_published = true);

-- Admin lê tudo
drop policy if exists "education_admin_read_all" on public.education_videos;
create policy "education_admin_read_all" on public.education_videos
  for select using (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin')
  );

-- Admin pode tudo
drop policy if exists "education_admin_write" on public.education_videos;
create policy "education_admin_write" on public.education_videos
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
-- 4. EDUCATION_PROGRESS — quem assistiu o quê
-- ============================================================================

create table if not exists public.education_progress (
  user_id           uuid not null references public.profiles(id) on delete cascade,
  video_id          uuid not null references public.education_videos(id) on delete cascade,
  watched_at        timestamptz not null default now(),
  progress_seconds  int not null default 0,
  completed         boolean not null default false,
  primary key (user_id, video_id)
);

create index if not exists education_progress_user_idx
  on public.education_progress (user_id, watched_at desc);

alter table public.education_progress enable row level security;

drop policy if exists "education_progress_owner" on public.education_progress;
create policy "education_progress_owner" on public.education_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
