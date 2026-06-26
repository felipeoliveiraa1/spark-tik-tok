-- =============================================================================
-- 0038 — Jornadas Método TTS (joguinho 2D pixel art com OCR de prova)
-- =============================================================================
-- 3 Jornadas sequenciais. Cada uma tem aulas (linear, completa em ordem).
-- Pra avancar de uma jornada pra proxima, aluna sobe print do TikTok Shop
-- provando vendas; sistema valida via OCR (Vision API):
--   conf >= 90 + sales > 0 -> auto_approved + 50 XP + badge "Primeira venda"
--   50 <= conf < 90        -> pending (fila admin revisar)
--   conf < 50              -> pending com flag "alta probabilidade fake"
--
-- Personagem evolui visualmente conforme completa jornadas:
--   0 completed -> bebe  (Jornada 1)
--   1 completed -> adolescente (Jornada 2)
--   2+ completed -> adulta (Jornada 3 +)
--
-- BETA INTERNO: flag is_admin_only POR JORNADA permite liberar Jornada 1
-- pras alunas enquanto 2 e 3 ficam em beta. Toggle: UPDATE journeys SET
-- is_admin_only = false WHERE slug = 'jornada-1-bebe'.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) JOURNEYS (parent)
-- ---------------------------------------------------------------------------
create table if not exists public.journeys (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null check (length(slug) between 1 and 80),
  title           text not null check (length(title) between 1 and 120),
  subtitle        text,
  description     text,
  character_stage text not null check (character_stage in ('bebe','adolescente','adulta')),
  character_name  text,
  hero_color_a    text,
  hero_color_b    text,
  background_url  text,
  order_index     int not null default 0,
  xp_required     int not null default 0,
  is_published    boolean not null default false,
  is_admin_only   boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists journeys_order_idx
  on public.journeys (order_index)
  where is_published = true;

comment on column public.journeys.is_admin_only is
  'Beta interno: quando true, so admin acessa. Toggle UPDATE pra liberar pras alunas.';

-- ---------------------------------------------------------------------------
-- 2) JOURNEY_LESSONS (aulas dentro da jornada)
-- ---------------------------------------------------------------------------
create table if not exists public.journey_lessons (
  id              uuid primary key default gen_random_uuid(),
  journey_id      uuid not null references public.journeys(id) on delete cascade,
  slug            text not null check (length(slug) between 1 and 80),
  title           text not null check (length(title) between 1 and 200),
  description     text,
  kind            text not null check (kind in ('video','rich','checklist','ebook')),
  youtube_id      text,
  body_md         text,
  checklist_items jsonb,
  file_url        text,
  file_name       text,
  file_size_bytes bigint,
  cover_url       text,
  order_index     int not null default 0,
  xp_reward       int not null default 10 check (xp_reward >= 0),
  requires_proof  boolean not null default false,
  map_x           int check (map_x is null or (map_x between 0 and 100)),
  map_y           int check (map_y is null or (map_y between 0 and 100)),
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (journey_id, slug)
);

create index if not exists journey_lessons_order_idx
  on public.journey_lessons (journey_id, order_index)
  where is_published = true;

-- ---------------------------------------------------------------------------
-- 3) JOURNEY_LESSON_PROGRESS (concluiu aula?)
-- ---------------------------------------------------------------------------
create table if not exists public.journey_lesson_progress (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  lesson_id      uuid not null references public.journey_lessons(id) on delete cascade,
  completed      boolean not null default false,
  completed_at   timestamptz,
  primary key (user_id, lesson_id)
);

create index if not exists jlp_user_idx
  on public.journey_lesson_progress (user_id, completed_at desc)
  where completed = true;

