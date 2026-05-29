-- =============================================================================
-- 0013 — Educação: Módulos + Aulas (multi-kind: video, rich, checklist)
-- =============================================================================
-- Repagina a Educação de "lista plana de videos" pra "modulos com aulas
-- internas". Cada aula tem um `kind`:
--   - video      → YouTube embed (campo youtube_id)
--   - rich       → Conteudo markdown editorial nativo (campo body_md)
--   - checklist  → Lista interativa com itens (campo checklist_items jsonb)
--
-- Decisao de design: nada de PDFs/DOCXs pra baixar — todo conteudo virou
-- aula nativa dinamica dentro do app, com tipografia magazine premium e,
-- no caso de checklist, marcacao por aluna persistida em outra tabela.
-- =============================================================================

-- ============================================================================
-- 1) MODULES
-- ============================================================================

create table if not exists public.education_modules (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  subtitle      text,                              -- 1 linha curta abaixo do titulo
  description   text,                              -- paragrafo longo de descricao
  cover_url     text,                              -- imagem de capa
  accent        text,                              -- ex: "rose", "peach", "lilac" pro tema visual
  order_index   int not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists education_modules_order_idx
  on public.education_modules (is_published, order_index);

create index if not exists education_modules_slug_idx
  on public.education_modules (slug);

alter table public.education_modules enable row level security;

drop policy if exists "education_modules_read_all" on public.education_modules;
create policy "education_modules_read_all" on public.education_modules
  for select using (true);

drop policy if exists "education_modules_admin_write" on public.education_modules;
create policy "education_modules_admin_write" on public.education_modules
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
-- 2) LESSONS — estende education_videos com module_id + kind + body_md
-- ============================================================================
-- Mantemos o nome da tabela como `education_videos` por compatibilidade
-- com APIs e tipos. Mas conceitualmente agora ela representa "aulas" de
-- qualquer tipo (video, rich, checklist), nao so videos.

alter table public.education_videos
  add column if not exists module_id uuid
    references public.education_modules(id) on delete set null;

alter table public.education_videos
  add column if not exists kind text not null default 'video'
    check (kind in ('video', 'rich', 'checklist'));

alter table public.education_videos
  add column if not exists body_md text;

alter table public.education_videos
  add column if not exists checklist_items jsonb;

-- Libera youtube_id de NOT NULL (aulas rich/checklist nao tem YT)
alter table public.education_videos
  alter column youtube_id drop not null;

-- Indice composto pra listar aulas de um modulo na ordem
create index if not exists education_videos_module_order_idx
  on public.education_videos (module_id, order_index)
  where is_published = true;

-- ============================================================================
-- 3) CHECKLIST STATE — marcacao por aluna nos itens do checklist
-- ============================================================================
-- Item_index 0-based do array checklist_items da aula. Quando a aula nao
-- e mais checklist ou o array muda, os states antigos ficam "orfaos" mas
-- nao quebram nada (UI ignora indices > length).

create table if not exists public.lesson_check_states (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_id    uuid not null references public.education_videos(id) on delete cascade,
  item_index   int not null check (item_index >= 0),
  checked      boolean not null default false,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_id, item_index)
);

create index if not exists lesson_check_states_user_idx
  on public.lesson_check_states (user_id, lesson_id);

alter table public.lesson_check_states enable row level security;

drop policy if exists "lesson_check_states_owner" on public.lesson_check_states;
create policy "lesson_check_states_owner" on public.lesson_check_states
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- 4) TRIGGER pra atualizar updated_at em modules
-- ============================================================================

create or replace function public.touch_education_module_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists education_modules_touch on public.education_modules;
create trigger education_modules_touch
  before update on public.education_modules
  for each row execute function public.touch_education_module_updated_at();
