-- =============================================================================
-- 0014 — Educação: Seed dos 8 módulos + 22 aulas (Método TTS)
-- =============================================================================
-- Estrutura entregue pelo Felipe. Aulas video usam YouTube embed (URLs ele
-- ja mandou). Aulas rich/checklist tem conteudo placeholder editorial que
-- o admin pode editar depois pelo painel.
--
-- Migration idempotente: usa "on conflict (slug) do nothing" pra nao
-- duplicar se rodar 2x. Pra atualizar conteudo de aula existente, use o
-- /admin/educacao.
-- =============================================================================

-- ============================================================================
-- 1) MODULOS
-- ============================================================================

insert into public.education_modules (slug, title, subtitle, description, accent, order_index, is_published)
values
  ('fundamentos',
   'Fundamentos · Comece Aqui',
   'A base. Antes de tudo.',
   'O ponto de partida pra quem nunca vendeu no TikTok Shop ou ja vende mas quer entender o método do zero. Aqui você descobre o que é a plataforma, instala o app, conhece a IA e aprende o que postar no primeiro dia.',
   'rose',
   0,
   true),

  ('estrutura-rotina',
   '1 · Estrutura e Rotina',
   'Como criar uma rotina que vira venda.',
   'Hábito > inspiração. Esse módulo te ensina a estruturar a semana, a organizar conteúdo com papel e caneta + planner, e a usar a IA pra montar a rotina que cabe na sua vida.',
   'peach',
   1,
   true),

  ('producao-conteudo',
   '2 · Produção de Conteúdo',
   'Grava sem editar. Posta sem trava.',
   'O método de gravação pra você produzir 4-5 vídeos por dia sem precisar editar. Só celular, luz natural e roteiro pronto.',
   'lilac',
   2,
   true),

  ('live-magnetica',
   '3 · Live Magnética',
   'A live que vende sozinha.',
   'Como estruturar uma live que prende, converte e ainda viraliza. Posicionamento, hook, ofertas e CTAs que funcionam ao vivo.',
   'rose',
   3,
   true),

  ('analise-perfil',
   '4 · Análise de Perfil',
   'Olha pra dentro antes de postar mais.',
   'Revisão estratégica do seu perfil, sua bio, seu posicionamento. Identifica o que tá funcionando e o que precisa ajustar antes da próxima rodada de conteúdo.',
   'peach',
   4,
   true),

  ('diretrizes-vitrine',
   '5 · Diretrizes + Vitrine',
   'O que pode e o que não pode no TikTok Shop.',
   'As regras da plataforma resumidas, as armadilhas comuns que pegam shadowban e como deixar sua vitrine pronta pra escalar.',
   'lilac',
   5,
   true),

  ('segundo-cerebro',
   '6 · IA · Segundo Cérebro · Escala',
   'Sua IA pessoal pra escalar conteúdo.',
   'Configurando o segundo cérebro digital — sistema de prompts, templates e fluxos pra produzir conteúdo em escala usando os agentes do Método TTS.',
   'rose',
   6,
   true),

  ('lives-arquivo',
   '7 · Lives · Encontros com a Yara',
   'O acervo dos encontros ao vivo.',
   'Replays das lives da Yara organizados por data. Estratégias validadas, análises de perfil em tempo real, novidades da plataforma.',
   'peach',
   7,
   true)
on conflict (slug) do nothing;

-- ============================================================================
-- 2) AULAS — MÓDULO 0: FUNDAMENTOS
-- ============================================================================

insert into public.education_videos
  (slug, title, description, category, kind, youtube_id, body_md, checklist_items, module_id, order_index, is_published)
select
  v.slug, v.title, v.description, v.category, v.kind, v.youtube_id, v.body_md, v.checklist_items::jsonb,
  (select id from public.education_modules where slug = 'fundamentos'),
  v.order_index, true
