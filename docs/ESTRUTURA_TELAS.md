# Estrutura de Telas — App TikTok Shop (PWA)

Documento pra desenhar as telas no Claude Design. Cobre todas as telas do MVP, o que tem em cada uma, onde os agentes aparecem, e os fluxos de navegação.

---

## Princípios de design

- **Mobile-first PWA** — alunas acessam principalmente do celular. Desktop é responsivo.
- **Padrão ChatGPT/Claude** — chat ocupa o centro, sidebar com histórico no desktop, drawer no mobile.
- **Agentes são invisíveis por padrão** — orquestrador roteia automaticamente. Aluna pode selecionar agente específico se quiser controle.
- **Cada artefato gerado vira uma "card" salvável** — produto analisado, lista de virais, tabela de scripts. Aluna pode revisitar.
- **Português Brasil em tudo**, tom direto e simples (não corporativo).
- **Cores sugeridas**: gradiente roxo/rosa (vibe TikTok) + branco/preto. Acento neon em ações primárias.

---

## Mapa de telas (sitemap)

```
┌─ Públicas
│   └── /login                          [1] Login
│
├─ Onboarding (primeira vez)
│   ├── /welcome                        [2] Boas-vindas
│   └── /onboarding/perfil              [3] Setup de perfil
│
├─ App principal (autenticado)
│   ├── /                               [4] Home / Dashboard
│   ├── /chat                           [5] Nova conversa
│   ├── /chat/[id]                      [6] Conversa existente
│   ├── /produtos                       [7] Meus produtos
│   ├── /produtos/[id]                  [8] Detalhe do produto (ficha)
│   ├── /virais                         [9] Biblioteca de virais salvos
│   ├── /virais/[id]                    [10] Detalhe do viral
│   ├── /scripts                        [11] Scripts gerados
│   └── /scripts/[id]                   [12] Detalhe do script
│
├─ Conta
│   ├── /conta                          [13] Perfil / dados pessoais
│   ├── /conta/plano                    [14] Plano e billing
│   └── /conta/uso                      [15] Uso e quotas
│
├─ Estados especiais
│   ├── /quota-estourada                [16] Limite atingido
│   ├── /plano-inativo                  [17] Acesso bloqueado
│   └── /erro                           [18] Erro genérico
│
└─ V2 (não no MVP)
    └── /admin                          Painel da expert
```

---

## [1] Login — `/login`

**Propósito**: aluna entra com email; recebe magic link da Supabase.

**Layout (mobile)**:
```
┌─────────────────────────┐
│                         │
│      [LOGO grande]      │
│                         │
│   App TikTok Shop       │
│   Crie scripts virais   │
│   com IA                │
│                         │
│  ┌───────────────────┐  │
│  │ seu@email.com     │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Receber link →    │  │
│  └───────────────────┘  │
│                         │
│  Ainda não tem acesso?  │
│  [Comprar agora]        │
│                         │
└─────────────────────────┘
```

**Componentes**:
- Logo (top, ~80px altura)
- Headline + subhead curtos (3-4 linhas)
- Input de email
- Botão primário "Receber link"
- Link secundário "Comprar agora" → redireciona pro checkout Kiwify
- Footer pequeno: termos + privacidade

**Estados**:
- Default
- Loading (botão spinner)
- Sucesso ("Verifique seu email" + ícone de envelope)
- Erro (mensagem inline abaixo do input)

---

## [2] Boas-vindas — `/welcome`

**Propósito**: primeira tela após login inicial. Apresenta o produto e as 4 ferramentas.

**Layout**:
```
┌─────────────────────────┐
│  Boa, [Nome]! 👋        │
│  Bora vender no         │
│  TikTok Shop?           │
│                         │
│  Você tem acesso a 4    │
│  agentes de IA:         │
│                         │
│  ┌─────────────────┐    │
│  │ 🔍 Informação   │    │
│  │ Análise de      │    │
│  │ produto         │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ 🔥 Virais       │    │
│  │ Descobre o que  │    │
│  │ tá bombando     │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ ✍️ Scripts      │    │
│  │ Hooks com       │    │
│  │ neuromarketing  │    │
│  └─────────────────┘    │
│                         │
│  ┌─────────────────┐    │
│  │ 💬 Tira-dúvidas │    │
│  │ Suporte TikTok  │    │
│  │ Shop            │    │
│  └─────────────────┘    │
│                         │
│  [Continuar →]          │
└─────────────────────────┘
```

