-- =============================================================================
-- 0040 — Modulos dentro da Jornada (agrupador hierarquico)
-- =============================================================================
-- Spec da Yara organiza Jornada 1 em 4 modulos:
--   M1: Organizando a Casa (10 aulas — setup tecnico)
--   M2: Rotina de Milhoes (2 aulas — disciplina)
--   M3: Mentalidade Blindada (10 aulas — psicologia)
--   M4: Atraindo Seguidores (3+ aulas — estrategia, Semanas 2-4)
--
-- Sem agrupador, 26+ aulas viram lista plana (UX morre no Story Deck, selos
-- compostos viram lista hardcoded de IDs, perde noção pedagogica). Modulos
-- resolvem isso + permitem "completar M1+M2+M3 = libera selo Semana 1".
--
-- Esta migration:
--   1. Cria tabela journey_modules
--   2. ALTER journey_lessons ADD module_id
--   3. Atualiza titulo/subtitulo da Jornada 1 pra spec real
--   4. Seed: 4 modulos + aulas nomeadas pela Yara (as sem nome ficam pra ela
--      preencher via /admin/jornadas)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) JOURNEY_MODULES
-- ---------------------------------------------------------------------------
create table if not exists public.journey_modules (
  id            uuid primary key default gen_random_uuid(),
  journey_id    uuid not null references public.journeys(id) on delete cascade,
  slug          text not null check (length(slug) between 1 and 80),
  title         text not null check (length(title) between 1 and 120),
  description   text,
  week_number   int check (week_number is null or week_number between 1 and 12),
  order_index   int not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (journey_id, slug)
);

create index if not exists journey_modules_order_idx
  on public.journey_modules (journey_id, order_index)
  where is_published = true;

comment on column public.journey_modules.week_number is
  'Semana do programa em que esse modulo vive (1 = Semana 1, 2-4 = Campo de Batalha).';

-- ---------------------------------------------------------------------------
-- 2) ALTER journey_lessons — adiciona module_id
-- ---------------------------------------------------------------------------
alter table public.journey_lessons
  add column if not exists module_id uuid
  references public.journey_modules(id) on delete set null;

create index if not exists journey_lessons_module_idx
  on public.journey_lessons (module_id, order_index)
  where is_published = true;

-- ---------------------------------------------------------------------------
-- 3) RLS journey_modules
-- ---------------------------------------------------------------------------
alter table public.journey_modules enable row level security;

drop policy if exists "journey_modules_read_public" on public.journey_modules;
create policy "journey_modules_read_public" on public.journey_modules
  for select using (
    is_published = true
    and exists (
      select 1 from public.journeys j
      where j.id = journey_modules.journey_id
        and j.is_published = true
        and j.is_admin_only = false
    )
  );

drop policy if exists "journey_modules_admin_all" on public.journey_modules;
create policy "journey_modules_admin_all" on public.journey_modules
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- 4) TOUCH updated_at trigger
-- ---------------------------------------------------------------------------
drop trigger if exists journey_modules_touch on public.journey_modules;
create trigger journey_modules_touch
  before update on public.journey_modules
  for each row execute function public.touch_journey_updated_at();

-- ---------------------------------------------------------------------------
-- 5) UPDATE Jornada 1 — titulo/subtitulo/description da spec
-- ---------------------------------------------------------------------------
update public.journeys
set title       = 'Jornada 1 — Do Zero a Monetização',
    subtitle    = '4 semanas pra sair do zero e fazer a primeira venda',
    description = 'Setup completo da conta + rotina + mentalidade na Semana 1; produção e estratégia de conteúdo nas Semanas 2-4. No final, prova de vendas no painel TikTok Shop libera a próxima jornada.'
where slug = 'jornada-1-bebe';

-- ---------------------------------------------------------------------------
-- 6) SEED — 4 modulos da Jornada 1
-- ---------------------------------------------------------------------------
insert into public.journey_modules (journey_id, slug, title, description, week_number, order_index, is_published)
select j.id, m.slug, m.title, m.description, m.week_number, m.order_index, true
from public.journeys j
cross join (values
  ('organizando-a-casa', 'Organizando a Casa',
   'Setup técnico completo: conta TikTok, cadastro TTS, nichos, gravação com IA e estrutura de vídeo.',
   1, 100),
  ('rotina-de-milhoes', 'Rotina de Milhões',
   'Disciplina e processo. Como montar a rotina com IA e por que ela faz a diferença.',
   1, 200),
  ('mentalidade-blindada', 'Mentalidade Blindada',
   'Psicologia da consistência: por que 90% desiste e como você fica entre as 10%.',
   1, 300),
  ('atraindo-seguidores', 'Atraindo Seguidores Qualificados',
   'Estratégia de conteúdo, live shop e crescimento de audiência. Aqui as primeiras vendas saem.',
   2, 400)
) as m(slug, title, description, week_number, order_index)
where j.slug = 'jornada-1-bebe'
on conflict (journey_id, slug) do nothing;

-- ---------------------------------------------------------------------------
-- 7) SEED — Aulas nomeadas pela Yara (as sem nome ficam pra preencher via admin)
-- ---------------------------------------------------------------------------

-- Modulo 1: Organizando a Casa (9 aulas explicitas, deixa slot pra 10a)
insert into public.journey_lessons
  (journey_id, module_id, slug, title, description, kind, body_md,
   order_index, xp_reward, requires_proof, is_published)
