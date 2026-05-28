/**
 * Catálogo dos Agentes do Método TTS — versão externa (ChatGPT GPTs + Gemini Gems).
 *
 * Estratégia: a IA NÃO roda mais dentro do app. A aluna usa os agentes
 * direto nas plataformas externas. O app mantém só o catálogo (/produtos,
 * /scripts) que ela preenche manualmente com o que gerou no Gemini/ChatGPT.
 *
 * Cada agente tem:
 *   - links pra ChatGPT (GPT) e Gemini (Gem) — null se ainda não criado
 *   - ícone/cor visual
 *   - descrição curta pro card
 *   - categoria (info, scripts, suporte)
 *
 * Pra atualizar: edita esse arquivo. A página /agentes lê direto daqui.
 */

export type AgentCategory = "info" | "scripts" | "suporte";

export type AgentCatalogItem = {
  /** Slug usado em URLs e tracking */
  slug: string;
  /** Nome que aparece no card */
  name: string;
  /** Etiqueta curta usada no chip (ex: "Suplementos", "Skincare"). Default usa o emoji+nome. */
  chip?: string;
  /** Categoria (controla agrupamento na UI) */
  category: AgentCategory;
  /** Emoji que vira o ícone visual (fallback quando não tem imagem) */
  emoji: string;
  /** Descrição curta (1 linha) — vai pro card */
  shortDescription: string;
  /** Texto longo explicando como funciona */
  howItWorks: string;
  /** Link público pro GPT no ChatGPT (null se ainda não criado) */
  chatgptUrl: string | null;
  /** Link público pro Gem no Gemini (null se ainda não criado) */
  geminiUrl: string | null;
  /** URL da imagem hero do card (480x300 recomendado). Null usa o gradient como fallback. */
  imageUrl: string | null;
  /** Cor do gradient do card (Tailwind classes) — usado como fundo/overlay */
  accent: string;
};