-- ---------------------------------------------------------------------------
-- 4) JOURNEY_COMMENTS (auto-aprovado, soft delete admin)
-- ---------------------------------------------------------------------------
create table if not exists public.journey_comments (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.journey_lessons(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  parent_id    uuid references public.journey_comments(id) on delete cascade,
  body         text not null check (length(body) between 1 and 2000),
  like_count   int not null default 0 check (like_count >= 0),
  status       text not null default 'visible' check (status in ('visible','hidden','flagged')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists journey_comments_lesson_idx
  on public.journey_comments (lesson_id, created_at desc)
  where status = 'visible';
create index if not exists journey_comments_parent_idx
  on public.journey_comments (parent_id)
  where parent_id is not null;

-- ---------------------------------------------------------------------------
-- 5) JOURNEY_COMMENT_LIKES
-- ---------------------------------------------------------------------------
create table if not exists public.journey_comment_likes (
  comment_id   uuid not null references public.journey_comments(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 6) JOURNEY_PROOFS (print TikTok Shop)
-- ---------------------------------------------------------------------------
create table if not exists public.journey_proofs (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  journey_id            uuid not null references public.journeys(id) on delete cascade,
  lesson_id             uuid references public.journey_lessons(id) on delete set null,
  image_path            text not null,
  file_name             text,
  file_size_bytes       bigint,
  ocr_text              text,
  ocr_confidence        numeric(5,2),
  ocr_detected_sales    numeric(10,2),
  status                text not null default 'pending'
                        check (status in ('pending','auto_approved','approved','rejected')),
  rejection_reason      text,
  reviewed_by           uuid references public.profiles(id) on delete set null,
  reviewed_at           timestamptz,
  created_at            timestamptz not null default now()
);

-- 1 prova aprovada por (user, journey) — vira "passou"
create unique index if not exists journey_proofs_one_approved
  on public.journey_proofs (user_id, journey_id)
  where status in ('approved','auto_approved');

create index if not exists journey_proofs_review_queue_idx
  on public.journey_proofs (status, created_at desc)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- 7) JOURNEY_PROGRESS (sumario por jornada)
-- ---------------------------------------------------------------------------
create table if not exists public.journey_progress (
  user_id           uuid not null references public.profiles(id) on delete cascade,
  journey_id        uuid not null references public.journeys(id) on delete cascade,
  current_lesson_id uuid references public.journey_lessons(id) on delete set null,
  xp_total          int not null default 0 check (xp_total >= 0),
  character_stage   text not null default 'bebe'
                    check (character_stage in ('bebe','adolescente','adulta')),
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  proof_id          uuid references public.journey_proofs(id) on delete set null,
  status            text not null default 'in_progress'
                    check (status in ('in_progress','completed')),
  primary key (user_id, journey_id)
);

create index if not exists journey_progress_user_idx
  on public.journey_progress (user_id, completed_at desc)
  where status = 'completed';

-- ---------------------------------------------------------------------------
-- 8) JOURNEY_XP_EVENTS (audit + dashboard)
-- ---------------------------------------------------------------------------
create table if not exists public.journey_xp_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in (
    'lesson_complete','comment_post','comment_liked','proof_approved','badge_earned','journey_complete'
  )),
  ref_id      uuid,
  xp_amount   int not null,
  created_at  timestamptz not null default now()
);

create index if not exists journey_xp_events_user_idx
  on public.journey_xp_events (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 9) BADGES (catalog)
-- ---------------------------------------------------------------------------
create table if not exists public.badges (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null check (length(slug) between 1 and 50),
  title         text not null,
  description   text,
  icon_url      text,
  criteria_json jsonb not null default '{}'::jsonb,
  xp_bonus      int not null default 0 check (xp_bonus >= 0),
  rarity        text not null default 'common'
                check (rarity in ('common','rare','epic','legendary')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10) USER_BADGES
-- ---------------------------------------------------------------------------
create table if not exists public.user_badges (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  badge_id   uuid not null references public.badges(id) on delete cascade,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index if not exists user_badges_user_idx
  on public.user_badges (user_id, earned_at desc);

-- ---------------------------------------------------------------------------
-- 11) JOURNEY_NOTIFICATIONS (in-app)
-- ---------------------------------------------------------------------------
create table if not exists public.journey_notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  icon_url    text,
  ref_url     text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists journey_notifications_unread_idx
  on public.journey_notifications (user_id, created_at desc)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- 12) RLS — admin tudo, aluna so o que eh dela
-- ---------------------------------------------------------------------------
alter table public.journeys enable row level security;
alter table public.journey_lessons enable row level security;
alter table public.journey_lesson_progress enable row level security;
alter table public.journey_comments enable row level security;
alter table public.journey_comment_likes enable row level security;
alter table public.journey_proofs enable row level security;
alter table public.journey_progress enable row level security;
alter table public.journey_xp_events enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.journey_notifications enable row level security;

-- JOURNEYS: published + nao admin-only sao lidos por todos logados.
-- Admin/crm_agent leem tudo + escrevem.
drop policy if exists "journeys_read_public" on public.journeys;
create policy "journeys_read_public" on public.journeys
  for select using (
    is_published = true
    and is_admin_only = false
  );
drop policy if exists "journeys_admin_all" on public.journeys;
create policy "journeys_admin_all" on public.journeys
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- JOURNEY_LESSONS: published de jornada publicada e nao admin-only
drop policy if exists "journey_lessons_read_public" on public.journey_lessons;
create policy "journey_lessons_read_public" on public.journey_lessons
  for select using (
    is_published = true
    and exists (
      select 1 from public.journeys j
      where j.id = journey_lessons.journey_id
        and j.is_published = true
        and j.is_admin_only = false
    )
  );
drop policy if exists "journey_lessons_admin_all" on public.journey_lessons;
create policy "journey_lessons_admin_all" on public.journey_lessons
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- JOURNEY_LESSON_PROGRESS: owner only
drop policy if exists "jlp_owner" on public.journey_lesson_progress;
create policy "jlp_owner" on public.journey_lesson_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "jlp_admin_read" on public.journey_lesson_progress;
create policy "jlp_admin_read" on public.journey_lesson_progress
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- JOURNEY_COMMENTS: todos logados leem visible; owner cria/edita/deleta proprio; admin tudo
drop policy if exists "jc_read_visible" on public.journey_comments;
create policy "jc_read_visible" on public.journey_comments
  for select using (
    auth.uid() is not null
    and (status = 'visible' or user_id = auth.uid())
  );