select j.id, m.id, l.slug, l.title, l.description, 'rich',
       E'_Aula em produção. Yara vai preencher em breve._',
       l.order_index, 10, false, true
from public.journeys j
join public.journey_modules m on m.journey_id = j.id and m.slug = 'organizando-a-casa'
cross join (values
  ('o-que-e-tiktok-shop',          'O que é TikTok Shop',                                      'Visão geral da plataforma e o jogo que você vai jogar.', 110),
  ('criando-conta-tiktok',          'Criando conta no TikTok',                                  'Passo a passo da conta zerada.', 120),
  ('configurando-conta',            'Configurando conta: foto, nome, bio',                      'Perfil que converte: foto, nome e bio que vendem.', 130),
  ('cadastrar-tts',                 'Como se cadastrar no TikTok Shop',                         'Habilitando a função Shop no perfil.', 140),
  ('o-que-sao-nichos',              'O que são nichos',                                         'Por que nicho determina sua audiência e suas vendas.', 150),
  ('conteudo-qualificado',          'Criando conteúdo qualificado',                             'O que torna um vídeo "qualificado" pro algoritmo.', 160),
  ('gravacao-com-agente-ia',        'Gravação de vídeos usando agente IA',                      'Fluxo de gravação assistido pelo Método TTS.', 170),
  ('estrutura-de-video',            'Passo a passo: estrutura de vídeo',                        'Gancho, dor, solução, estilo, caput, POV, unboxing, headlines e hashtags.', 180),
  ('copywriting-storytelling',      'Copywriting + storytelling de conexão',                    'Como escrever pra puxar conexão antes de vender.', 190)
) as l(slug, title, description, order_index)
where j.slug = 'jornada-1-bebe'
on conflict (journey_id, slug) do nothing;

-- Modulo 2: Rotina de Milhoes (2 aulas)
insert into public.journey_lessons
  (journey_id, module_id, slug, title, description, kind, body_md,
   order_index, xp_reward, requires_proof, is_published)
select j.id, m.id, l.slug, l.title, l.description, 'rich',
       E'_Aula em produção. Yara vai preencher em breve._',
       l.order_index, 10, false, true
from public.journeys j
join public.journey_modules m on m.journey_id = j.id and m.slug = 'rotina-de-milhoes'
cross join (values
  ('importancia-da-rotina',         'Importância da rotina',                                    'Por que disciplina vale mais que talento aqui.', 210),
  ('rotina-com-ia',                 'Como criar rotina usando IA',                              'Usando o agente do Método TTS pra montar a sua rotina diária.', 220)
) as l(slug, title, description, order_index)
where j.slug = 'jornada-1-bebe'
on conflict (journey_id, slug) do nothing;

-- Modulo 3: Mentalidade Blindada (3 aulas nomeadas, 7 placeholders pra Yara)
insert into public.journey_lessons
  (journey_id, module_id, slug, title, description, kind, body_md,
   order_index, xp_reward, requires_proof, is_published)
select j.id, m.id, l.slug, l.title, l.description, 'rich',
       E'_Aula em produção. Yara vai preencher em breve._',
       l.order_index, 10, false, true
from public.journeys j
join public.journey_modules m on m.journey_id = j.id and m.slug = 'mentalidade-blindada'
cross join (values
  ('mentalidade-1-segredo-sucesso', 'O Segredo Por Trás do Sucesso no TikTok Shop',             'Aula 1 de 10.', 310),
  ('mentalidade-2-por-que-desistem','Por Que 90% Desistem do TikTok Shop',                      'Aula 2 de 10.', 320),
  ('mentalidade-3-execucao',        'O Segredo que Ninguém Conta: Execução Vence Perfeição',    'Aula 3 de 10.', 330)
) as l(slug, title, description, order_index)
where j.slug = 'jornada-1-bebe'
on conflict (journey_id, slug) do nothing;

-- Modulo 4: Atraindo Seguidores (3 itens da spec, Semanas 2-4)
insert into public.journey_lessons
  (journey_id, module_id, slug, title, description, kind, body_md,
   order_index, xp_reward, requires_proof, is_published)
select j.id, m.id, l.slug, l.title, l.description, 'rich',
       E'_Aula em produção. Yara vai preencher em breve._',
       l.order_index, 10, false, true
from public.journeys j
join public.journey_modules m on m.journey_id = j.id and m.slug = 'atraindo-seguidores'
cross join (values
  ('atraindo-nicho',                'Atraindo seguidores qualificados pro seu nicho',           'Quem você quer atrair e como.', 410),
  ('low-fi-yap-content',            'Estratégia low-fi e yap content',                          'Por que conteúdo "imperfeito" vende mais que produção pesada.', 420),
  ('live-shop-magnetica',           'Live Shop magnética e de conexão',                         'Estrutura de live que prende audiência e converte.', 430)
) as l(slug, title, description, order_index)
where j.slug = 'jornada-1-bebe'
on conflict (journey_id, slug) do nothing;

-- ---------------------------------------------------------------------------
-- 8) Aula placeholder antiga ('aula-boas-vindas') — apaga pra nao confundir
--    com as aulas reais que acabamos de inserir. Se ela ainda nao foi
--    completada por ninguem, simplesmente some.
-- ---------------------------------------------------------------------------
delete from public.journey_lessons
where slug = 'aula-boas-vindas'
  and journey_id in (select id from public.journeys where slug = 'jornada-1-bebe')
  and not exists (
    select 1 from public.journey_lesson_progress p
    where p.lesson_id = journey_lessons.id and p.completed = true
  );
