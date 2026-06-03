-- =============================================================================
-- 0026 — Aulas tipo "ebook" (PDF pra download)
-- =============================================================================
-- Adiciona um 4o kind de aula: 'ebook'. A aluna abre a aula, ve titulo +
-- descricao + capa opcional + botao grande "Baixar PDF". Sem leitor inline
-- — abre no leitor nativo do dispositivo (iOS Files, Android Drive).
--
-- Decisao de design (vide conversa Felipe 2026-06-02): MVP eh so download.
-- Se feedback pedir leitor in-app com bookmark, evolui depois usando
-- last_page em lesson_progress + pdf.js.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Schema: novas colunas + atualizar CHECK do kind
-- -----------------------------------------------------------------------------
alter table public.education_videos
  add column if not exists file_url text,
  add column if not exists file_name text,
  add column if not exists file_size_bytes bigint;

-- Atualiza o CHECK pra aceitar 'ebook' alem dos kinds existentes
alter table public.education_videos
  drop constraint if exists education_videos_kind_check;

alter table public.education_videos
  add constraint education_videos_kind_check
  check (kind in ('video', 'rich', 'checklist', 'ebook'));

-- -----------------------------------------------------------------------------
-- 2. Bucket lesson-ebooks
-- -----------------------------------------------------------------------------
-- public=true: leitura aberta (qualquer aluna logada baixa via URL publica).
-- Limite de tamanho: 100MB por PDF (configuravel no dashboard se precisar).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-ebooks',
  'lesson-ebooks',
  true,
  104857600, -- 100MB
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- 3. RLS no storage — admin write, todos leem
-- -----------------------------------------------------------------------------
drop policy if exists "lesson_ebooks_read" on storage.objects;
create policy "lesson_ebooks_read" on storage.objects
  for select using (bucket_id = 'lesson-ebooks');

drop policy if exists "lesson_ebooks_admin_write" on storage.objects;
create policy "lesson_ebooks_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'lesson-ebooks'
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "lesson_ebooks_admin_update" on storage.objects;
create policy "lesson_ebooks_admin_update" on storage.objects
  for update using (
    bucket_id = 'lesson-ebooks'
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "lesson_ebooks_admin_delete" on storage.objects;
create policy "lesson_ebooks_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'lesson-ebooks'
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'admin')
  );

-- -----------------------------------------------------------------------------
-- COMMENTS
-- -----------------------------------------------------------------------------
comment on column public.education_videos.file_url is
  'URL publica do PDF no bucket lesson-ebooks (kind=ebook). Null pros outros kinds.';
comment on column public.education_videos.file_name is
  'Nome original do arquivo enviado, usado como download filename.';
comment on column public.education_videos.file_size_bytes is
  'Tamanho do arquivo em bytes, exibido na UI ("12.4 MB").';
