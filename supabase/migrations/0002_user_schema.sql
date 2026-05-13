-- =============================================================================
-- Spark — user-facing schema (profiles, products, scripts, chat, news, folders)
--
-- All tables here are owned by the authenticated user (auth.users). RLS policies
-- enforce that each aluna sees only her own data. News is the only globally
-- readable table.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles — 1-to-1 with auth.users. Populated on first login (via /welcome).
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text unique not null,
  name                    text,
  niche                   text,
  avatar_url              text,
  plan_active             boolean not null default false,
  kiwify_customer_id      text,
  kiwify_subscription_id  text,
  plan_renewed_at         timestamptz,
  must_reset_password     boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

-- -----------------------------------------------------------------------------
-- products — saved by the Info agent (vision analysis of product photo).
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  image_url         text,
  category          text,
  target_audience   text,
  pain_points       jsonb,
  strengths         jsonb,
  price_range       text,
  competitors       jsonb,
  raw_analysis      jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products (user_id, created_at desc);

-- Now that products exists, link viral_research_products by FK.
do $$ begin
  alter table public.viral_research_products
    add constraint viral_research_products_product_fk
    foreign key (product_id) references public.products(id) on delete cascade;
exception
  when duplicate_object then null;
  when undefined_table then null;
end $$;

-- -----------------------------------------------------------------------------
-- generated_scripts — output of the Scripts agent. One row per generation run.
-- -----------------------------------------------------------------------------
create table if not exists public.generated_scripts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  title         text not null default '10 hooks',
  hooks         jsonb not null,            -- [{ n, hook, trigger, why, fire }]
  raw_output    text,
  model         text,
  created_at    timestamptz not null default now()
);

create index if not exists generated_scripts_user_id_idx on public.generated_scripts (user_id, created_at desc);
create index if not exists generated_scripts_product_id_idx on public.generated_scripts (product_id);

-- -----------------------------------------------------------------------------
-- conversation_folders — user-scoped folders for organizing chats.
-- One default folder ("Geral") is created per user on first signup via trigger.
-- -----------------------------------------------------------------------------
create table if not exists public.conversation_folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  is_default  boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists conversation_folders_user_id_idx on public.conversation_folders (user_id, sort_order);

-- -----------------------------------------------------------------------------
-- conversations — chat threads. One agent per thread.
-- -----------------------------------------------------------------------------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  folder_id       uuid references public.conversation_folders(id) on delete set null,
  agent           text not null check (agent in ('info','viral','script','help')),
  title           text not null default 'Nova conversa',
  preview         text not null default '',
  message_count   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists conversations_user_id_updated_idx on public.conversations (user_id, updated_at desc);
create index if not exists conversations_folder_id_idx on public.conversations (folder_id);

-- -----------------------------------------------------------------------------
-- conversation_messages — append-only message log per conversation.
-- -----------------------------------------------------------------------------
create table if not exists public.conversation_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user','assistant','system')),
  content         text not null,
  attachments     jsonb,
  tokens_in       int,
  tokens_out      int,
  created_at      timestamptz not null default now()
);

create index if not exists conversation_messages_conversation_idx on public.conversation_messages (conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- news — Aline's newspaper. Globally readable.
-- Inserted manually via Supabase Studio for now; later via admin panel.
-- -----------------------------------------------------------------------------
create table if not exists public.news (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  category          text not null,            -- 'mercado' | 'feature' | 'comunidade' | etc
  title             text not null,
  excerpt           text,
  cover_url         text,
  body_md           text not null,
  reading_minutes   int not null default 3,
  is_new            boolean not null default true,
  published_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists news_published_at_idx on public.news (published_at desc);

-- =============================================================================
-- Trigger: auto-create profile + default folder when an auth user is created.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  must_reset boolean := false;
begin
  -- Pick up `must_reset_password` flag from user_metadata (set by Kiwify webhook)
  if new.raw_user_meta_data ? 'must_reset_password' then
    must_reset := (new.raw_user_meta_data->>'must_reset_password')::boolean;
  end if;

  insert into public.profiles (id, email, name, must_reset_password)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', null),
    must_reset
  )
  on conflict (id) do nothing;

  insert into public.conversation_folders (user_id, name, is_default, sort_order)
  values (new.id, 'Geral', true, 0)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Trigger: bump conversation.updated_at + recompute message_count on new message.
-- =============================================================================
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    updated_at = now(),
    message_count = message_count + 1,
    preview = case
      when new.role = 'user' then left(new.content, 200)
      else preview
    end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_inserted on public.conversation_messages;
create trigger on_message_inserted
  after insert on public.conversation_messages
  for each row execute function public.handle_new_message();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles                enable row level security;
alter table public.products                enable row level security;
alter table public.generated_scripts       enable row level security;
alter table public.conversation_folders    enable row level security;
alter table public.conversations           enable row level security;
alter table public.conversation_messages   enable row level security;
alter table public.news                    enable row level security;
alter table public.usage_counters          enable row level security;
alter table public.scraper_jobs            enable row level security;

-- profiles — user reads/updates her own row.
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- products
drop policy if exists "products_owner" on public.products;
create policy "products_owner" on public.products
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- generated_scripts
drop policy if exists "scripts_owner" on public.generated_scripts;
create policy "scripts_owner" on public.generated_scripts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- folders
drop policy if exists "folders_owner" on public.conversation_folders;
create policy "folders_owner" on public.conversation_folders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- conversations
drop policy if exists "conversations_owner" on public.conversations;
create policy "conversations_owner" on public.conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- messages — gated by the parent conversation's owner.
drop policy if exists "messages_owner" on public.conversation_messages;
create policy "messages_owner" on public.conversation_messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- news — public read; writes are service-role only.
drop policy if exists "news_public_read" on public.news;
create policy "news_public_read" on public.news
  for select using (true);

-- usage_counters — user reads her own row; writes happen via service role.
drop policy if exists "usage_counters_owner_read" on public.usage_counters;
create policy "usage_counters_owner_read" on public.usage_counters
  for select using (user_id = auth.uid());

-- scraper_jobs — user reads her own jobs; writes via service role.
drop policy if exists "scraper_jobs_owner_read" on public.scraper_jobs;
create policy "scraper_jobs_owner_read" on public.scraper_jobs
  for select using (user_id = auth.uid());