**Componentes**:
- Header personalizado com nome
- 4 cards de agentes em grid 1 col mobile / 2 cols tablet / 4 cols desktop
- Cada card: ícone, nome, descrição curta (2 linhas)
- CTA único no fim: "Continuar"

---

## [3] Setup de perfil — `/onboarding/perfil`

**Propósito**: coletar nicho da aluna pra personalizar sugestões.

**Layout**:
```
┌─────────────────────────┐
│  ← Voltar               │
│                         │
│  Pra te ajudar melhor,  │
│  conta um pouco sobre   │
│  você                   │
│                         │
│  Nome (como te chamar)  │
│  ┌───────────────────┐  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  Você já vende no       │
│  TikTok Shop?           │
│  ○ Ainda não            │
│  ○ Tô começando         │
│  ○ Já vendo há um tempo │
│                         │
│  Nicho principal        │
│  ┌───────────────────┐  │
│  │ Selecione   ▼     │  │
│  └───────────────────┘  │
│  (Beleza, moda,         │
│   acessórios, casa,     │
│   eletrônicos, etc.)    │
│                         │
│  [Pronto, bora! →]      │
└─────────────────────────┘
```

**Componentes**:
- Form com 3 campos: nome, experiência (radio), nicho (select)
- Botão primário sticky bottom no mobile

---

## [4] Home / Dashboard — `/`

**Propósito**: tela principal após login. Resume o que aluna tem, sugere próxima ação.

**Layout (mobile)**:
```
┌─────────────────────────┐
│ ☰  App TikTok Shop  👤  │  ← header
├─────────────────────────┤
│                         │
│  Oi, [Nome] 👋          │
│  O que vamos criar      │
│  hoje?                  │
│                         │
│  ┌───────────────────┐  │
│  │ ✨ Nova conversa  │  │  ← CTA principal grande
│  │   com IA          │  │
│  └───────────────────┘  │
│                         │
│  Atalhos                │
│  ┌─────────┐ ┌────────┐ │
│  │ 🔍 Anal.│ │ 🔥 Virai│ │
│  │ produto │ │ s da    │ │
│  │         │ │ semana  │ │
│  └─────────┘ └────────┘ │
│  ┌─────────┐ ┌────────┐ │
│  │ ✍️ Cria │ │ 💬 Tira │ │
│  │ scripts │ │ dúvidas │ │
│  └─────────┘ └────────┘ │
│                         │
│  ─── Suas últimas ───   │
│                         │
│  📦 Hidratante NAC      │
│     2 conversas         │
│     há 2h               │
│                         │
│  📦 Massageador facial  │
│     5 scripts gerados   │
│     ontem               │
│                         │
│  [Ver tudo →]           │
│                         │
└─────────────────────────┘
│ 💬 Chat │📦 Prod│👤 Conta│  ← bottom nav (mobile)
└─────────────────────────┘
```

**Componentes**:
- **Header**: hamburger menu (☰), logo, avatar (clicável → conta)
- **Saudação personalizada**
- **CTA primário grande**: "Nova conversa com IA"
- **Grid de 4 atalhos** (1 por agente) — clique abre nova conversa pré-direcionada pro agente
- **Lista de produtos recentes** (até 5) com contadores
- **Bottom navigation (mobile)**: Chat / Produtos / Conta
- **Sidebar (desktop)**: histórico completo de conversas

**Onde os agentes aparecem**: nos 4 cards de atalho. Cada um inicia uma conversa pré-roteada pro agente correspondente.

---

## [5] Nova conversa — `/chat`

**Propósito**: tela em branco pra começar a conversar. Foco máximo no input.

