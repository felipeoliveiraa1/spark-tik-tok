-- =============================================================================
-- 0036 — Group redirect /grupo (round-robin pra lotar 2+ grupos do WhatsApp)
-- =============================================================================
-- /grupo escolhe o link ativo com MENOR click_count e redireciona pra ele,
-- incrementando o contador atomicamente (UPDATE ... FOR UPDATE SKIP LOCKED).
-- Tracking opcional de UTM + IP hash (LGPD-safe) em group_redirect_clicks.
--
-- Admin gerencia em /admin/grupo: add/remove links, ver clicks, setar cap
-- (parar de enviar pra um grupo quando atingir N — protege contra estourar
-- o limite WhatsApp de 1024 participantes).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Tabela de links
-- ---------------------------------------------------------------------------
create table if not exists public.group_redirect_links (
  id          uuid primary key default gen_random_uuid(),
  label       text not null check (length(label) between 1 and 80),
  url         text not null check (url ~ '^https?://'),
  click_count bigint not null default 0,
  cap_count   bigint null check (cap_count is null or cap_count > 0),
  is_active   boolean not null default true,
  sort_order  int not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.group_redirect_links.cap_count is
  'Limite maximo de clicks. NULL = sem limite. Quando click_count >= cap_count, link sai do pool. Util pra parar perto de 1000 (limite WhatsApp).';

create index if not exists group_redirect_links_active_count_idx
  on public.group_redirect_links (click_count asc, sort_order asc, id)
  where is_active = true;

-- ---------------------------------------------------------------------------
-- 2) Tabela de clicks (analytics)
-- ---------------------------------------------------------------------------
create table if not exists public.group_redirect_clicks (
  id           uuid primary key default gen_random_uuid(),
  link_id      uuid not null references public.group_redirect_links(id) on delete cascade,
  ip_hash      text null,
  user_agent   text null,
  referer      text null,
  utm_source   text null,
  utm_medium   text null,
  utm_campaign text null,
  utm_content  text null,
  utm_term     text null,
  created_at   timestamptz not null default now()
);

comment on column public.group_redirect_clicks.ip_hash is
  'SHA-256(ip + salt). LGPD: nunca armazenamos IP raw. Util pra contar visitantes unicos aproximados.';

create index if not exists group_redirect_clicks_link_idx
  on public.group_redirect_clicks (link_id, created_at desc);
create index if not exists group_redirect_clicks_utm_source_idx
  on public.group_redirect_clicks (utm_source, created_at desc) where utm_source is not null;
create index if not exists group_redirect_clicks_utm_campaign_idx
  on public.group_redirect_clicks (utm_campaign, created_at desc) where utm_campaign is not null;
create index if not exists group_redirect_clicks_created_idx
  on public.group_redirect_clicks (created_at desc);

-- ---------------------------------------------------------------------------
-- 3) RLS
-- ---------------------------------------------------------------------------
alter table public.group_redirect_links enable row level security;
alter table public.group_redirect_clicks enable row level security;

drop policy if exists "group_redirect_links_staff_read" on public.group_redirect_links;
create policy "group_redirect_links_staff_read" on public.group_redirect_links
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','crm_agent'))
  );

drop policy if exists "group_redirect_clicks_staff_read" on public.group_redirect_clicks;
create policy "group_redirect_clicks_staff_read" on public.group_redirect_clicks
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','crm_agent'))
  );

-- Inserts/updates: APENAS via service_role (sem policies).

-- ---------------------------------------------------------------------------
-- 4) Trigger touch updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_group_redirect_links_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists group_redirect_links_touch on public.group_redirect_links;
create trigger group_redirect_links_touch
  before update on public.group_redirect_links
  for each row execute function public.touch_group_redirect_links_updated_at();

-- ---------------------------------------------------------------------------
-- 5) RPC atomic pra round-robin sem race
-- ---------------------------------------------------------------------------
-- Pega o link ativo com menor click_count, incrementa, retorna {id, url}.
-- FOR UPDATE SKIP LOCKED garante que 2 calls concorrentes nao escolhem o
-- mesmo link. Se nao tem link disponivel (todos inativos ou cap atingido),
-- retorna 0 linhas.
create or replace function public.pick_next_group_redirect()
returns table(id uuid, url text)
language plpgsql
security definer
set search_path = public
as $$
declare
  picked_id uuid;
  picked_url text;
begin
  update public.group_redirect_links
  set click_count = click_count + 1, updated_at = now()
  where group_redirect_links.id = (
    select sub.id from public.group_redirect_links sub
    where sub.is_active = true
      and (sub.cap_count is null or sub.click_count < sub.cap_count)
    order by sub.click_count asc, sub.sort_order asc, sub.id asc
    limit 1
    for update skip locked
  )
  returning group_redirect_links.id, group_redirect_links.url
  into picked_id, picked_url;

  if picked_id is null then
    return;
  end if;

  return query select picked_id, picked_url;
end;
$$;

grant execute on function public.pick_next_group_redirect to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6) Seed com os 2 grupos atuais
-- ---------------------------------------------------------------------------
insert into public.group_redirect_links (label, url, sort_order)
select 'Comunidade 1', 'https://chat.whatsapp.com/Coh2xidtJKW58QiDdnpalX', 100
where not exists (
  select 1 from public.group_redirect_links
  where url = 'https://chat.whatsapp.com/Coh2xidtJKW58QiDdnpalX'
);

insert into public.group_redirect_links (label, url, sort_order)
select 'Comunidade 2', 'https://chat.whatsapp.com/CfiMYzKvdXTEIVNvC9b4QU', 200
where not exists (
  select 1 from public.group_redirect_links
  where url = 'https://chat.whatsapp.com/CfiMYzKvdXTEIVNvC9b4QU'
);