from (values
  (
    'fund-o-que-e-tiktok-shop',
    'O que é TikTok Shop · 10 passos pra começar a vender',
    'Aula introdutória: o que é a plataforma, como ela funciona, e os 10 passos práticos pra você começar a vender hoje.',
    'Fundamentos',
    'video',
    'nAIupljAzzQ',
    null,
    null,
    0
  ),
  (
    'fund-check-list-1',
    'Check List 1 · Primeiros passos',
    'Marca o que você já fez. Cada item é um degrau pra você estar 100% pronta.',
    'Fundamentos',
    'checklist',
    null,
    E'A primeira semana é sobre **fundação**. Não precisa fazer tudo de uma vez — marca aqui o que você já cumpriu e foca no próximo.\n\nA cada item marcado, você tá um passo mais perto da primeira venda.',
    '[
      {"text":"Cadastrei minha conta de criadora no TikTok Shop"},
      {"text":"Verifiquei minha identidade na plataforma"},
      {"text":"Cadastrei meu primeiro produto no app (catálogo)"},
      {"text":"Defini meu nicho principal (skincare, makeup, etc.)"},
      {"text":"Postei meu primeiro vídeo usando um roteiro do app"},
      {"text":"Marquei o produto no vídeo via link de afiliada"},
      {"text":"Anotei a métrica do primeiro vídeo (views, watch time)"},
      {"text":"Bati a meta de 1 vídeo por dia na primeira semana"},
      {"text":"Configurei minha conta bancária pra receber comissão"},
      {"text":"Salvei 3 roteiros bons na biblioteca de scripts do app"}
    ]',
    1
  ),
  (
    'fund-usando-ia',
    'Fundamentos usando IA',
    'Como usar os 10 agentes do Método TTS desde o primeiro dia — análise, scripts por nicho, tira-dúvida.',
    'Fundamentos',
    'rich',
    null,
    E'## O método em três frases\n\nO Método TTS não é só uma IA — é **um sistema**. Os agentes conversam com você como amiga, organizam o que você cadastrou e te entregam roteiro pronto pra gravar.\n\nVamos por partes.\n\n## Os agentes que você vai usar\n\n### Info · Análise de Produto\n\nManda foto, link ou texto do produto. A Info devolve em segundos:\n\n- Público-alvo (quem compra)\n- Dor que o produto resolve\n- Gatilhos emocionais\n- Objeções comuns\n- 5 hooks de abertura\n\n> **Use sempre** antes de pedir roteiro. A análise vira a base pro Scripts entregar algo certeiro.\n\n### Scripts por Nicho\n\nDepois da análise, escolhe o agente do seu nicho (Skincare, Makeup, Suplementos, Cabelo, Perfumes, Casa, Moda, Eletrônicos). Cada um sabe as regras do nicho — sem promessa de cura no skincare, sem termo proibido no suplemento, etc.\n\nVocê pede o roteiro, escolhe o estilo (fofoca, polêmico, educativo, storytelling, transformação) e **salva no app** o que curtir.\n\n### Suporte · Tira-dúvida\n\nQualquer dúvida sobre TikTok Shop, comissão, frete, regra de conteúdo — pergunta no Suporte. Resposta na hora, em português.\n\n## A regra de ouro\n\n**A IA é consultora, não autora.** Nada salva sem você clicar. Você é a curadora do que vira seu conteúdo. Isso é o que diferencia o Método TTS de qualquer ferramenta de IA gringa — você no controle do começo ao fim.',
    null,
    2
  ),
  (
    'fund-duvidas-frequentes',
    'Dúvidas Frequentes',
    'Respostas pras 8 perguntas que toda criadora faz quando começa.',
    'Fundamentos',
    'rich',
    null,
    E'## As 8 perguntas mais comuns\n\n### 1. Quanto tempo até a primeira venda?\n\nO primeiro **roteiro** sai em 30 segundos. A primeira **venda** depende do seu funil, mas a maior parte das alunas vê resultado na primeira semana usando a rotina.\n\n### 2. Preciso de câmera profissional?\n\nNão. Celular é mais que suficiente. Inclusive **prefira o celular** — vídeo de criadora deve parecer feito por criadora, não por estúdio.\n\n### 3. Quantos vídeos por dia eu preciso postar?\n\nMeta inicial: **1 por dia**. Quando virar hábito, sobe pra 3-5. Quem posta 5 sem largar tá no jogo pra escalar.\n\n### 4. Posso usar os mesmos roteiros pra produtos diferentes?\n\nNão é o ideal. Cada produto tem dor diferente. Cadastra o produto, pede a análise (Info), aí pede o roteiro (Scripts).\n\n### 5. Como faço pra evitar shadowban?\n\nLê as **Diretrizes** (módulo 5). Em resumo: nada de promessa milagrosa, nada de termo médico proibido, nada de fake. Os roteiros do app já respeitam isso.\n\n### 6. Tem limite de uso da IA?\n\nNão. Ilimitado em tudo — análise, roteiro, salvamento, pergunta no suporte.\n\n### 7. Funciona se eu vender em mais de 1 nicho?\n\nSim. Cada produto pode ser cadastrado num nicho diferente. Os agentes de Scripts são separados por nicho — você escolhe na hora de pedir.\n\n### 8. E se eu travar de novo?\n\nVolta no Suporte. Pergunta. Não tem dúvida burra — tem dúvida não-perguntada.',
    null,
    3
  ),
  (
    'fund-prompts-nichos',
    'Prompts · Como fazer + Nichos',
    'Os prompts que toda criadora salva. Copia, cola na conversa com o agente, ajusta.',
    'Fundamentos',
    'rich',
    null,
    E'## Como usar esses prompts\n\nCopia o prompt, abre a conversa com o agente certo (Info, Scripts do nicho, ou Suporte) e cola. Ajusta o que estiver entre colchetes `[ ]` pro seu caso.\n\n---\n\n## Prompt 1 · Análise rápida (Info)\n\n```\nAnalisa esse produto pra mim:\nNome: [nome do produto]\nLink/foto: [cola aqui]\n\nQuero saber: público-alvo, dor que resolve, 3 gatilhos emocionais e 5 hooks de abertura.\n```\n\n## Prompt 2 · Roteiro fofoca (Scripts)\n\n```\nGera um roteiro estilo fofoca de 30 segundos pro [nome do produto]. Hook na primeira pessoa, contando algo que aconteceu comigo. Termina com CTA leve pro link.\n```\n\n## Prompt 3 · Roteiro educativo (Scripts)\n\n```\nQuero um roteiro educativo sobre [tema/produto]. Estrutura: hook curioso de 3s, 3 fatos surpreendentes, CTA pro link. Sem termo técnico.\n```\n\n## Prompt 4 · Roteiro transformação (Scripts)\n\n```\nMonta um antes/depois com o [produto] na rotina de [tempo: 7/14/30 dias]. Foco na sensação real de quem usou. Sem promessa de cura.\n```\n\n## Prompt 5 · Dúvida sobre a plataforma (Suporte)\n\n```\nMe explica como funciona [dúvida específica: comissão / frete / shadowban / política X]. Quero entender simples.\n```\n\n---\n\n## Dica de uso\n\nDepois que o agente entregar, **lê alto em voz** antes de gravar. Se travou em alguma frase, pede pra reescrever. Roteiro bom é o que sai natural na sua boca.',
    null,
    4
  )
) as v(slug, title, description, category, kind, youtube_id, body_md, checklist_items, order_index)
on conflict (slug) do nothing;

