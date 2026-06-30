-- =============================================================================
-- 0041 — Jornada 1 conteudo real Yara + unlock semanal do Modulo 4
-- =============================================================================
-- Yara entregou o conteudo final da J1. Esta migration:
--   1. Adiciona journey_modules.unlock_days_after_start (gate semanal)
--   2. Renomeia titulos dos modulos pro spec final
--   3. Limpa aulas orfas e residuais (configurando-conta, cadastrar-tts,
--      gravacao-com-agente-ia, importancia-da-rotina, e legacy aula-boas-vindas
--      / aula-02 / aula02 / aula-04 de dev anterior)
--   4. Atualiza youtube_id + titulos das aulas mantidas
--   5. Move 2 aulas de M1 pra M4 (estrutura-de-video, copywriting-storytelling)
--   6. Insere as 12 aulas novas (1 em M1, 4+1ebook em M2, 7 em M3, 2 em M4)
--   7. Modulo 4 trava 7 dias apos started_at — alunas Semana 1 so veem M1/M2/M3
--
-- Idempotente: rerodavel sem efeitos colaterais (UPSERTS + INSERTs com
-- ON CONFLICT DO UPDATE/NOTHING + DELETEs com WHERE explicito).
--
-- IMPORTANTE: M4 aulas ficam com kind='rich' + body_md placeholder ate
-- as lives serem gravadas. Quando Yara subir, ela troca pra kind='video'
-- + youtube_id via /admin/jornadas/[id].
--
-- O e-book do M2 (ebook-rotina) entra is_published=false ate Yara subir
-- o PDF. Sem isso, aparece como placeholder vazio na UI.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) SCHEMA — unlock_days_after_start
-- ---------------------------------------------------------------------------
alter table public.journey_modules
  add column if not exists unlock_days_after_start int not null default 0
  check (unlock_days_after_start between 0 and 365);

comment on column public.journey_modules.unlock_days_after_start is
  'Modulo trava ate N dias apos journey_progress.started_at da aluna. 0 = liberado desde o inicio. Calculo de locked feito na API/UI, nao na RLS.';

-- ---------------------------------------------------------------------------
-- 2) LIMPEZA — aulas orfas residuais (dev anterior, sem module_id)
-- ---------------------------------------------------------------------------
delete from public.journey_lessons
where journey_id = (select id from public.journeys where slug = 'jornada-1-bebe')
  and module_id is null
  and slug in ('aula-boas-vindas','aula-02','aula02','aula-04')
  and not exists (
    select 1 from public.journey_lesson_progress p
    where p.lesson_id = journey_lessons.id and p.completed = true
  );

-- ---------------------------------------------------------------------------
-- 3) RENOMEAR MODULOS — titulos novos do spec Yara (slugs mantidos)
-- ---------------------------------------------------------------------------
update public.journey_modules m
set title = 'Fundamentos TikTok Shop',
    description = 'Tudo que voce precisa pra comecar do zero: o que e TikTok Shop, como criar e configurar conta, escolher nicho e criar conteudo qualificado.',
    unlock_days_after_start = 0
from public.journeys j
where m.journey_id = j.id
  and j.slug = 'jornada-1-bebe'
  and m.slug = 'organizando-a-casa';

update public.journey_modules m
set title = 'Mais Rotina = Mais Resultados',
    description = 'Como montar uma rotina que entrega resultado: papel e caneta, planner, IA, do zero. Inclui e-book de apoio.',
    unlock_days_after_start = 0
from public.journeys j
where m.journey_id = j.id
  and j.slug = 'jornada-1-bebe'
  and m.slug = 'rotina-de-milhoes';

update public.journey_modules m
set title = 'Mentalidade Blindada',
    description = '10 aulas pra blindar sua cabeca: superar procrastinacao, perfeccionismo, medo, comparacao e virar uma mulher que cumpre promessas.',
    unlock_days_after_start = 0
from public.journeys j
where m.journey_id = j.id
  and j.slug = 'jornada-1-bebe'
  and m.slug = 'mentalidade-blindada';

update public.journey_modules m
set title = 'Semana 2 — Ao Vivo',
    description = 'Modulo gravado ao vivo na Semana 2: atrair seguidores, estrutura de video, copywriting, live shop e tipos de live. Libera 7 dias depois que voce comeca a Jornada.',
    unlock_days_after_start = 7
from public.journeys j
where m.journey_id = j.id
  and j.slug = 'jornada-1-bebe'
  and m.slug = 'atraindo-seguidores';