**Layout (mobile)**:
```
┌─────────────────────────┐
│ ←  Nova conversa     ⋮  │
├─────────────────────────┤
│                         │
│                         │
│       [LOGO/ÍCONE]      │
│                         │
│   Como posso te ajudar  │
│   hoje?                 │
│                         │
│   ┌───────────────┐     │
│   │ 🔍 Analisar   │     │
│   │   um produto  │     │
│   └───────────────┘     │
│   ┌───────────────┐     │
│   │ 🔥 Ver o que  │     │
│   │   tá viral    │     │
│   └───────────────┘     │
│   ┌───────────────┐     │
│   │ ✍️ Criar      │     │
│   │   scripts     │     │
│   └───────────────┘     │
│   ┌───────────────┐     │
│   │ 💬 Tirar uma  │     │
│   │   dúvida      │     │
│   └───────────────┘     │
│                         │
├─────────────────────────┤
│ 📎 [pergunta...]    ➤   │  ← input fixo bottom
└─────────────────────────┘
```

**Componentes**:
- **Header**: voltar, título "Nova conversa", menu de 3 pontos (renomear/deletar)
- **Empty state central**: ícone + "Como posso te ajudar?"
- **4 sugestões clicáveis** (atalhos pros agentes) — clicar pré-preenche o input com prompt
- **Input fixo bottom**: clip de anexo (📎 abre câmera/galeria pra agente Info), textarea autoexpansível, botão enviar

**Onde os agentes aparecem**:
- Nas 4 sugestões iniciais
- Como menu **@menção** dentro do textarea: digitar `@` abre dropdown com `@info`, `@virais`, `@scripts`, `@duvidas`. Aluna pode forçar agente específico.
- Por padrão: orquestrador decide automaticamente baseado na mensagem.

---

## [6] Conversa existente — `/chat/[id]`

**Propósito**: chat principal, onde tudo acontece. Visual padrão tipo ChatGPT.

**Layout (mobile)**:
```
┌─────────────────────────┐
│ ←  NAC Always Fit    ⋮  │  ← título da conversa
├─────────────────────────┤
│                         │
│  Você                   │
│  quero criar scripts    │
│  pro NAC Always Fit     │
│  [foto.jpg]             │
│                         │
│  🔍 Agente Informação   │  ← badge do agente que respondeu
│  Analisei o produto.    │
│  Olha a ficha:          │
│                         │
│  ┌─────────────────┐    │
│  │ 📦 NAC Always   │    │  ← card do produto
│  │    Fit          │    │
│  │ Categoria:      │    │
│  │ Suplemento      │    │
│  │ Público: 25-45  │    │
│  │ Dor: cansaço,   │    │
│  │ falta de energia│    │
│  │                 │    │
│  │ [Ver completo →]│    │
│  └─────────────────┘    │
│                         │
│  Quer que eu busque     │
│  vídeos virais desse    │
│  produto?               │
│                         │
│  ┌─────────┐ ┌────────┐ │
│  │ Sim     │ │ Depois │ │  ← chips de ação rápida
│  └─────────┘ └────────┘ │
│                         │
│  Você                   │
│  sim, busca os virais   │
│                         │
│  🔥 Agente Virais       │
│  Encontrei 8 vídeos     │
│  bombando. Top 3:       │
│                         │
│  ┌─────────────────┐    │  ← carousel horizontal
│  │ [thumb] 2.3M    │    │
│  │ "isso aqui mudou│    │
│  │  minha vida..." │    │
│  └─────────────────┘    │
│  ... (scroll →)         │
│                         │
│  ✍️ Agente Scripts      │
│  Aqui vão 10 hooks pro  │
│  seu produto:           │
│                         │
│  ┌─────────────────┐    │
│  │ Hook | Emoção | │    │  ← tabela renderizada
│  │ ...             │    │
│  │ [Copiar tudo]   │    │
│  └─────────────────┘    │
│                         │
├─────────────────────────┤
│ 📎 [digite...]      ➤   │
└─────────────────────────┘
```

**Componentes**:

**Header**:
- Botão voltar
- Título da conversa (auto-gerado pelo orquestrador, editável clicando)
- Menu ⋮ (renomear, exportar, deletar)