drop policy if exists "jc_insert_owner" on public.journey_comments;
create policy "jc_insert_owner" on public.journey_comments
  for insert with check (user_id = auth.uid());
drop policy if exists "jc_update_owner" on public.journey_comments;
create policy "jc_update_owner" on public.journey_comments
  for update using (user_id = auth.uid());
drop policy if exists "jc_delete_owner" on public.journey_comments;
create policy "jc_delete_owner" on public.journey_comments
  for delete using (user_id = auth.uid());
drop policy if exists "jc_admin_all" on public.journey_comments;
create policy "jc_admin_all" on public.journey_comments
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- JOURNEY_COMMENT_LIKES: owner toggle, todos leem
drop policy if exists "jcl_read_all" on public.journey_comment_likes;
create policy "jcl_read_all" on public.journey_comment_likes
  for select using (auth.uid() is not null);
drop policy if exists "jcl_owner_write" on public.journey_comment_likes;
create policy "jcl_owner_write" on public.journey_comment_likes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- JOURNEY_PROOFS: owner read/insert; admin all
drop policy if exists "jp_owner_read" on public.journey_proofs;
create policy "jp_owner_read" on public.journey_proofs
  for select using (user_id = auth.uid());
drop policy if exists "jp_owner_insert" on public.journey_proofs;
create policy "jp_owner_insert" on public.journey_proofs
  for insert with check (user_id = auth.uid());
drop policy if exists "jp_admin_all" on public.journey_proofs;
create policy "jp_admin_all" on public.journey_proofs
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- JOURNEY_PROGRESS: owner all; admin read
drop policy if exists "jpr_owner" on public.journey_progress;
create policy "jpr_owner" on public.journey_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "jpr_admin_read" on public.journey_progress;
create policy "jpr_admin_read" on public.journey_progress
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- JOURNEY_XP_EVENTS: owner read; admin all
drop policy if exists "jxe_owner_read" on public.journey_xp_events;
create policy "jxe_owner_read" on public.journey_xp_events
  for select using (user_id = auth.uid());
drop policy if exists "jxe_admin_all" on public.journey_xp_events;
create policy "jxe_admin_all" on public.journey_xp_events
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- BADGES: todos logados leem ativos; admin tudo
drop policy if exists "badges_read_active" on public.badges;
create policy "badges_read_active" on public.badges
  for select using (is_active = true and auth.uid() is not null);
drop policy if exists "badges_admin_all" on public.badges;
create policy "badges_admin_all" on public.badges
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- USER_BADGES: owner read; admin all
drop policy if exists "ub_owner_read" on public.user_badges;
create policy "ub_owner_read" on public.user_badges
  for select using (user_id = auth.uid());
drop policy if exists "ub_admin_all" on public.user_badges;
create policy "ub_admin_all" on public.user_badges
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- JOURNEY_NOTIFICATIONS: owner all
drop policy if exists "jn_owner" on public.journey_notifications;
create policy "jn_owner" on public.journey_notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 13) STORAGE BUCKET pra prints (privado, LGPD)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'journey-proofs',
  'journey-proofs',
  false,  -- privado
  10485760,  -- 10MB
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {user_id}/{journey_slug}-{timestamp}.{ext}
drop policy if exists "journey_proofs_owner_read" on storage.objects;
create policy "journey_proofs_owner_read" on storage.objects
  for select using (
    bucket_id = 'journey-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "journey_proofs_owner_write" on storage.objects;
create policy "journey_proofs_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'journey-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "journey_proofs_admin_read" on storage.objects;
create policy "journey_proofs_admin_read" on storage.objects
  for select using (
    bucket_id = 'journey-proofs'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- 14) TRIGGERS touch updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_journey_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists journeys_touch on public.journeys;
create trigger journeys_touch
  before update on public.journeys
  for each row execute function public.touch_journey_updated_at();

drop trigger if exists journey_lessons_touch on public.journey_lessons;
create trigger journey_lessons_touch
  before update on public.journey_lessons
  for each row execute function public.touch_journey_updated_at();

drop trigger if exists journey_comments_touch on public.journey_comments;
create trigger journey_comments_touch
  before update on public.journey_comments
  for each row execute function public.touch_journey_updated_at();

-- ---------------------------------------------------------------------------
-- 15) FUNCAO HELPER: stage do personagem (derivado)
-- ---------------------------------------------------------------------------
-- Usada pela UI pra mostrar bebe/adolescente/adulta sem precisar manter
-- coluna em profiles. Sempre consistente porque deriva de journey_progress.
create or replace function public.user_character_stage(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when (select count(*) from journey_progress
          where user_id = p_user_id and status = 'completed') >= 2 then 'adulta'
    when (select count(*) from journey_progress
          where user_id = p_user_id and status = 'completed') >= 1 then 'adolescente'
    else 'bebe'
  end
$$;

grant execute on function public.user_character_stage(uuid) to authenticated, service_role;