-- ---------------------------------------------------------------------------
-- 4) M1 — Fundamentos TikTok Shop (5 aulas finais)
-- ---------------------------------------------------------------------------

-- Update das 4 aulas existentes que continuam
update public.journey_lessons l
set kind = 'video', youtube_id = 'XflrXPm4sj0',
    title = 'O que é TikTok Shop',
    description = 'A maior plataforma de venda do mundo na palma da sua mao. Por que TikTok Shop muda o jogo pra criadoras.',
    order_index = 110, is_published = true
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'organizando-a-casa'
  and l.slug = 'o-que-e-tiktok-shop';

update public.journey_lessons l
set kind = 'video', youtube_id = 'bVofHSvwe-U',
    title = 'Criando conta no TikTok',
    description = 'Do zero a uma conta TikTok pronta pra Shop.',
    order_index = 120, is_published = true
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'organizando-a-casa'
  and l.slug = 'criando-conta-tiktok';

update public.journey_lessons l
set kind = 'video', youtube_id = '2j-Gr_feJls',
    title = 'O que são nichos',
    description = 'Por que nicho decide sua audiencia e suas vendas.',
    order_index = 140, is_published = true
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'organizando-a-casa'
  and l.slug = 'o-que-sao-nichos';

update public.journey_lessons l
set kind = 'video', youtube_id = 'sWgLiUGDPUk',
    title = 'Criando conteúdo qualificado',
    description = 'O que torna um video qualificado pro algoritmo do TikTok Shop.',
    order_index = 150, is_published = true
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'organizando-a-casa'
  and l.slug = 'conteudo-qualificado';

-- INSERT nova aula 3 de M1
insert into public.journey_lessons
  (journey_id, module_id, slug, title, description, kind, youtube_id,
   order_index, xp_reward, requires_proof, is_published)
select j.id, m.id, 'passo-a-passo-nova-conta',
       'Passo a passo: nova conta',
       'Fluxo completo pra montar uma conta TikTok pronta pra vender.',
       'video', 'vchiil9u_D8',
       130, 10, false, true
from public.journeys j
join public.journey_modules m on m.journey_id = j.id and m.slug = 'organizando-a-casa'
where j.slug = 'jornada-1-bebe'
on conflict (journey_id, slug) do update
  set youtube_id = excluded.youtube_id,
      title = excluded.title,
      description = excluded.description,
      kind = excluded.kind,
      order_index = excluded.order_index,
      module_id = excluded.module_id,
      is_published = excluded.is_published;

-- MOVE estrutura-de-video + copywriting-storytelling de M1 pra M4
update public.journey_lessons l
set module_id = (select m4.id from public.journey_modules m4
                 join public.journeys j on j.id = m4.journey_id
                 where j.slug = 'jornada-1-bebe' and m4.slug = 'atraindo-seguidores'),
    order_index = 440,
    description = 'Aula gravada ao vivo na Semana 2 — gancho, dor, solucao, estilo, caput, videos POV, unboxing, headlines e hashtags. Sera disponibilizada apos a live.',
    kind = 'rich',
    youtube_id = null,
    body_md = E'_Aula ao vivo agendada pra Semana 2. Quando a live acontecer, sobrimos a gravacao aqui ✨_'
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'organizando-a-casa'
  and l.slug = 'estrutura-de-video';

update public.journey_lessons l
set module_id = (select m4.id from public.journey_modules m4
                 join public.journeys j on j.id = m4.journey_id
                 where j.slug = 'jornada-1-bebe' and m4.slug = 'atraindo-seguidores'),
    order_index = 450,
    description = 'Aula gravada ao vivo na Semana 2 — copywriting + storytelling de conexao.',
    kind = 'rich',
    youtube_id = null,
    body_md = E'_Aula ao vivo agendada pra Semana 2. Quando a live acontecer, sobrimos a gravacao aqui ✨_'
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'organizando-a-casa'
  and l.slug = 'copywriting-storytelling';

-- DELETE 3 aulas obsoletas de M1
delete from public.journey_lessons l
using public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'organizando-a-casa'
  and l.slug in ('configurando-conta','cadastrar-tts','gravacao-com-agente-ia')
  and not exists (
    select 1 from public.journey_lesson_progress p
    where p.lesson_id = l.id and p.completed = true
  );

-- ---------------------------------------------------------------------------
-- 5) M2 — Mais Rotina = Mais Resultados (5 video + 1 ebook)
-- ---------------------------------------------------------------------------

