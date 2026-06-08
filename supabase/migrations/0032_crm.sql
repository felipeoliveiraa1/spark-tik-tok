-- =============================================================================
-- 0032 — CRM completo pra time de vendas atender leads
-- =============================================================================
-- Cria role 'crm_agent' (acesso so a leads, nao a outras areas admin),
-- expande status pra fluxo mais granular (PT), adiciona atribuicao por
-- agente e tabela lead_events pro historico/auditoria.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Role crm_agent
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin', 'crm_agent'));

-- ---------------------------------------------------------------------------
-- 2) Status expandido — fluxo: novo -> contactado -> em_conversa -> agendado
--    -> convertido / perdido (qualquer momento)
-- ---------------------------------------------------------------------------
-- Migra valores antigos pros novos (PT) ANTES de trocar o check constraint
update public.leads set status = 'novo' where status = 'new';
update public.leads set status = 'contactado' where status = 'contacted';
update public.leads set status = 'convertido' where status = 'converted';
update public.leads set status = 'perdido' where status = 'dismissed';

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  alter column status set default 'novo';

alter table public.leads
  add constraint leads_status_check
  check (status in (
    'novo',
    'contactado',
    'em_conversa',
    'agendado',
    'convertido',
    'perdido'
  ));

-- ---------------------------------------------------------------------------
-- 3) Atribuicao: quem ta responsavel pelo lead
-- ---------------------------------------------------------------------------
alter table public.leads
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null;

create index if not exists leads_assigned_to_idx
  on public.leads (assigned_to, status);

-- ---------------------------------------------------------------------------
-- 4) Tabela de eventos (historico/auditoria)
-- ---------------------------------------------------------------------------
-- kind: 'status_change' | 'note' | 'assigned' | 'contact_attempt'
-- payload: estrutura livre por kind (ex: {from: 'novo', to: 'contactado'})
create table if not exists public.lead_events (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  kind        text not null check (kind in (
    'status_change',
    'note',
    'assigned',
    'contact_attempt'
  )),
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists lead_events_lead_id_idx
  on public.lead_events (lead_id, created_at desc);

create index if not exists lead_events_actor_id_idx
  on public.lead_events (actor_id, created_at desc);

alter table public.lead_events enable row level security;

-- Admin OU crm_agent: ler e escrever
drop policy if exists "lead_events_crm_read" on public.lead_events;
create policy "lead_events_crm_read" on public.lead_events
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'crm_agent')
    )
  );

drop policy if exists "lead_events_crm_insert" on public.lead_events;
create policy "lead_events_crm_insert" on public.lead_events
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'crm_agent')
    )
  );

-- ---------------------------------------------------------------------------
-- 5) Expande policies de leads pra crm_agent (CRM agora le e atualiza)
-- ---------------------------------------------------------------------------
-- Delete continua so admin (crm_agent nao apaga leads).
drop policy if exists "leads_admin_read" on public.leads;
create policy "leads_crm_read" on public.leads
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'crm_agent')
    )
  );

drop policy if exists "leads_admin_update" on public.leads;
create policy "leads_crm_update" on public.leads
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'crm_agent')
    )
  );

-- leads_admin_delete e leads_public_insert ficam como estao

-- ---------------------------------------------------------------------------
-- 6) Trigger: cria evento automatico ao mudar status
-- ---------------------------------------------------------------------------
create or replace function public.log_lead_status_change()
returns trigger language plpgsql security definer as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_events (lead_id, actor_id, kind, payload)
    values (
      new.id,
      auth.uid(),
      'status_change',
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    insert into public.lead_events (lead_id, actor_id, kind, payload)
    values (
      new.id,
      auth.uid(),
      'assigned',
      jsonb_build_object(
        'from', old.assigned_to,
        'to', new.assigned_to
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists lead_status_change_log on public.leads;
create trigger lead_status_change_log
  after update on public.leads
  for each row execute function public.log_lead_status_change();
