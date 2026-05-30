-- =============================================================================
-- 0019 — User feedback (bugs + sugestoes de melhorias)
-- =============================================================================
-- Aluna pode reportar bugs ou sugerir melhorias direto do botao "?" presente
-- em todas as telas. Admin ve no painel /admin/feedback e atualiza status.
--
-- type: 'bug' | 'suggestion'
-- status: 'open' | 'in_review' | 'resolved' | 'dismissed'
-- page_url: a URL onde a aluna estava quando reportou (debug helper)
-- =============================================================================

create table if not exists public.user_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('bug', 'suggestion')),
  title       text not null check (length(title) between 3 and 120),
  description text not null check (length(description) between 5 and 2000),
  page_url    text,
  user_agent  text,
  status      text not null default 'open'
              check (status in ('open', 'in_review', 'resolved', 'dismissed')),
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists user_feedback_status_idx
  on public.user_feedback (status, created_at desc);
create index if not exists user_feedback_user_idx
  on public.user_feedback (user_id, created_at desc);

alter table public.user_feedback enable row level security;

-- Aluna pode criar e ler so o que escreveu
drop policy if exists "user_feedback_owner" on public.user_feedback;
create policy "user_feedback_owner" on public.user_feedback
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Admin le tudo (verifica via role no profile)
drop policy if exists "user_feedback_admin_read" on public.user_feedback;
create policy "user_feedback_admin_read" on public.user_feedback
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "user_feedback_admin_update" on public.user_feedback;
create policy "user_feedback_admin_update" on public.user_feedback
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Touch updated_at automatico
create or replace function public.touch_user_feedback_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_feedback_touch on public.user_feedback;
create trigger user_feedback_touch
  before update on public.user_feedback
  for each row execute function public.touch_user_feedback_updated_at();