-- DELETE importancia-da-rotina (consolidada com novas)
delete from public.journey_lessons l
using public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'rotina-de-milhoes'
  and l.slug = 'importancia-da-rotina'
  and not exists (
    select 1 from public.journey_lesson_progress p
    where p.lesson_id = l.id and p.completed = true
  );

-- UPDATE rotina-com-ia (retitle + youtube_id)
update public.journey_lessons l
set kind = 'video', youtube_id = 'wOH3Yt9Q7YI',
    title = 'Como usar IA para criar rotina',
    description = 'Usando IA pra montar sua rotina diaria do zero.',
    order_index = 240, is_published = true
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'rotina-de-milhoes'
  and l.slug = 'rotina-com-ia';

-- INSERT 4 video novas + 1 ebook
insert into public.journey_lessons
  (journey_id, module_id, slug, title, description, kind, youtube_id,
   order_index, xp_reward, requires_proof, is_published)
select j.id, m.id, x.slug, x.title, x.description, x.kind, x.youtube_id,
       x.order_index, 10, false, x.is_published
from public.journeys j
join public.journey_modules m on m.journey_id = j.id and m.slug = 'rotina-de-milhoes'
cross join (values
  ('como-criar-rotina',     'Como criar rotina',     'Os fundamentos pra montar uma rotina que entrega resultado.',                                   'video', 'IN9U0fnDFJM', 210, true),
  ('papel-e-caneta',        'Papel e caneta',         'Por que o papel ainda vence o digital quando voce esta comecando.',                            'video', 'wIX2dJWbH2k', 220, true),
  ('planner-e-agenda',      'Planner e agenda',       'Como organizar a semana inteira em 1 planner.',                                                 'video', 'wUFwrGdxY7Q', 230, true),
  ('criando-rotina-do-zero','Criando rotina do zero', 'A rotina que eu (Yara) sigo pra entregar conteudo todo dia.',                                  'video', 'AVY5XOa3aFI', 250, true),
  ('ebook-rotina',          'E-book: Rotina',         'Material complementar com a rotina escrita. Em breve.',                                         'ebook', null,           260, false)
) as x(slug, title, description, kind, youtube_id, order_index, is_published)
where j.slug = 'jornada-1-bebe'
on conflict (journey_id, slug) do update
  set youtube_id = excluded.youtube_id,
      title = excluded.title,
      description = excluded.description,
      kind = excluded.kind,
      order_index = excluded.order_index,
      module_id = excluded.module_id,
      is_published = excluded.is_published;

-- ---------------------------------------------------------------------------
-- 6) M3 — Mentalidade Blindada (10 aulas)
-- ---------------------------------------------------------------------------

-- UPDATE 3 existentes
update public.journey_lessons l
set kind = 'video', youtube_id = 'EOrTRn_sZDE', is_published = true, order_index = 310
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'mentalidade-blindada'
  and l.slug = 'mentalidade-1-segredo-sucesso';

update public.journey_lessons l
set kind = 'video', youtube_id = 'U_6vcA0D0p0', is_published = true, order_index = 320
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'mentalidade-blindada'
  and l.slug = 'mentalidade-2-por-que-desistem';

update public.journey_lessons l
set kind = 'video', youtube_id = '4Z9rwI8aGaM', is_published = true, order_index = 330
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'mentalidade-blindada'
  and l.slug = 'mentalidade-3-execucao';

-- INSERT 7 novas
insert into public.journey_lessons
  (journey_id, module_id, slug, title, description, kind, youtube_id,
   order_index, xp_reward, requires_proof, is_published)
select j.id, m.id, x.slug, x.title, x.description, 'video', x.youtube_id,
       x.order_index, 10, false, true
