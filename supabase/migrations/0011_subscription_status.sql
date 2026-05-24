-- Campos pra controle granular do ciclo de vida da assinatura.
--
-- O webhook Kiwify atualiza esses campos conforme os eventos:
--   order_approved/paid       → status='active',  expires_at=null,    active=true
--   subscription_renewed      → status='active',  next_payment=...,   active=true
--   subscription_late         → status='late',                        active=true  (warning)
--   subscription_canceled     → status='canceled', expires_at=...,    active=true até expires_at
--   order_refunded            → status='refunded',                    active=false IMEDIATO
--   chargeback                → status='chargeback',                  active=false IMEDIATO
--
-- O helper hasActiveAccess(profile) decide se libera acesso baseado em
-- plan_active + plan_expires_at (pra cancelados com período pago restante).

alter table public.profiles
  add column if not exists plan_status        text default 'inactive',
  add column if not exists plan_expires_at    timestamptz,
  add column if not exists plan_next_payment  timestamptz,
  add column if not exists plan_canceled_at   timestamptz;

-- Status válidos (referência, não constraint pra evitar quebra em eventos novos):
--   inactive, active, late, canceled, refunded, chargeback

comment on column public.profiles.plan_status is
  'Estado granular: inactive | active | late | canceled | refunded | chargeback';
comment on column public.profiles.plan_expires_at is
  'Quando o acesso termina (preenchido em subscription_canceled = access_until da Kiwify)';
comment on column public.profiles.plan_next_payment is
  'Data da próxima cobrança esperada (vem de subscription_renewed)';

create index if not exists profiles_plan_status_idx on public.profiles (plan_status)
  where plan_status is not null;