-- ============================================================================
-- 3) AULAS — MÓDULO 1: ESTRUTURA E ROTINA
-- ============================================================================

insert into public.education_videos
  (slug, title, description, category, kind, youtube_id, body_md, checklist_items, module_id, order_index, is_published)
select
  v.slug, v.title, v.description, v.category, v.kind, v.youtube_id, v.body_md, v.checklist_items::jsonb,
  (select id from public.education_modules where slug = 'estrutura-rotina'),
  v.order_index, true
from (values
  ('rotina-introducao', 'Introdução à Rotina', 'Por que rotina é o que separa quem posta de quem vende.', 'Estrutura e Rotina', 'video', 'IN9U0fnDFJM', null, null, 0),
  ('rotina-papel-caneta', 'Papel e Caneta', 'Por que escrever a mão antes de gravar muda tudo.', 'Estrutura e Rotina', 'video', 'wIX2dJWbH2k', null, null, 1),
  ('rotina-planner-agenda', 'Planner e Agenda', 'Como organizar a semana visualmente sem complicar.', 'Estrutura e Rotina', 'video', 'wUFwrGdxY7Q', null, null, 2),
  ('rotina-ia-criar-rotina', 'Como usar IA pra criar rotina', 'Prompt e fluxo pra IA montar sua rotina semanal sob medida.', 'Estrutura e Rotina', 'video', 'wOH3Yt9Q7YI', null, null, 3),
  (
    'rotina-ebook',
    'E-book · Estrutura e Rotina',
    'O resumo escrito da estrutura ideal pra você consultar quando precisar.',
    'Estrutura e Rotina',
    'rich',
    null,
    E'## A semana ideal do Método TTS\n\nNão tem uma rotina única que serve pra todo mundo. Tem **princípios** que toda rotina precisa ter pra virar venda.\n\n## Os 4 blocos da semana\n\n### Bloco 1 · Planejamento (Domingo)\n\n- Cadastra os produtos da semana no app (catálogo)\n- Pede análise (Info) pra cada um\n- Lista os hooks que mais te chamaram atenção\n- Define meta de vídeos da semana\n\n### Bloco 2 · Produção (Segunda + Terça)\n\n- Gera 5 roteiros por produto (Scripts)\n- Salva os 2-3 melhores na biblioteca\n- Imprime ou anota os roteiros que vai gravar\n- Bloco de gravação: 2 horas sem distração\n\n### Bloco 3 · Postagem (Quarta a Sexta)\n\n- 1 vídeo por dia minimo\n- Anota métrica do dia anterior\n- Ajusta hook se algo não funcionou\n\n### Bloco 4 · Análise (Sábado)\n\n- Revisa o que viralizou e por que\n- Atualiza a rotina pra semana seguinte\n- Marca progresso no app\n\n## A regra mais importante\n\n**Constância > intensidade.** Postar 1 vídeo por dia por 30 dias bate postar 10 vídeos num dia e sumir 9 dias. Sempre.\n\n## Quando travar\n\n- Volta no agente Suporte\n- Pergunta o que tá travando\n- A IA já ajudou +500 alunas com travas parecidas\n\n> Hábito é o que diferencia quem posta 1 vez por semana de quem posta 5 por dia. O Método TTS te dá a estrutura — você dá a disciplina.',
    null,
    4
  )
) as v(slug, title, description, category, kind, youtube_id, body_md, checklist_items, order_index)
on conflict (slug) do nothing;