**Mensagens** (bubbles):
- **Usuário**: bubble alinhada direita, fundo claro/cinza, sem avatar (é "você")
- **Agente**: alinhada esquerda, fundo branco/transparente, **badge do agente no topo** (ícone + nome colorido)
- Suporte a markdown completo (negrito, listas, código, tabelas)
- Suporte a anexos: imagens (foto do produto), vídeos embed (TikTok)

**Cards estruturados** (artefatos gerados):
- **Card de produto** (Agente Info) — foto, nome, ficha resumida, botão "Ver completo" → tela 8
- **Card de viral** (Agente Virais) — thumbnail, métricas, gancho, criador. Aparece em carousel horizontal quando há vários.
- **Card de tabela de scripts** (Agente Scripts) — tabela renderizada inline com botão "Copiar tudo" + "Salvar coleção" → tela 12

**Chips de ação rápida** (suggestions):
- Aparecem após resposta do agente
- Ex: depois de Info → "Buscar virais" / "Pular pra scripts"
- Depois de Virais → "Criar scripts" / "Ver mais virais"

**Input bottom**:
- Botão 📎 (anexar foto — abre câmera ou galeria, vai pro agente Info)
- Textarea autoexpansível
- Suporte a `@menção` pra forçar agente
- Botão enviar (➤)
- Indicador "agente digitando…" durante streaming

**Sidebar (desktop)**:
- Lista de conversas anteriores agrupadas por data (Hoje, Ontem, Esta semana, etc.)
- Botão "+ Nova conversa" no topo
- Cada item: título + preview da última mensagem

---

## [7] Meus produtos — `/produtos`

**Propósito**: galeria de todos os produtos que a aluna analisou.

**Layout**:
```
┌─────────────────────────┐
│ ☰  Meus produtos    🔍  │
├─────────────────────────┤
│  Filtros: [Todos] [Skin]│
│  [Acessórios] [+]       │
│                         │
│  ┌──────┐ ┌──────┐      │
│  │[foto]│ │[foto]│      │
│  │ NAC  │ │ Mass │      │
│  │ Fit  │ │ Face │      │
│  │ ✍️ 10 │ │ ✍️ 5  │      │  ← contador scripts
│  └──────┘ └──────┘      │
│  ┌──────┐ ┌──────┐      │
│  │      │ │      │      │
│  └──────┘ └──────┘      │
│                         │
│  [+ Analisar novo]      │
└─────────────────────────┘
```

**Componentes**:
- Header com busca
- Filtros por categoria (chips horizontal scrollable)
- Grid de cards 2 cols mobile / 3-4 cols desktop
- Cada card: foto thumbnail, nome do produto, contador de scripts/virais associados, indicador de quando foi analisado
- FAB "+ Analisar novo" → abre nova conversa direto no agente Info

---

## [8] Detalhe do produto — `/produtos/[id]`

**Propósito**: ficha completa gerada pelo Agente Info, com ações pra continuar trabalho.

**Layout**:
```
┌─────────────────────────┐
│ ←  Produto              │
├─────────────────────────┤
│                         │
│      [foto grande]      │
│                         │
│  NAC Always Fit         │
│  Suplemento • Saúde     │
│                         │
│  ─── Sobre ───          │
│  N-acetilcisteína...    │
│                         │
│  ─── Público ───        │
│  Mulheres 25-45 anos,   │
│  rotina cansativa,      │
│  buscam energia natural │
│                         │
│  ─── Dores que resolve  │
│  • Cansaço crônico      │
│  • Falta de foco        │
│  • Pele opaca           │
│                         │
│  ─── Pontos fortes ───  │
│  • Antioxidante         │
│  • Aprovado pela ANVISA │
│  • Pode tomar diário    │
│                         │
│  ─── Faixa de preço ─── │
│  R$ 89 a R$ 149         │
│                         │
│  ─── Concorrentes ───   │
│  • Marca X (R$ 120)     │
│  • Marca Y (R$ 95)      │
│                         │
├─────────────────────────┤
│ [🔥 Ver virais]         │
│ [✍️ Criar scripts]      │
└─────────────────────────┘
```