from public.journeys j
join public.journey_modules m on m.journey_id = j.id and m.slug = 'mentalidade-blindada'
cross join (values
  ('mentalidade-4-procrastinacao', 'A Procrastinação Inteligente: o maior inimigo do afiliado no TikTok Shop',  'Por que voce ADIA a acao mesmo sabendo o que fazer.',                          'VqQFw74h9tQ', 340),
  ('mentalidade-5-perfeccionismo', 'Perfeccionismo: o maior sabotador de resultados no TikTok Shop',           'Como o "tem que tar perfeito" mata seus videos antes deles existirem.',         'sBSsSpJjXs0', 350),
  ('mentalidade-6-medo-julgamento','O Medo do Julgamento: a maior prisão no TikTok Shop',                       'Por que voce trava na hora de gravar e como sair disso.',                       'OPV3Ku4H_lQ', 360),
  ('mentalidade-7-comparacao',     'Como a comparação sabota seus resultados no TikTok Shop',                   'Olhar pro lado mata seu progresso.',                                             'BlvFleLuY-E', 370),
  ('mentalidade-8-permanencia',    'A Permanência Vence: por que você desiste antes do método funcionar',       'Por que 90% para 1 dia antes de comecar a dar certo.',                          'BX3kl3MibmY', 380),
  ('mentalidade-9-acao-diaria',    'Ação Diária: a semente que transforma sonhos em realidade',                 'Como acoes pequenas todo dia viram resultado gigante.',                         'uMwwRnvtpnU', 390),
  ('mentalidade-10-mulher-promessas', 'Transforme-se em uma Mulher que Cumpre Promessas: o verdadeiro segredo', 'A pratica que muda voce de verdade — pra voce mesma antes de pros outros.',     'JPRP1WUKoDo', 400)
) as x(slug, title, description, youtube_id, order_index)
where j.slug = 'jornada-1-bebe'
on conflict (journey_id, slug) do update
  set youtube_id = excluded.youtube_id,
      title = excluded.title,
      description = excluded.description,
      kind = excluded.kind,
      order_index = excluded.order_index,
      module_id = excluded.module_id,
      is_published = excluded.is_published;

-- ---------------------------------------------------------------------------
-- 7) M4 — Semana 2 — Ao Vivo (6 aulas placeholder pra lives)
-- ---------------------------------------------------------------------------
-- atraindo-nicho, low-fi-yap-content, live-shop-magnetica ja existem em M4.
-- estrutura-de-video, copywriting-storytelling vieram do M1 (step 4).
-- Falta inserir: tipos-de-lives. E retitular os 3 existentes.

update public.journey_lessons l
set kind = 'rich', youtube_id = null,
    title = 'Atraindo seguidores qualificados / NICHO',
    description = 'Live: como atrair o seguidor certo pro seu nicho. Aula gravada ao vivo na Semana 2.',
    body_md = E'_Aula ao vivo agendada pra Semana 2. Quando a live acontecer, subimos a gravacao aqui ✨_',
    order_index = 410, is_published = true
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'atraindo-seguidores'
  and l.slug = 'atraindo-nicho';

update public.journey_lessons l
set kind = 'rich', youtube_id = null,
    title = 'Estratégia de produção de conteúdo: low-fi e yap content',
    description = 'Live: por que o conteudo "imperfeito" vende mais. Aula gravada ao vivo na Semana 2.',
    body_md = E'_Aula ao vivo agendada pra Semana 2. Quando a live acontecer, subimos a gravacao aqui ✨_',
    order_index = 420, is_published = true
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'atraindo-seguidores'
  and l.slug = 'low-fi-yap-content';

update public.journey_lessons l
set kind = 'rich', youtube_id = null,
    title = 'Live Shop + magnética + conexão',
    description = 'Live: estrutura de live shop que prende audiencia e converte. Aula gravada ao vivo na Semana 2.',
    body_md = E'_Aula ao vivo agendada pra Semana 2. Quando a live acontecer, subimos a gravacao aqui ✨_',
    order_index = 430, is_published = true
from public.journey_modules m, public.journeys j
where l.module_id = m.id and m.journey_id = j.id
  and j.slug = 'jornada-1-bebe' and m.slug = 'atraindo-seguidores'
  and l.slug = 'live-shop-magnetica';

-- INSERT tipos-de-lives
insert into public.journey_lessons
  (journey_id, module_id, slug, title, description, kind, body_md,
   order_index, xp_reward, requires_proof, is_published)
select j.id, m.id, 'tipos-de-lives',
       'Tipos de lives',
       'Live: os formatos de live que mais convertem em vendas. Aula gravada ao vivo na Semana 2.',
       'rich',
       E'_Aula ao vivo agendada pra Semana 2. Quando a live acontecer, subimos a gravacao aqui ✨_',
       460, 10, false, true
from public.journeys j
join public.journey_modules m on m.journey_id = j.id and m.slug = 'atraindo-seguidores'
where j.slug = 'jornada-1-bebe'
on conflict (journey_id, slug) do update
  set title = excluded.title,
      description = excluded.description,
      kind = excluded.kind,
      body_md = excluded.body_md,
      order_index = excluded.order_index,
      module_id = excluded.module_id,
      is_published = excluded.is_published;

-- ---------------------------------------------------------------------------
-- 8) J2 e J3 — confirma is_admin_only=true (segurança extra)
-- ---------------------------------------------------------------------------
update public.journeys
set is_admin_only = true
where slug in ('jornada-2-adolescente','jornada-3-adulta');