-- ============================================================================
-- 4) AULAS — MÓDULO 2: PRODUÇÃO DE CONTEÚDO
-- ============================================================================

insert into public.education_videos
  (slug, title, description, category, kind, youtube_id, body_md, checklist_items, module_id, order_index, is_published)
select
  v.slug, v.title, v.description, v.category, v.kind, v.youtube_id, v.body_md, v.checklist_items::jsonb,
  (select id from public.education_modules where slug = 'producao-conteudo'),
  v.order_index, true
from (values
  ('prod-gravar-sem-editar', 'Gravar Sem Editar', 'O método de produção que te dá 4-5 vídeos por dia sem precisar passar 3 horas no CapCut.', 'Produção', 'video', 'nAIupljAzzQ', null, null, 0),
  (
    'prod-ebook-gravar-sem-editar',
    'E-book · Gravar Sem Editar',
    'O passo a passo escrito do método de gravação raw — perfeito pra consultar antes de cada bloco de produção.',
    'Produção',
    'rich',
    null,
    E'## O método "gravar sem editar"\n\nA verdade nua: a maioria das alunas trava porque pensa que precisa editar. Não precisa. Vídeo cru com hook bom converte mais que vídeo editado com hook ruim.\n\n## A regra dos 4 pontos\n\n### 1 · Luz natural\n\nJanela na sua frente. Sem ring light, sem softbox, sem complicação. Janela da cozinha às 10h da manhã é o melhor estúdio do mundo.\n\n### 2 · Roteiro impresso\n\nLê alto, olha pra câmera, lê outra parte, olha pra câmera. Você não precisa decorar — precisa parecer que tá conversando.\n\n### 3 · Take único quando der\n\nSe errou no meio, **continua**. Edição mínima depois é melhor que regravar 8 vezes. O TikTok adora autenticidade.\n\n### 4 · Sem música overlay\n\nVocê falando direto na câmera segura mais. Música só atrapalha o algoritmo entender que é UGC autêntico.\n\n## O bloco de produção ideal\n\n- 2 horas reservadas\n- 5 roteiros impressos\n- Celular no tripé na altura do peito\n- Bloco silencioso (sem outras pessoas em casa)\n- Pausa de 5 min entre cada take\n\n## Resultado\n\n5 vídeos prontos em 2 horas. Posta 1 por dia. Você fica livre o resto da semana pra:\n\n- Cadastrar produtos novos\n- Analisar métrica\n- Responder comentário\n- Viver\n\n## A armadilha\n\n**Não vire editora de vídeo.** Você é criadora de conteúdo. Edita = 30 minutos. Vídeo = 30 segundos. Não vale.',
    null,
    1
  )
) as v(slug, title, description, category, kind, youtube_id, body_md, checklist_items, order_index)
on conflict (slug) do nothing;

-- ============================================================================
-- 5) AULAS — MÓDULO 3: LIVE MAGNÉTICA
-- ============================================================================

insert into public.education_videos
  (slug, title, description, category, kind, youtube_id, body_md, checklist_items, module_id, order_index, is_published)
select
  v.slug, v.title, v.description, v.category, v.kind, v.youtube_id, v.body_md, v.checklist_items::jsonb,
  (select id from public.education_modules where slug = 'live-magnetica'),
  v.order_index, true