**Componentes**:
- Foto grande no topo
- Título + categoria
- Seções colapsáveis: Sobre, Público, Dores, Pontos fortes, Faixa de preço, Concorrentes
- Botão sticky bottom: 2 ações principais → "Ver virais" e "Criar scripts" (cada um abre conversa pré-direcionada com esse produto como contexto)
- Menu ⋮: Editar ficha, Re-analisar, Deletar

---

## [9] Biblioteca de virais — `/virais`

**Propósito**: galeria de vídeos virais que a aluna salvou ou que o agente trouxe.

**Layout**:
```
┌─────────────────────────┐
│ ☰  Virais salvos    🔍  │
├─────────────────────────┤
│  Filtros: [Todos] [BR]  │
│  [USA] [Beleza] [+]     │
│                         │
│  Ordenar por: Views ▼   │
│                         │
│  ┌─────────────────┐    │
│  │ [thumb] ▶       │    │
│  │ 2.3M views      │    │
│  │ R$ 45k vendidos │    │
│  │ "isso aqui..."  │    │
│  │ @creator123     │    │
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │ ...             │    │
│  └─────────────────┘    │
│                         │
└─────────────────────────┘
```

**Componentes**:
- Header com busca
- Filtros por país (BR/USA), nicho
- Ordenação: views, vendas, mais recente
- Cards com thumbnail (com play overlay), métricas em destaque (views + receita estimada), gancho extraído, criador
- Tap → tela 10

---

## [10] Detalhe do viral — `/virais/[id]`

**Propósito**: dissecação completa do vídeo viral pra aluna estudar e adaptar.

**Layout**:
```
┌─────────────────────────┐
│ ←  Viral                │
├─────────────────────────┤
│                         │
│   [player TikTok embed] │
│                         │
│  @creator123            │
│  Postado em 02/05       │
│                         │
│  ─── Métricas ───       │
│  👁️ 2.3M views          │
│  ❤️ 187k curtidas       │
│  💬 4.2k comments       │
│  💰 ~R$ 45k em vendas   │
│                         │
│  ─── Estrutura ───      │
│                         │
│  🎯 Hook (0-3s)         │
│  "isso aqui mudou minha │
│   vida em 7 dias..."    │
│                         │
│  ⚠️ Problema            │
│  Mostra o cansaço, pele │
│  ruim, falta de energia │
│                         │
│  💡 Solução             │
│  Apresenta o produto    │
│  como descoberta        │
│                         │
│  📢 CTA                 │
│  "tá no link aí em      │
│   cima, corre que tem   │
│   pouquinho"            │
│                         │
│  ─── Transcrição ───    │
│  [texto completo do     │
│   áudio]                │
│                         │
├─────────────────────────┤
│ [✍️ Criar script        │
│  inspirado nesse]       │
└─────────────────────────┘
```

**Componentes**:
- Player do vídeo (embed TikTok ou link externo)
- Info do criador
- Bloco de métricas
- **Estrutura dissecada** (output do parsing): Hook / Problema / Solução / CTA — cada um destacado com ícone
- Transcrição completa (colapsável)
- CTA único bottom: "Criar script inspirado" → abre conversa no agente Scripts com esse viral como referência

---

## [11] Scripts gerados — `/scripts`

**Propósito**: lista de todas as tabelas de hooks que a aluna gerou.

**Layout**:
```
┌─────────────────────────┐
│ ☰  Meus scripts     🔍  │
├─────────────────────────┤
│  Ordenar: Mais recentes │
│                         │
│  ┌─────────────────┐    │
│  │ NAC Always Fit  │    │
│  │ 10 hooks •      │    │
│  │ há 2h           │    │
│  │ ⭐⭐⭐⭐⭐         │    │
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │ Massageador     │    │
│  │ 8 hooks •       │    │
│  │ ontem           │    │
│  └─────────────────┘    │
│                         │
└─────────────────────────┘
```

**Componentes**:
- Lista de coleções de scripts (cada conversa pode ter várias gerações)
- Cada item: produto, qtd hooks, data, rating opcional (aluna marca os que funcionaram)

---

## [12] Detalhe do script — `/scripts/[id]`

**Propósito**: tabela completa de hooks com ferramentas de ação.

