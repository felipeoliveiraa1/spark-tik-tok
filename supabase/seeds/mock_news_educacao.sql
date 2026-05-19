-- =============================================================================
-- Seed de mock — News + Educação pra Felipe visualizar o design
--
-- Roda no Supabase Studio → SQL Editor → cola tudo → Run.
-- Não é uma migration (não fica no histórico) — é só dado de demo.
-- Pra limpar depois: DELETE FROM news WHERE slug LIKE 'mock-%';
--                    DELETE FROM education_videos WHERE slug LIKE 'mock-%';
-- =============================================================================

-- ---------- NEWS ----------
insert into public.news (slug, category, title, excerpt, cover_url, body_md, reading_minutes, is_new, published_at)
values
('mock-tendencia-body-splash-2026',
 'Tendência',
 'Body Splash masculino virou o queridinho do TikTok Shop',
 'Os kits de Body Splash subiram 340% nas buscas em julho. Veja por que eles tão dominando o feed e como adaptar a estratégia da sua marca.',
 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=1200&q=80',
 E'# Body Splash dominou o TikTok Shop\n\nNos últimos 30 dias, os kits de Body Splash masculino apareceram em **mais de 12 mil vídeos** no TikTok Shop BR. Os mais vendidos somam quase R$ 8 milhões em GMV.\n\n## Por que tá funcionando\n\n- Preço acessível (kits entre R$ 49 e R$ 99)\n- Hook visual forte (várias garrafinhas coloridas)\n- Conversa direto com Gen Z masculina\n\n## Como adaptar pra sua marca\n\nSe você vende produto de beleza/cuidado pessoal, vale fazer:\n\n1. **Vídeo de unboxing** rápido (15s)\n2. **Comparação** entre 2 fragrâncias do mesmo kit\n3. **POV** ("você antes vs depois de usar X")\n\nLink pra carrinho laranja é OBRIGATÓRIO no primeiro frame.',
 4, true, now() - interval '2 hours'),

('mock-comissao-tiktok-shop-julho-2026',
 'Atualização',
 'TikTok Shop mudou as comissões em julho — o que precisa saber',
 'Categoria de beleza subiu pra 12%. Eletrônicos caiu pra 4%. Veja a tabela completa e como isso afeta seu planejamento de preço.',
 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&q=80',
 E'# Novas comissões do TikTok Shop\n\nA partir de **15 de julho**, o TikTok Shop ajustou as comissões por categoria. Mudanças mais relevantes:\n\n## Subiram\n\n- Beleza & Cuidados Pessoais: 8% → **12%**\n- Saúde & Suplementos: 6% → **10%**\n- Pet: 5% → **8%**\n\n## Caíram\n\n- Eletrônicos: 8% → **4%**\n- Eletrodomésticos: 7% → **5%**\n\n## O que fazer\n\nSe você vende em categoria que subiu, **revisa o markup do produto**. A regra geral é: descontar a nova comissão + frete antes de calcular margem.\n\n> Dica: planilha do Spark já considera essas alíquotas atualizadas.',
 5, true, now() - interval '1 day'),

('mock-conta-de-criador-passo-a-passo',
 'Tutorial',
 'Como abrir sua conta de criador em 10 minutos (passo a passo)',
 'Guia visual completo pra quem ainda não tem TikTok Shop ativo. Inclui o que fazer se o KYC for recusado.',
 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80',
 E'# Conta de criador TikTok Shop\n\nO processo mudou em junho. Agora é tudo dentro do app, sem precisar do site.\n\n## Pré-requisitos\n\n- TikTok pessoal com **+1.000 seguidores**\n- Conta há pelo menos 30 dias\n- CPF + RG (foto frente e verso)\n- Comprovante de endereço dos últimos 3 meses\n\n## Passo a passo\n\n1. Abre o TikTok → perfil → ☰ → **Estúdio do Criador**\n2. Aba "TikTok Shop" → "Tornar-se criador"\n3. Sobe os documentos (frente, verso, selfie segurando RG)\n4. Aprovação em até 48h\n\n## Se der ruim\n\nKYC recusado geralmente é foto borrada ou documento vencido. Repete o passo 3 com foto bem iluminada.\n\n## Depois de aprovada\n\nVocê pode adicionar produtos no carrinho laranja, gravar vídeos shoppable e usar afiliados.',
 6, false, now() - interval '5 days'),