from (values
  ('live-magnetica-1', 'Live Magnética · Parte 1', 'Os fundamentos da live que vende: hook, estrutura, ofertas, CTAs.', 'Live Magnética', 'video', '6q1f3SN6DOQ', null, null, 0),
  (
    'live-magnetica-ebook',
    'E-book · Live Magnética',
    'O guia escrito da live magnética — estrutura, scripts e checkpoints.',
    'Live Magnética',
    'rich',
    null,
    E'## A live que vende sozinha\n\nLive não é improviso. É **estrutura**. Quem improvisa, fala 2 horas e vende zero. Quem tem estrutura, fala 40 minutos e bate meta.\n\n## A estrutura magnética\n\n### 0-5 minutos · Hook\n\nUma frase que pega. Não começa com "oi gente". Começa com algo que faz a pessoa parar:\n\n- "Tô prestes a mostrar o erro que faz 90% das criadoras não venderem"\n- "Hoje eu trago a estratégia que multiplicou minha venda por 3 em 30 dias"\n- "Tá quem quer aprender a vender no TikTok Shop sem precisar postar 10 vezes por dia"\n\n### 5-25 minutos · Valor puro\n\nEnsina algo. **De verdade.** Quem tá vendo precisa sair da live com algo que dá pra aplicar amanhã. Sem segurar info pra trás.\n\n### 25-35 minutos · Caso real\n\nUma aluna que aplicou e o resultado. Nome, contexto, antes/depois. Histórias vendem mais que argumento.\n\n### 35-45 minutos · Oferta\n\nApresenta o produto/método/curso. Foco no benefício — não na feature. "Vai te dar X resultado" > "Tem 10 módulos".\n\n### 45+ minutos · Q&A + Fechamento\n\nResponde dúvida real. Quem dúvida, compra. Quem não pergunta, geralmente já saiu.\n\n## A checklist pré-live\n\n- [ ] Roteiro escrito\n- [ ] Hook decorado\n- [ ] 3 casos reais escolhidos\n- [ ] Link da oferta na bio\n- [ ] CTA escrito\n- [ ] Luz testada\n- [ ] Som testado\n- [ ] Chat respondedor designado\n\n## Erro mais comum\n\n**Não fazer hook.** A live começa com "oi gente, tudo bem?", e em 2 minutos perdeu metade da audiência. O hook é tudo.',
    null,
    1
  ),
  ('live-magnetica-2', 'Live Magnética · Parte 2', 'Aprofundamento: como segurar audiência depois de 30 minutos e converter no final.', 'Live Magnética', 'video', '6q1f3SN6DOQ', null, null, 2)
) as v(slug, title, description, category, kind, youtube_id, body_md, checklist_items, order_index)
on conflict (slug) do nothing;

-- ============================================================================
-- 6) AULAS — MÓDULO 4: ANÁLISE DE PERFIL
-- ============================================================================

insert into public.education_videos
  (slug, title, description, category, kind, youtube_id, body_md, checklist_items, module_id, order_index, is_published)
select
  v.slug, v.title, v.description, v.category, v.kind, v.youtube_id, v.body_md, v.checklist_items::jsonb,
  (select id from public.education_modules where slug = 'analise-perfil'),
  v.order_index, true