**Layout**:
```
┌─────────────────────────┐
│ ←  Scripts              │
│  NAC Always Fit         │
├─────────────────────────┤
│  Gerado em 08/05  ⋮     │
│                         │
│  Tabs: [Tabela] [Cards] │
│                         │
│  ┌─────────────────┐    │
│  │ HOOK 1          │    │
│  │                 │    │
│  │ "Você já reparou│    │
│  │  que sua tia que│    │
│  │  toma 3 chás por│    │
│  │  dia tem mais   │    │
│  │  energia..."    │    │
│  │                 │    │
│  │ Emoção: humor   │    │
│  │ + identificação │    │
│  │ Gatilho: cérebro│    │
│  │ reptiliano      │    │
│  │ Viralização:🔥🔥🔥│  │
│  │                 │    │
│  │ [📋 Copiar]     │    │
│  │ [✏️ Editar]     │    │
│  │ [⭐ Marcar usei] │    │
│  └─────────────────┘    │
│                         │
│  HOOK 2 ...             │
│                         │
│  [📋 Copiar todos]      │
│  [📤 Exportar PDF]      │
└─────────────────────────┘
```

**Componentes**:
- Header: nome do produto + data
- **Toggle Tabela / Cards** (tabela é melhor desktop, cards melhor mobile)
- **Cada hook**: texto grande, metadata (emoção, gatilho cerebral, explicação neurocientífica), indicador de viralização (🔥), ações (copiar individual, editar, marcar como "usei")
- Bottom: copiar todos, exportar PDF, gerar mais variações
- Menu ⋮: regerar, deletar, compartilhar

---

## [13] Conta — `/conta`

**Propósito**: dados pessoais e sair.

**Layout**:
```
┌─────────────────────────┐
│ ☰  Minha conta          │
├─────────────────────────┤
│                         │
│      [avatar]           │
│      [Nome]             │
│      seu@email.com      │
│                         │
│  ─── Dados ───          │
│                         │
│  Nome                   │
│  ┌───────────────────┐  │
│  │ Maria Silva       │  │
│  └───────────────────┘  │
│                         │
│  Nicho principal        │
│  ┌───────────────────┐  │
│  │ Beleza      ▼     │  │
│  └───────────────────┘  │
│                         │
│  Experiência            │
│  ○ Tô começando         │
│                         │
│  [Salvar]               │
│                         │
│  ─── Outros ───         │
│  → Plano e cobrança     │
│  → Uso e quotas         │
│  → Ajuda                │
│  → Termos               │
│                         │
│  [Sair]                 │
└─────────────────────────┘
```

---

## [14] Plano e billing — `/conta/plano`

**Propósito**: ver assinatura e gerenciar via Kiwify.

**Layout**:
```
┌─────────────────────────┐
│ ←  Plano                │
├─────────────────────────┤
│                         │
│  ┌─────────────────┐    │
│  │ Plano Pro       │    │
│  │ R$ 49,90/mês    │    │
│  │ ✅ Ativo        │    │
│  │                 │    │
│  │ Renova em       │    │
│  │ 08/06/2026      │    │
│  └─────────────────┘    │
│                         │
│  ─── O que você tem ───│
│  ✓ 30 buscas Vyral/mês │
│  ✓ 50 scripts/mês      │
│  ✓ Análise ilimitada   │
│    de produtos         │
│  ✓ Tira-dúvidas        │
│    ilimitado           │
│                         │
│  ─── Gerenciar ───      │
│  [Atualizar pagamento]  │
│  [Cancelar assinatura]  │
│                         │
│  (Você será             │
│  redirecionada pra      │
│  Kiwify)                │
└─────────────────────────┘
```

**Componentes**:
- Card do plano atual com status
- Lista de benefícios incluídos
- Ações que redirecionam pra Kiwify (Kiwify gerencia tudo)

---

## [15] Uso e quotas — `/conta/uso`

**Propósito**: aluna vê quanto usou esse mês.