('mock-melhor-horario-postar',
 'Estratégia',
 'O melhor horário pra postar no TikTok Shop em 2026',
 'A gente analisou 800 vídeos virais e identificou 3 janelas de ouro. Spoiler: não é nem de manhã nem de noite.',
 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&q=80',
 E'# Os 3 melhores horários\n\nDepois de analisar 800 vídeos que passaram de 500k views nos últimos 60 dias, encontramos padrões claros.\n\n## 🥇 12h às 14h (almoço)\n\nMelhor janela pra **produtos de impulso** (R$ 30 a R$ 90). 38% dos vídeos virais nesse horário convertem na hora.\n\n## 🥈 19h às 21h (jantar)\n\nMelhor pra **produto explicativo** (skincare, suplemento, eletrônico). Audiência tá mais paciente pra vídeo de 40-60s.\n\n## 🥉 21h às 23h (relax)\n\nPra **infoproduto, curso, ebook**. Conversão menor mas ticket médio sobe 2x.\n\n## O que evitar\n\n- Antes das 11h (audiência baixa, algoritmo não testa)\n- Entre 15h e 18h (gente trabalhando, taxa de salvamento despenca)',
 4, true, now() - interval '3 days'),

('mock-erros-mais-comuns-iniciante',
 'Dica',
 '5 erros que matam o vídeo de criadora iniciante',
 'Você grava, edita bonito, publica… e o vídeo não passa de 200 views. Esses são os pecados capitais.',
 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=1200&q=80',
 E'# 5 erros que matam o alcance\n\n## 1. Hook fraco\n\n> "Oi gente, hoje vou falar sobre…"\n\nNão. O algoritmo decide nos primeiros **1.5 segundos** se vale a pena distribuir. Comece com afirmação polêmica, número grande ou pergunta direta.\n\n## 2. Música genérica\n\nUsar áudio de viralizar passado funciona MELHOR que som comercial. Vai em "trending" e pega os top 20.\n\n## 3. Carrinho laranja escondido\n\nO link tem que aparecer **antes da metade do vídeo**. Aluna que esconde pro fim perde 60% das conversões.\n\n## 4. Texto demais na tela\n\nGen Z não lê. Se vc precisa colocar texto, **máximo 4 palavras** por frame.\n\n## 5. Vídeo longo demais\n\nProduto de impulso: 15-25s. Produto explicativo: 30-50s. **Acima de 60s** o algoritmo penaliza.',
 5, false, now() - interval '8 days');

-- ---------- EDUCAÇÃO (videoaulas YouTube) ----------
-- youtube_id = ID real de 11 chars. Pra mock usamos IDs públicos famosos.
-- Quando você criar conteúdo de verdade, edita pela /admin/educacao.

insert into public.education_videos (slug, title, description, category, youtube_id, order_index, is_published)
values
('mock-comecando-conta-criador',
 'Como abrir conta de criador no TikTok Shop',
 'Aula 1 da trilha "Começando". Tutorial completo do zero — desde verificar requisitos até completar o KYC.',
 'Começando',
 'dQw4w9WgXcQ',
 1, true),

('mock-comecando-primeiro-produto',
 'Cadastrando seu primeiro produto na vitrine',
 'Aula 2 da trilha "Começando". Como criar a ficha do produto, fotos que vendem e setup do carrinho laranja.',
 'Começando',
 'jNQXAC9IVRw',
 2, true),

('mock-funil-hook-perfeito',
 'O hook perfeito em 3 segundos',
 'Trilha de Funil. Anatomia dos 1.5 primeiros segundos que decidem se o vídeo vira viral ou morre nos 200 views.',
 'Funil',
 '9bZkp7q19f0',
 1, true),

('mock-funil-cta-natural',
 'CTA que não soa forçado',
 'Trilha de Funil. Como pedir pra clicar no carrinho laranja sem soar como infomercial dos anos 90.',
 'Funil',
 'kJQP7kiw5Fk',
 2, true),

('mock-edicao-capcut-basico',
 'CapCut do zero — só o que você precisa',
 'Trilha de Edição. Ignore os 50 efeitos. 5 coisas no CapCut te levam de iniciante a editora rápida.',
 'Edição',
 'tgbNymZ7vqY',
 1, true),

('mock-edicao-audio-trending',
 'Como achar áudio trending antes de explodir',
 'Trilha de Edição. Atalho pra descobrir áudios que vão viralizar nas próximas 48h e surfar a onda.',
 'Edição',
 'L_jWHffIx5E',
 2, true),

('mock-estrategia-produto-impulso',
 'Produto de impulso vs explicativo — quando usar cada um',
 'Trilha de Estratégia. Não é todo produto que vende em vídeo curto. Aprende a categorizar antes de gravar.',
 'Estratégia',
 'fJ9rUzIMcZQ',
 1, true);