from (values
  (
    'analise-resumo-semana-1',
    'Resumo · Semana 1',
    'O que você precisa ter feito até o final da primeira semana — e como avaliar.',
    'Análise',
    'rich',
    null,
    E'## A primeira semana é diagnóstico\n\nNão é pra você bater meta de venda. É pra você **entender seu padrão**. Se você posta toda noite e zero engaja, é dado. Se posta de manhã e engaja, é dado. Os números importam.\n\n## O que você deveria ter feito\n\n- Cadastrou pelo menos 5 produtos no catálogo\n- Pediu análise (Info) pra cada um\n- Gerou pelo menos 10 roteiros (Scripts)\n- Salvou os melhores na biblioteca\n- Postou pelo menos 5 vídeos\n- Anotou views, watch time e comentário de cada um\n\n## O que você aprende olhando os dados\n\n### Watch time abaixo de 3s\n\n→ Hook tá fraco. Próxima semana, foca em hook estilo curiosidade ou polêmica.\n\n### Watch time 3-10s mas zero engajamento\n\n→ Desenvolvimento perdeu a pessoa. Próxima semana, encurta o meio do vídeo.\n\n### Comentário negativo\n\n→ Não é ruim. **É ouro.** Crítica honesta mostra o que precisa ajustar.\n\n### Algoritmo entregando pra público errado\n\n→ Hashtag, áudio ou tema fora do nicho. Volta no Info pra re-analisar o público.\n\n## A pergunta final da semana\n\n**O que eu aprendi sobre o meu nicho que não sabia segunda-feira?**\n\nSe a resposta é "nada", você não tá analisando — tá só postando. Pega o agente Suporte e conversa sobre os dados.',
    null,
    0
  ),
  (
    'analise-de-perfil',
    'Análise de Perfil',
    'Como olhar pro seu perfil com olhar de comprador e ajustar bio, foto e primeiros 9 vídeos.',
    'Análise',
    'rich',
    null,
    E'## Olha pro seu perfil como uma desconhecida\n\nAbre seu próprio perfil no TikTok. Finge que você é uma pessoa que NUNCA te viu. O que te chamaria pra clicar em seguir?\n\nSe a resposta é "nada", você tem trabalho.\n\n## Os 3 elementos críticos\n\n### 1 · Foto de perfil\n\n- Rosto bem iluminado\n- Você sorrindo (vende mais que séria)\n- Sem produto na foto (vai pros vídeos)\n- Fundo neutro\n\n### 2 · Bio · 80 caracteres\n\nFormula: **[O que faço] + [pra quem] + [resultado]**\n\nExemplo bom:\n- "Skincare honesto pra pele oleosa real 💕"\n- "Suplementação que cabe na rotina de mãe"\n\nExemplo ruim:\n- "Vivendo um dia de cada vez ✨" (não diz nada)\n- "Empresária | Mãe | Esposa" (não vende)\n\n### 3 · Primeiros 9 vídeos (a grade)\n\nQuem chega no seu perfil bate olho na grade. Se os 9 vídeos parecem aleatórios, ninguém segue.\n\n**Truque:** os 9 primeiros precisam contar a mesma história. Você pode até variar tema, mas a estética precisa parecer da mesma criadora.\n\n## A checklist de auditoria mensal\n\n- [ ] Foto de perfil ainda condiz com a marca?\n- [ ] Bio precisa atualizar?\n- [ ] Os 9 vídeos da grade contam uma história?\n- [ ] Link na bio aponta pra oferta atual?\n- [ ] Nome de exibição tá fácil de buscar?\n\nFaz isso 1x por mês. Demora 10 minutos. Multiplica seguidor.',
    null,
    1
  )
) as v(slug, title, description, category, kind, youtube_id, body_md, checklist_items, order_index)
on conflict (slug) do nothing;

-- ============================================================================
-- 7) AULAS — MÓDULO 5: DIRETRIZES + VITRINE
-- ============================================================================

insert into public.education_videos
  (slug, title, description, category, kind, youtube_id, body_md, checklist_items, module_id, order_index, is_published)
select
  v.slug, v.title, v.description, v.category, v.kind, v.youtube_id, v.body_md, v.checklist_items::jsonb,
  (select id from public.education_modules where slug = 'diretrizes-vitrine'),
  v.order_index, true
from (values
  (
    'diretrizes-tiktok-shop',
    'Diretrizes do TikTok Shop',
    'O que pode, o que não pode, e como evitar shadowban antes que aconteça.',
    'Diretrizes',
    'rich',
    null,
    E'## As regras que toda criadora precisa saber\n\nO TikTok Shop tem diretrizes claras. Quebrou, leva shadowban (vídeo não aparece pra ninguém). Reincidiu, perde a conta. Não é brincadeira.\n\nA boa: os roteiros do Método TTS **já respeitam** todas essas regras. Mas vale você conhecer pra não improvisar fora.\n\n## ❌ O que NÃO pode\n\n### Promessa de cura ou tratamento médico\n\n- "Cura acne" → **NÃO**\n- "Trata calvície" → **NÃO**  \n- "Emagrece 10kg" → **NÃO**\n- "Ajuda na rotina de skincare" → ✅ ok\n- "Hidrata profundamente" → ✅ ok\n\n### Termo médico restrito\n\nEvita: "medicamento", "remédio", "doença", "doutor", "clínico". Esses ativam filtro automático.\n\n### Comparação direta com concorrente\n\n- "Funciona melhor que [marca X]" → **NÃO**\n- "Eu testei outros e esse foi o que mais gostei" → ✅ ok\n\n### Conteúdo falso / fake testimonial\n\nVocê **precisa** ter usado o produto. Inventou resultado, leva ban.\n\n### Hashtag proibida\n\n#tiktokmademebuyit funcionou um tempo mas hoje tá saturada. Cuidado com tags que parecem gancho mas são genéricas demais — algoritmo penaliza.\n\n## ✅ O que ajuda\n\n- **Mostra o produto em uso** (não só foto)\n- **Som original** (sua voz) pega mais que música popular\n- **Resposta a comentário** sobe muito o vídeo\n- **Hashtag específica do nicho** > genérica\n- **Bio com link correto** (TikTok valoriza)\n\n## Vitrine: organização da loja TikTok Shop\n\n- Foto de capa de cada produto: limpa, fundo branco\n- Descrição: fala benefício, não feature\n- Preço: sem promoção falsa (TikTok detecta)\n- Estoque: mantém atualizado\n\n## A regra mestre\n\nO algoritmo do TikTok premia **autenticidade**. Tudo que parece comercial demais perde alcance. Tudo que parece conversa entre amigas voa.',
    null,
    0
  )
) as v(slug, title, description, category, kind, youtube_id, body_md, checklist_items, order_index)
on conflict (slug) do nothing;