**Layout**:
```
┌─────────────────────────┐
│ ←  Uso desse mês        │
├─────────────────────────┤
│                         │
│  Mai/2026               │
│                         │
│  ─── Buscas de virais ──│
│                         │
│  ████████░░  18/30      │
│  Restam 12 buscas       │
│                         │
│  ─── Scripts ───        │
│                         │
│  ██████░░░░  32/50      │
│  Restam 18 scripts      │
│                         │
│  ─── Sem limite ───     │
│  Análises de produto    │
│  Tira-dúvidas           │
│                         │
│  Reseta em 08/06        │
│                         │
└─────────────────────────┘
```

**Componentes**:
- Barras de progresso por recurso
- Número usado/limite
- Data de reset
- (Se estourou, banner de upgrade aparece aqui também)

---

## [16] Quota estourada — `/quota-estourada`

**Propósito**: bloqueio + sugere upgrade ou esperar.

**Layout (modal/full screen)**:
```
┌─────────────────────────┐
│         ⚠️              │
│                         │
│  Você bateu o limite    │
│  de buscas desse mês    │
│                         │
│  Já fez 30/30 buscas    │
│  no Vyral.              │
│                         │
│  ─── Suas opções ───    │
│                         │
│  ⏳ Esperar reset:      │
│     08/06/2026          │
│                         │
│  ⚡ Upgrade pro plano   │
│     ilimitado           │
│  [Ver plano Premium →]  │
│                         │
│  [Voltar pro app]       │
└─────────────────────────┘
```

---

## [17] Plano inativo — `/plano-inativo`

**Propósito**: tela bloqueada quando assinatura cancelada/inadimplente.

**Layout**:
```
┌─────────────────────────┐
│         🔒              │
│                         │
│  Sua assinatura está    │
│  inativa                │
│                         │
│  Pra continuar usando:  │
│  [Reativar →]           │
│                         │
│  Dúvidas? Fale com      │
│  suporte                │
└─────────────────────────┘
```

---

## [18] Erro genérico — `/erro`

**Layout simples**:
```
┌─────────────────────────┐
│         😕              │
│                         │
│  Algo deu errado        │
│                         │
│  [Tentar novamente]     │
│  [Voltar pra home]      │
└─────────────────────────┘
```

---

## Componentes globais reutilizáveis

### Header (mobile)
- Hamburger ☰ (abre drawer com sidebar)
- Logo central
- Avatar (clica → /conta)

### Bottom navigation (mobile only)
4 tabs: Chat 💬 / Produtos 📦 / Virais 🔥 / Conta 👤

### Sidebar (desktop only)
- Logo top
- Botão "+ Nova conversa" (destaque)
- Lista de conversas (agrupada por data)
- Atalhos pros 4 agentes
- Bottom: avatar + nome + ⚙️

### Selector de agente (dentro do chat)
**Forma 1 — Botão flutuante no input**:
```
┌─────────────────┐
│ Agente: 🤖 Auto▼│
└─────────────────┘
```
Ao tocar, abre bottom sheet:
```
┌─────────────────┐
│ Quem te atende? │
│                 │
│ ○ 🤖 Auto       │
│   IA escolhe    │
│                 │
│ ○ 🔍 Informação │
│ ○ 🔥 Virais     │
│ ○ ✍️ Scripts    │
│ ○ 💬 Dúvidas    │
└─────────────────┘
```

**Forma 2 — @menção no textarea**: digitar `@` abre dropdown inline.

### Chips de sugestão
Aparecem abaixo da última mensagem do agente. Tap = envia automaticamente.

### Card de artefato (produto/viral/script)
Componente embedável dentro do chat. Variantes: `card-product`, `card-viral`, `card-scripts-table`.

### Toast/Snackbar
Pra confirmações ("Copiado!", "Salvo na biblioteca", etc.)

---

## Fluxos principais (golden paths)

### Fluxo 1 — Aluna recém-comprou via Kiwify
1. Recebe email com link de acesso
2. Clica → `/login` → magic link → `/welcome` [2]
3. Vai pra `/onboarding/perfil` [3]
4. Termina → `/` [4]

