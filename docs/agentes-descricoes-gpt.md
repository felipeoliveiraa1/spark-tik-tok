# Descrições dos Agentes pro GPT Builder

Pra cada agente o GPT Builder tem 3 campos visíveis pra aluna:
- **Name** — nome do GPT
- **Description** — 1-2 linhas que aparecem no card (até ~300 chars)
- **Conversation starters** — 4 sugestões clicáveis pra ela começar

Cole abaixo nos campos correspondentes.

---

## 📊 Info — Análise de Produto

**Name:**
```
Yara - Info | Análise de Produto
```

**Description:**
```
Sua especialista em desconstruir produto pra TikTok Shop. Manda foto, nome ou link e te devolvo uma ficha completa: público-alvo, dores, pontos fortes, concorrentes, gatilhos emocionais, ângulos de conteúdo e 5 hooks prontos pra gravar 💕
```

**Conversation starters:**
- `📷 Quero analisar um produto novo`
- `🔗 Tenho o link da loja, vamos destrinchar?`
- `✨ Me ajuda a definir o público desse produto`
- `🛍️ Que ângulos de conteúdo funcionam pra esse aqui?`

---

## 💪 Suplementos

**Name:**
```
Yara - Scripts Suplementos
```

**Description:**
```
Especialista em roteiros pra TikTok Shop de suplementos — creatina, whey, colágeno, vitaminas, magnésio. Gera 5 scripts completos no método Yara (gancho 3s + desenvolvimento + benefício + CTA) sem promessa milagrosa nem linguagem médica proibida 💪✨
```

**Conversation starters:**
- `Cria 5 roteiros pro meu whey`
- `Roteiro fofoca pra magnésio do sono`
- `Hooks pra creatina feminina`
- `Como falar de colágeno sem soar farmacêutica?`

---

## 🧴 Skincare

**Name:**
```
Yara - Scripts Skincare
```

**Description:**
```
Especialista em roteiros pra TikTok Shop de skincare — cremes, séruns, hidratantes, protetor solar, ácidos. Gera 5 scripts completos no método Yara seguindo regras dermo: sem promessa milagrosa, sem termo médico, com tom de amiga que entende 🧴✨
```

**Conversation starters:**
- `Cria roteiros pro meu sérum facial`
- `Hook educativo pra protetor solar`
- `Tutorial rotina noturna com hidratante`
- `Roteiro de erro comum no skincare`

---

## 💇‍♀️ Cabelo

**Name:**
```
Yara - Scripts Cabelo
```

**Description:**
```
Especialista em roteiros pra TikTok Shop de cabelo — shampoo, condicionador, máscara, óleos, finalizadores. Gera 5 scripts emocionais que falam da dor real do cabelo + rotina visível, no método Yara 💇‍♀️
```

**Conversation starters:**
- `Roteiros pro meu shampoo antiqueda`
- `Transformação capilar em 30 dias`
- `Hook pra máscara hidratante`
- `Erro comum na hora de lavar o cabelo`

---

## 🌸 Perfumes & Body Splash

**Name:**
```
Yara - Scripts Perfumes & Body Splash
```

**Description:**
```
Especialista em roteiros sensoriais pra TikTok Shop de perfumaria — perfumes, body splash, brumas, hidratantes perfumados. 5 scripts no método Yara com storytelling, comparação com importados e ocasiões de uso 🌸
```

**Conversation starters:**
- `Roteiros pro meu body splash de baunilha`
- `Compara meu perfume com um importado`
- `Hook pra perfume de encontro`
- `Cheirinho pro dia a dia que vende`

---

## 🏠 Casa e Organização

**Name:**
```
Yara - Scripts Casa e Organização
```

**Description:**
```
Especialista em roteiros pra TikTok Shop de organização e casa — organizadores, gadgets de cozinha, utilidades do lar. 5 scripts satisfatórios com antes/depois e solução de dor do dia a dia, no método Yara 🏠✨
```

**Conversation starters:**
- `Roteiros pro meu organizador de cozinha`
- `Antes e depois com esse utensílio`
- `Hook pra gadget que ninguém conhece`
- `Hack de organização que viraliza`

---

## 👗 Moda

**Name:**
```
Yara - Scripts Moda
```

**Description:**
```
Especialista em roteiros pra TikTok Shop de moda — roupas, looks, peças virais, acessórios. 5 scripts focados em look do dia, versatilidade (1 peça 3 looks), transformação e tendência, no método Yara 👗
```

**Conversation starters:**
- `Roteiros pra minha blusa nova`
- `1 peça, 3 looks completos`
- `Hook pra peça que tá viralizando`
- `Trend do mês adaptada pro meu produto`

---

## 📱 Eletrônicos

**Name:**
```
Yara - Scripts Eletrônicos
```

**Description:**
```
Especialista em roteiros pra TikTok Shop de tech — gadgets, acessórios, fones, carregadores, smart home. 5 scripts demonstrativos no método Yara: "você não sabia que precisava" + teste prático + hack do dia a dia 📱✨
```

**Conversation starters:**
- `Roteiros pros meus fones bluetooth`
- `Hack tech pro dia a dia`
- `Comparação: vale a pena vs concorrente`
- `Hook pra carregador rápido`

---

## 💬 Suporte Yara

**Name:**
```
Yara - Suporte
```

**Description:**
```
Sua central de ajuda do Método TTS. Tira dúvida sobre como vender no TikTok Shop BR — comissão, frete, regras de conteúdo proibido, boas práticas, como usar o app e os outros agentes Yara 💬💕
```

**Conversation starters:**
- `Como cadastro um produto no TikTok Shop?`
- `Como funciona a comissão de criadora?`
- `Posso falar X no meu vídeo?`
- `Como uso os outros agentes Yara?`

---

## 🎁 Dica de configuração extra

No GPT Builder, em **"Additional Settings"** (final do Configure):
- ✅ **"Use conversation data in your GPT to improve our models"** — DESMARCA (privacidade da aluna)
- ✅ **"Code Interpreter & Data Analysis"** — desmarca (não precisa pra esses agentes)
- ✅ **"Web Browsing"** — desmarca pros Scripts (a IA precisa só do conhecimento próprio). Pode marcar pro Info se quiser que ela busque o produto no Google.
- ✅ **"DALL·E Image Generation"** — desmarca (não precisa)

E em **"Visibility"** (botão "Create"/"Share"):
- Escolhe **"Anyone with the link"** → copia o link → cola em `lib/agents-catalog.ts` no campo `chatgptUrl`.

---

## 📋 Lista pra você ir marcando

- [ ] Info — Análise de Produto
- [ ] Suplementos
- [ ] Skincare
- [ ] Cabelo
- [ ] Perfumes & Body Splash
- [ ] Casa e Organização
- [ ] Moda
- [ ] Eletrônicos
- [ ] Suporte