export const AGENTS_CATALOG: AgentCatalogItem[] = [
  // ─── INFO (geral, 1 agente) ───────────────────────────────────────
  {
    slug: "info",
    chip: "Info",
    name: "Info — Análise de Produto",
    category: "info",
    emoji: "📊",
    shortDescription: "Pra qualquer nicho. Monta a ficha completa do seu produto.",
    howItWorks:
      "Manda foto, nome ou link do produto. Ela devolve uma ficha rica com público-alvo, dores, pontos fortes, concorrentes, gatilhos emocionais, ângulos de conteúdo e 5 hooks prontos. Você cola aqui no app pra salvar no seu catálogo.",
    chatgptUrl: null,
    geminiUrl: null,
    imageUrl: "/info.png",
    accent: "from-pink-500 to-rose-400",
  },

  // ─── SCRIPTS POR NICHO (na ordem definida pela Yara) ─────────────
  {
    slug: "scripts-suplementos",
    chip: "Suplementos",
    name: "Scripts Suplementos",
    category: "scripts",
    emoji: "💪",
    shortDescription: "Pra creatina, whey, colágeno, vitaminas, magnésio.",
    howItWorks:
      "Especialista em nutrição clínica + Método TTS. Gera 5 roteiros completos respeitando as regras de não-promessa-de-cura, com analogias simples explicando o mecanismo do produto.",
    chatgptUrl: null,
    geminiUrl: null,
    imageUrl: "/suplemento.png",
    accent: "from-orange-400 to-amber-300",
  },
  {
    slug: "scripts-skincare",
    chip: "Skincare",
    name: "Scripts Skincare",
    category: "scripts",
    emoji: "🧴",
    shortDescription: "Roteiros pra cremes, séruns, hidratantes, protetor solar.",
    howItWorks:
      "Especialista em skincare + Método TTS. Gera 5 roteiros completos (gancho 3s + desenvolvimento + benefício + CTA) seguindo regras dermatológicas — sem promessa milagrosa, sem termo médico proibido.",
    chatgptUrl:
      "https://chatgpt.com/g/g-6a1879be030481919755309f117e7929-agente-skincare-metodo-tts",
    geminiUrl: null,
    imageUrl: "/skincare.png",
    accent: "from-rose-400 to-pink-300",
  },
  {
    slug: "scripts-makeup",
    chip: "Makeup",
    name: "Scripts Makeup",
    category: "scripts",
    emoji: "💄",
    shortDescription: "Pra base, batom, sombra, blush, contorno, gloss.",
    howItWorks:
      "Maquiadora profissional + Método TTS. Gera 5 roteiros com forte apelo visual — tutorial rápido, erro comum, transformação, antes/depois. Foco em demonstração que prende nos primeiros 3 segundos.",
    chatgptUrl: null,
    geminiUrl: null,
    imageUrl: "/makeup.png",
    accent: "from-purple-500 to-fuchsia-400",
  },
  {
    slug: "scripts-cabelo",
    chip: "Cabelo",
    name: "Scripts Cabelo",
    category: "scripts",
    emoji: "💇‍♀️",
    shortDescription: "Pra shampoo, condicionador, máscara, óleos.",
    howItWorks:
      "Especialista em tricologia + Método TTS. Gera 5 roteiros com tom emocional, identificação com a dor do cabelo, rotina de uso visível.",
    chatgptUrl: null,
    geminiUrl: null,
    imageUrl: "/cabelo.png",
    accent: "from-amber-500 to-yellow-400",
  },
  {
    slug: "scripts-perfumes",
    chip: "Perfumes",
    name: "Scripts Perfumes & Body Splash",
    category: "scripts",
    emoji: "🌸",
    shortDescription: "Pra perfumes, body splash, brumas, hidratantes perfumados.",
    howItWorks:
      "Especialista em fragrâncias + Método TTS. Gera 5 roteiros sensoriais — storytelling, comparação com perfumes caros, ocasiões de uso (encontro, viagem, dia a dia).",
    chatgptUrl: null,
    geminiUrl: null,
    imageUrl: "/perfume.png",
    accent: "from-pink-400 to-purple-300",
  },
  {
    slug: "scripts-casa-organizacao",
    chip: "Casa & Org.",
    name: "Scripts Casa e Organização",
    category: "scripts",
    emoji: "🏠",
    shortDescription: "Pra organizadores, gadgets de cozinha, utilidades do lar.",
    howItWorks:
      "Especialista em organização e funcionalidade da casa + Método TTS. Gera 5 roteiros satisfatórios, antes/depois, solução de problema do dia a dia.",
    chatgptUrl: null,
    geminiUrl: null,
    imageUrl: "/casa.png",
    accent: "from-emerald-500 to-teal-400",
  },
  {
    slug: "scripts-moda",
    chip: "Moda",
    name: "Scripts Moda",
    category: "scripts",
    emoji: "👗",
    shortDescription: "Pra roupas, looks, peças virais, acessórios de moda.",
    howItWorks:
      "Stylist + Método TTS. Gera 5 roteiros focados em look do dia, transformação, versatilidade (1 peça 3 looks), tendência.",
    chatgptUrl: null,
    geminiUrl: null,
    imageUrl: "/moda.png",
    accent: "from-indigo-500 to-violet-400",
  },
  {
    slug: "scripts-eletronicos",
    chip: "Eletrônicos",
    name: "Scripts Eletrônicos",
    category: "scripts",
    emoji: "📱",
    shortDescription: "Pra gadgets, acessórios tech, fones, carregadores.",
    howItWorks:
      "Especialista em tecnologia + Método TTS. Gera 5 roteiros demonstrativos — 'você não sabia que precisava disso', teste prático, hack do dia a dia, comparação.",
    chatgptUrl: null,
    geminiUrl: null,
    imageUrl: "/eletronicos.png",
    accent: "from-sky-500 to-cyan-400",
  },

  // ─── SUPORTE (geral, 1 agente) ───────────────────────────────────
  {
    slug: "suporte",
    chip: "Suporte",
    name: "Suporte Yara",
    category: "suporte",
    emoji: "💬",
    shortDescription: "Dúvidas sobre TikTok Shop, método, comissão.",
    howItWorks:
      "Sua central de ajuda. Tira dúvida sobre como cadastrar produto no TikTok Shop, comissão, frete, regras de conteúdo proibido, boas práticas, e como usar o app/Método TTS.",
    chatgptUrl: null,
    geminiUrl: null,
    imageUrl: "/suporte.png",
    accent: "from-sky-500 to-blue-400",
  },
];

/** Agrupa os agentes por categoria pra render organizado */
export function groupByCategory(items: AgentCatalogItem[]): Record<AgentCategory, AgentCatalogItem[]> {
  const groups: Record<AgentCategory, AgentCatalogItem[]> = {
    info: [],
    scripts: [],
    suporte: [],
  };
  for (const item of items) groups[item.category].push(item);
  return groups;
}

export const CATEGORY_LABELS: Record<AgentCategory, { label: string; description: string }> = {
  info: {
    label: "Análise de Produto",
    description: "Monta a ficha rica que vira base pros roteiros.",
  },
  scripts: {
    label: "Roteiros por Nicho",
    description: "Escolha o nicho do seu produto. Cada agente é uma especialista.",
  },
  suporte: {
    label: "Suporte",
    description: "Dúvidas sobre o método, TikTok Shop e o app.",
  },
};