### Fluxo 2 — Aluna quer criar scripts pro produto novo
1. Home `/` [4] → tap em "Nova conversa" ou "Analisar produto"
2. Vai pra `/chat/[id]` [6]
3. Sobe foto do produto → Agente Info responde com card
4. Tap em "Buscar virais" (chip de sugestão) → Agente Virais lista vídeos
5. Tap em "Criar scripts" → Agente Scripts gera tabela
6. Aluna copia, usa no TikTok

### Fluxo 3 — Aluna explora virais antes de escolher produto
1. Home → tap em "Ver o que tá viral"
2. `/chat/[id]` [6] com Agente Virais
3. "me mostra o que tá bombando em beleza no Brasil"
4. Recebe lista, abre detalhe de um → `/virais/[id]` [10]
5. "Criar script inspirado" → volta pro chat, agente Scripts gera

### Fluxo 4 — Aluna estoura quota
1. Tenta fazer 31ª busca → bloqueio → `/quota-estourada` [16]
2. Tap em "Upgrade" → redireciona pro Kiwify

---

## Detalhes técnicos pro design

### Breakpoints
- Mobile: < 768px (foco principal)
- Tablet: 768-1024px
- Desktop: > 1024px (sidebar fixa, chat mais largo)

### Densidade de informação
- Mobile: máximo 1 ação primária por tela, hierarquia clara
- Desktop: pode ter sidebar + chat + painel lateral de artefato

### Animações
- Mensagens aparecem com fade+slide (200ms)
- Streaming do agente: cursor pulsando + texto aparecendo char-by-char
- Cards de artefato: skeleton loading enquanto agente processa

### Acessibilidade
- Contraste mínimo AA
- Tamanho de fonte mínimo 14px no body
- Touch targets mínimo 44x44px
- Suporte a dark mode (V2)

### PWA específico
- Splash screen com logo
- Ícone home screen
- Install prompt aparece após 2ª sessão
- Funciona offline pra ler conversas antigas (write fica em queue)

---

## Lista resumida de assets pra desenhar

**Design System base**:
- [ ] Logo (variantes: full, ícone, mono)
- [ ] Paleta de cores
- [ ] Tipografia (1 família, ex: Inter ou Geist)
- [ ] Ícones dos 4 agentes (🔍 🔥 ✍️ 💬 ou versões customizadas)
- [ ] Componentes: button, input, card, chip, badge, toast, modal

**Telas principais (prioridade alta)**:
- [ ] [1] Login
- [ ] [4] Home / Dashboard
- [ ] [5] Nova conversa (empty state)
- [ ] [6] Conversa em andamento (com cards)
- [ ] [8] Detalhe do produto
- [ ] [10] Detalhe do viral
- [ ] [12] Detalhe do script (tabela de hooks)
- [ ] Selector de agente (bottom sheet)

**Telas secundárias**:
- [ ] [2] Boas-vindas
- [ ] [3] Onboarding perfil
- [ ] [7] Meus produtos
- [ ] [9] Biblioteca de virais
- [ ] [11] Lista de scripts
- [ ] [13] Conta
- [ ] [14] Plano/billing
- [ ] [15] Uso/quotas

**Estados especiais**:
- [ ] [16] Quota estourada
- [ ] [17] Plano inativo
- [ ] [18] Erro genérico
- [ ] Loading states (skeleton)
- [ ] Empty states de cada tela

---

## Onde os agentes aparecem (resumo)

| Tela | Como o agente aparece |
|---|---|
| Home [4] | 4 cards de atalho (1 por agente) |
| Nova conversa [5] | 4 sugestões iniciais clicáveis |
| Chat [6] | Badge com nome+ícone do agente em cada resposta. Selector via @menção ou bottom sheet. |
| Detalhe produto [8] | Botões "Ver virais" / "Criar scripts" continuam o fluxo nos agentes 2 e 3 |
| Detalhe viral [10] | Botão "Criar script inspirado" continua no agente 3 |
| Welcome [2] | 4 cards apresentando cada agente |

**Padrão visual dos agentes** (sugestão):
- 🔍 **Informação**: cor azul
- 🔥 **Virais**: cor laranja/vermelho
- ✍️ **Scripts**: cor roxa
- 💬 **Tira-dúvidas**: cor verde

Ajuda aluna identificar visualmente quem está respondendo.
