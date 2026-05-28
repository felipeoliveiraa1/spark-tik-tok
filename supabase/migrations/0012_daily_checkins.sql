-- Rotina Yara — check-in diário da aluna.
--
-- 1 row por aluna por dia (UNIQUE constraint em user_id+date). UPSERT no
-- backend: se hoje já tem check-in, atualiza; senão insere.
--
-- Campos divididos em 4 dimensões:
--   A. Trabalho   — atividades de produção (vídeos, lives, análise, comms)
--   B. Pessoal    — autocuidado (skincare, suplementação, gym, sono)
--   C. Resultados — KPIs numéricos do dia (vendas, comissão, views)
--   D. Reflexão   — mood, energia, nota livre
--
-- A % de aderência à rotina Yara é calculada client-side em cima dos 11
-- itens da rotina (6 trabalho + 5 pessoal).

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,

  -- A. TRABALHO
  videos_posted          int  not null default 0,
  videos_recorded        int  not null default 0,
  live_chat_done         bool not null default false,
  live_shop_done         bool not null default false,
  analytics_done         bool not null default false,
  comms_done             bool not null default false,

  -- B. PESSOAL
  skincare_morning       bool not null default false,
  skincare_night         bool not null default false,
  supplementation        bool not null default false,
  gym                    bool not null default false,
  sleep_hygiene          bool not null default false,

  -- C. RESULTADOS (3 KPIs essenciais — opcionais)
  sales_brl              numeric(10,2),
  commission_brl         numeric(10,2),
  total_views            int,

  -- D. REFLEXÃO
  mood                   text check (mood in ('great','good','okay','tough','rough')),
  energy_level           int  check (energy_level between 1 and 5),
  notes                  text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (user_id, date)
);

create index if not exists daily_checkins_user_date_idx
  on public.daily_checkins (user_id, date desc);

alter table public.daily_checkins enable row level security;

create policy "own_checkins_select" on public.daily_checkins
  for select using (user_id = auth.uid());

create policy "own_checkins_insert" on public.daily_checkins
  for insert with check (user_id = auth.uid());

create policy "own_checkins_update" on public.daily_checkins
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own_checkins_delete" on public.daily_checkins
  for delete using (user_id = auth.uid());

comment on table  public.daily_checkins is
  'Check-in diário da aluna (Rotina Yara). 1 row por user/date via UNIQUE.';
comment on column public.daily_checkins.videos_posted    is 'Meta Yara: 7 por dia';
comment on column public.daily_checkins.videos_recorded  is 'Meta Yara: 10-14 por dia (gravação em lote)';
comment on column public.daily_checkins.mood             is 'great=incrível · good=bom · okay=normal · tough=difícil · rough=péssimo';

-- Trigger pra atualizar updated_at sozinho
create or replace function public.handle_checkin_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists daily_checkins_updated_at on public.daily_checkins;
create trigger daily_checkins_updated_at
  before update on public.daily_checkins
  for each row execute function public.handle_checkin_updated_at();