-- ============================================================================
-- 8) AULAS — MÓDULO 6: SEGUNDO CÉREBRO
-- ============================================================================

insert into public.education_videos
  (slug, title, description, category, kind, youtube_id, body_md, checklist_items, module_id, order_index, is_published)
select
  v.slug, v.title, v.description, v.category, v.kind, v.youtube_id, v.body_md, v.checklist_items::jsonb,
  (select id from public.education_modules where slug = 'segundo-cerebro'),
  v.order_index, true
from (values
  (
    'cerebro-o-que-e',
    'O que é o Segundo Cérebro',
    'O conceito por trás do sistema de IA do Método TTS — por que ele faz tanta diferença.',
    'Segundo Cérebro',
    'rich',
    null,
    E'## Segundo cérebro = memória externa pra escalar\n\nO termo veio do livro "Building a Second Brain". A ideia: seu cérebro é ótimo pra ter ideia, péssimo pra guardar muita coisa.\n\nVocê acessa 100 informações por dia. Esquece 95. Aplicado a vendas no TikTok Shop, isso é **desastre**.\n\nO Método TTS é seu segundo cérebro pra TikTok Shop.\n\n## O que entra no seu segundo cérebro\n\n### Produtos\n\nCada produto cadastrado tem análise completa, hooks, gatilhos. Você não precisa lembrar — o app lembra.\n\n### Scripts\n\nRoteiros que funcionaram ficam salvos. Próximo produto similar, você adapta um já validado.\n\n### Rotina\n\nMétricas de aderência semanal. Você não precisa achar que tá melhorando — você **vê**.\n\n### Conhecimento\n\nAulas, lives, ebooks, news — tudo num lugar só. Quando travar, consulta.\n\n## Por que isso te dá escala\n\nSem segundo cérebro, você re-cria do zero a cada produto novo. Com segundo cérebro:\n\n- Cadastra um produto novo → análise em 30s (já sabe como vender)\n- Roteiro novo? Adapta o template que funcionou semana passada\n- Métrica caiu? Olha o histórico e vê o que mudou\n\n**Escala = fazer mais sem aumentar esforço.** Segundo cérebro é o que viabiliza.\n\n## A grande mudança de mindset\n\nVocê não precisa ser organizada de natureza. Você precisa de **um sistema** que organize por você. O Método TTS é esse sistema.',
    null,
    0
  ),
  ('cerebro-configurando', 'Configurando meu Segundo Cérebro · 15/04', 'Aula prática mostrando como organizar produtos, scripts e fluxos no app pra escalar.', 'Segundo Cérebro', 'video', 'AIlh78pMHW0', null, null, 1),
  (
    'cerebro-estrategia-gravar-postar',
    'Estratégia · Gravar na sequência de postar',
    'Por que separar produção de postagem dobra sua produtividade.',
    'Segundo Cérebro',
    'rich',
    null,
    E'## O erro: gravar 1, postar 1, gravar 1, postar 1\n\nA maioria das criadoras grava o vídeo, edita, posta e SÓ DEPOIS pensa no próximo. Resultado: 1 vídeo por dia no melhor cenário, ou 1 por semana no pior.\n\n## A estratégia: gravar em bloco\n\n**Bloco de produção:** 1-2 vezes por semana, grava 5-7 vídeos em sequência.\n\n**Bloco de postagem:** posta 1 vídeo por dia, em horário consistente.\n\nIsso desacopla as duas atividades. Você fica livre 5 dias por semana.\n\n## Como organizar o bloco de produção\n\n### Domingo à noite (planejamento)\n\n- Lista 7 produtos pra semana\n- Roda análise (Info) em todos\n- Gera scripts (Scripts) em todos\n- Imprime ou anota os 7 roteiros escolhidos\n\n### Segunda manhã (produção)\n\n- 2h reservadas\n- Mesma roupa? Tudo bem, o algoritmo não liga\n- Mesma luz, mesmo ângulo\n- 1 take por vídeo (sai do perfeccionismo)\n- 30 min de buffer pro imprevisto\n\n### Terça a domingo (postagem)\n\n- 1 vídeo por dia\n- Horário consistente (testa entre 18-21h primeiro)\n- Responde comentário no mesmo dia\n\n## O resultado\n\n- 7 vídeos por semana\n- 2 horas de produção\n- 5 dias 100% livres\n\n## A regra que cabe na cabeça\n\n**Produzir e postar são atividades diferentes. Trata como diferentes.**\n\nSe você grava sob pressão de postar amanhã, vai gravar mal. Se você grava em bloco com calma, posta com sobra.',
    null,
    2
  )
) as v(slug, title, description, category, kind, youtube_id, body_md, checklist_items, order_index)
on conflict (slug) do nothing;

