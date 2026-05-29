-- =============================================================================
-- 0016 — Rotina dinamica: habits por aluna + checkins por habit + day-complete
-- =============================================================================
-- Substitui o modelo fixo (daily_checkins com 13 colunas hardcoded) por:
--
--   user_habits         → cada aluna tem sua propria lista de habitos
--   habit_checkins      → 1 linha por habit/dia marcado como feito
--   daily_completions   → registro de quando a aluna "concluiu" o dia
--                         (tranca o form ate o proximo dia)
--
-- Onboarding: aluna nova ja recebe os 13 habitos do template Yara,
-- pode editar/remover/adicionar/restaurar. Quem ja tem dados em
-- daily_checkins continua tendo aquilo pra historico — nao mexemos.
-- =============================================================================

-- ============================================================================
-- 1) USER_HABITS — lista customizada por aluna
-- ============================================================================

create table if not exists public.user_habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  slug         text not null,
  label        text not null,
  emoji        text not null default '✨',
  category     text not null default 'trabalho'
               check (category in ('trabalho','pessoal','resultado','custom')),
  order_index  int  not null default 0,
  is_active    bool not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists user_habits_user_idx
  on public.user_habits (user_id, is_active, order_index);

alter table public.user_habits enable row level security;

drop policy if exists "user_habits_owner" on public.user_habits;
create policy "user_habits_owner" on public.user_habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Trigger updated_at
create or replace function public.touch_user_habit_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_habits_touch on public.user_habits;
create trigger user_habits_touch
  before update on public.user_habits
  for each row execute function public.touch_user_habit_updated_at();

-- ============================================================================
-- 2) HABIT_CHECKINS — marcacao por aluna por habit por dia
-- ============================================================================

create table if not exists public.habit_checkins (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  habit_id     uuid not null references public.user_habits(id) on delete cascade,
  date         date not null,
  done         bool not null default true,
  created_at   timestamptz not null default now(),
  primary key (user_id, habit_id, date)
);

create index if not exists habit_checkins_user_date_idx
  on public.habit_checkins (user_id, date desc);

alter table public.habit_checkins enable row level security;

drop policy if exists "habit_checkins_owner" on public.habit_checkins;
create policy "habit_checkins_owner" on public.habit_checkins
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- 3) DAILY_COMPLETIONS — dia foi concluido (tranca a UI ate 00h)
-- ============================================================================

create table if not exists public.daily_completions (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  date           date not null,
  completed_at   timestamptz not null default now(),
  habits_done    int  not null default 0,
  habits_total   int  not null default 0,
  primary key (user_id, date)
);

create index if not exists daily_completions_user_date_idx
  on public.daily_completions (user_id, date desc);

alter table public.daily_completions enable row level security;

drop policy if exists "daily_completions_owner" on public.daily_completions;
create policy "daily_completions_owner" on public.daily_completions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- 4) FUNCAO seed_default_habits — popula template Yara pra uma aluna
-- ============================================================================
-- Use via RPC do servidor quando aluna onboarda OU quando ela pedir
-- "restaurar template" no /rotina/editar.
-- Idempotente: usa on conflict (user_id, slug) do nothing.

create or replace function public.seed_yara_template(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_habits (user_id, slug, label, emoji, category, order_index)
  values
    -- A. Trabalho (ordem 0-6)
    (p_user_id, 'gravei-videos',     'Gravei vídeos hoje',           '🎥', 'trabalho',  0),
    (p_user_id, 'postei-videos',     'Postei vídeo no TikTok Shop',  '📱', 'trabalho',  1),
    (p_user_id, 'vi-metricas',       'Olhei as métricas do dia',     '📊', 'trabalho',  2),
    (p_user_id, 'respondi-dms',      'Respondi DMs e comentários',   '💬', 'trabalho',  3),
    (p_user_id, 'fiz-live',          'Fiz live ou planejei próxima', '🔴', 'trabalho',  4),
    (p_user_id, 'estudei-conteudo',  'Vi aula ou estudei conteúdo',  '🎓', 'trabalho',  5),
    -- B. Pessoal (ordem 6-11)
    (p_user_id, 'skincare-manha',    'Skincare da manhã',            '🌅', 'pessoal',   6),
    (p_user_id, 'skincare-noite',    'Skincare da noite',            '🌙', 'pessoal',   7),
    (p_user_id, 'suplementos',       'Tomei meus suplementos',       '💊', 'pessoal',   8),
    (p_user_id, 'treino',            'Treinei ou me movimentei',     '🏋️', 'pessoal',   9),
    (p_user_id, 'agua',              'Bebi água ao longo do dia',    '💧', 'pessoal',  10),
    (p_user_id, 'dormi-bem',         'Dormi 7-8h tranquila',         '🛏️', 'pessoal',  11),
    -- C. Resultado (ordem 12-13)
    (p_user_id, 'fechei-venda',      'Fechei uma venda no TTS',      '💸', 'resultado',12),
    (p_user_id, 'bati-meta-views',   'Bati minha meta de views',     '📈', 'resultado',13)
  on conflict (user_id, slug) do nothing;
end;
$$;

grant execute on function public.seed_yara_template(uuid) to authenticated;

-- ============================================================================
-- 5) TRIGGER — auto-seed quando profile e criado
-- ============================================================================
-- Quando uma aluna nova entra no app pela primeira vez, ja ganha os 14 habitos
-- do template Yara. Se quiser, edita depois.

create or replace function public.auto_seed_user_habits()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.seed_yara_template(new.id);
  return new;
end;
$$;

drop trigger if exists profiles_auto_seed_habits on public.profiles;
create trigger profiles_auto_seed_habits
  after insert on public.profiles
  for each row execute function public.auto_seed_user_habits();

-- ============================================================================
-- 6) BACKFILL — seed pra todas as alunas existentes (idempotente)
-- ============================================================================

do $$
declare
  r record;
begin
  for r in select id from public.profiles loop
    perform public.seed_yara_template(r.id);
  end loop;
end $$;