-- ============================================================================
-- 9) AULAS — MÓDULO 7: LIVES ARQUIVO
-- ============================================================================

insert into public.education_videos
  (slug, title, description, category, kind, youtube_id, body_md, checklist_items, module_id, order_index, is_published)
select
  v.slug, v.title, v.description, v.category, v.kind, v.youtube_id, v.body_md, v.checklist_items::jsonb,
  (select id from public.education_modules where slug = 'lives-arquivo'),
  v.order_index, true
from (values
  (
    'lives-vitrine-magnetica-17-04',
    'Live · Vitrine Magnética · 17/04',
    'Encontro ao vivo sobre como deixar sua vitrine pronta pra escalar — replay disponível em breve.',
    'Lives',
    'rich',
    null,
    E'## Replay em preparação\n\nA gravação dessa live tá sendo organizada e logo aparece aqui. Enquanto isso, segue um resumo do que rolou:\n\n## Tópicos abordados\n\n- Como organizar a vitrine do TikTok Shop pra parecer profissional\n- Foto de capa: o que fotografar e como\n- Descrição que vende sem soar comercial\n- Truques de SEO interno do TikTok Shop\n- Como precificar pra não perder margem\n\n## Próximos passos\n\nEnquanto o replay não tá disponível, aplica o que aprender em [Diretrizes + Vitrine](../diretrizes-vitrine) — tem um resumo escrito que cobre os mesmos pontos.\n\n> A Yara grava todas as lives e organiza aqui pra você consultar quando precisar.',
    null,
    0
  ),
  ('lives-estrategias-validadas-29-04', 'Live · Estratégias Validadas + Análise de Perfil · 29/04', 'Replay da live com análises ao vivo de perfis das alunas e as estratégias que mais funcionaram.', 'Lives', 'video', 'H0O8mWIsEfY', null, null, 1),
  ('lives-2mil-seguidores-06-05', 'Live · Como ter 2 mil seguidores · 06/05', 'Replay da live com o passo a passo pra crescer de 0 a 2k em ritmo consistente.', 'Lives', 'video', 'DKcUtQkOSl0', null, null, 2),
  (
    'lives-desafio-7-dias-10-05',
    'Live · Desafio 7 Dias + Funil de Vendas · 10/05',
    'Live com o desafio prático de 7 dias e como estruturar o funil de vendas. Replay em preparação.',
    'Lives',
    'rich',
    null,
    E'## Replay em preparação\n\nA gravação tá sendo organizada. Resumo do encontro:\n\n## O desafio de 7 dias\n\nUma estrutura pra você sair do papel em 1 semana:\n\n- **Dia 1:** cadastra 3 produtos no app\n- **Dia 2:** roda análise (Info) em todos\n- **Dia 3:** gera 5 scripts por produto (Scripts)\n- **Dia 4:** grava 5 vídeos em bloco\n- **Dia 5:** posta o primeiro\n- **Dia 6:** posta o segundo + responde comentário do primeiro\n- **Dia 7:** análise dos 2 vídeos + ajuste de hook pros próximos\n\n## Funil de vendas\n\n- **Topo:** vídeos de descoberta (hook)\n- **Meio:** vídeos de educação (autoridade)\n- **Fundo:** vídeos de venda (CTA forte)\n- **Pós-venda:** depoimento + UGC reposted\n\nEnquanto o replay não estiver disponível, aplica o desafio.',
    null,
    3
  ),
  ('lives-como-criar-conexao-13-05', 'Live · Como Criar Conexão · 13/05', 'Live focada em conexão emocional com a audiência — o que toda criadora de sucesso faz e ninguém percebe.', 'Lives', 'video', 'J7hwa6h8uIo', null, null, 4)
) as v(slug, title, description, category, kind, youtube_id, body_md, checklist_items, order_index)
on conflict (slug) do nothing;
