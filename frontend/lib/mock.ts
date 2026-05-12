import { type AgentId } from "./agents";

export const USER = {
  name: "Maria",
  fullName: "Maria Silva",
  email: "maria@criadoras.com",
  initial: "M",
  niche: "Saúde",
};

export const PRODUCTS = [
  {
    id: "nac-always-fit",
    name: "NAC Always Fit",
    category: "Suplemento · Saúde",
    target: "Mulheres 25–45 anos, rotina cansativa",
    pain: ["Cansaço crônico", "Falta de foco", "Pele opaca"],
    strengths: ["Antioxidante", "Aprovado ANVISA", "Uso diário"],
    priceRange: "R$ 89–149",
    competitors: ["Marca X (R$ 120)", "Marca Y (R$ 95)"],
    scripts: 10,
    virais: 3,
    updated: "há 2h",
  },
  {
    id: "massageador-facial",
    name: "Massageador facial",
    category: "Beleza · Skincare",
    target: "Mulheres 22–35 com rotina de skincare",
    pain: ["Inchaço matinal", "Linhas de expressão"],
    strengths: ["7 modos de vibração", "Bateria 30 dias"],
    priceRange: "R$ 69–129",
    competitors: ["FaceFit", "GlowPro"],
    scripts: 5,
    virais: 2,
    updated: "ontem",
  },
  {
    id: "esmalte-gel-uv",
    name: "Esmalte gel UV",
    category: "Unhas · Beleza",
    target: "Mulheres 18–32, fãs de esmalteria",
    pain: ["Esmalte descasca", "Salão é caro"],
    strengths: ["Cura em 60s", "Dura 21 dias"],
    priceRange: "R$ 29–69",
    competitors: ["GelMaster"],
    scripts: 7,
    virais: 4,
    updated: "2 dias",
  },
  {
    id: "babyliss-pro",
    name: "Babyliss profissional",
    category: "Cabelo · Beleza",
    target: "Mulheres 25–45",
    pain: ["Cabelo armado", "Frizz"],
    strengths: ["230°C ajustável", "Cerâmica turmalina"],
    priceRange: "R$ 149–249",
    competitors: ["Taiff"],
    scripts: 3,
    virais: 1,
    updated: "3 dias",
  },
];

export const VIRAIS = [
  {
    id: "v1",
    productId: "nac-always-fit",
    thumbnailLabel: "creator 01",
    views: "2.3M",
    revenue: "R$ 45k",
    quote: "isso aqui mudou minha vida em 7 dias",
    creator: "@fitmari",
    country: "BR" as const,
    hook: "isso aqui mudou minha vida em 7 dias e nem preciso da academia",
    problem: "cansaço, pele opaca, sem energia pra rotina",
    solution: "tomar diário, antes de dormir, sem efeito colateral",
    cta: "tá no link aí em cima, corre que tem pouquinho",
  },
  {
    id: "v2",
    productId: "nac-always-fit",
    thumbnailLabel: "creator 02",
    views: "890k",
    revenue: "R$ 18k",
    quote: "minha mãe não acreditou que era só isso",
    creator: "@beautyhacks",
    country: "BR" as const,
    hook: "minha mãe não acreditou que era só isso",
    problem: "rotina pesada, cansaço acumulado",
    solution: "1 cápsula de manhã com café",
    cta: "achei na vitrine ali, corre",
  },
  {
    id: "v3",
    productId: "esmalte-gel-uv",
    thumbnailLabel: "creator 03",
    views: "1.2M",
    revenue: "R$ 22k",
    quote: "gastei R$ 99 e troquei a esmalteria por isso",
    creator: "@dramaequeen",
    country: "BR" as const,
    hook: "gastei R$ 99 e troquei a esmalteria por isso",
    problem: "esmalteria custa R$80 e descasca em 5 dias",
    solution: "kit completo + lâmpada UV em casa",
    cta: "vitrine aí, é piscadinha",
  },
  {
    id: "v4",
    productId: "massageador-facial",
    thumbnailLabel: "creator 04",
    views: "1.8M",
    revenue: "R$ 78k",
    quote: "acordo sem cara de quem dormiu 3h",
    creator: "@laurinhabh",
    country: "BR" as const,
    hook: "acordo sem cara de quem dormiu 3h",
    problem: "inchaço matinal, olheiras",
    solution: "5 min de massageador antes do skincare",
    cta: "tá ali na sacolinha amarela",
  },
];

export type HookRow = {
  number: number;
  text: string;
  emotion: string;
  trigger: string;
  reason: string;
  fire: 1 | 2 | 3;
};

export const HOOKS: HookRow[] = [
  {
    number: 1,
    text: "o barato que saiu caro… mas não é o caso desse aqui ó",
    emotion: "Identificação",
    trigger: "Curiosidade",
    reason: "Quebra de expectativa + analogia popular, prende em 1.5s.",
    fire: 3,
  },
  {
    number: 2,
    text: "minha cunhada toma escondida e eu descobri o pote no banheiro",
    emotion: "Fofoca",
    trigger: "Social proof",
    reason: "Tom de fofoca ativa o cérebro social, é impossível scrollar.",
    fire: 3,
  },
  {
    number: 3,
    text: "isso aqui só pode ser piada — R$89 e faz o que o caro não faz",
    emotion: "Humor",
    trigger: "Comparação",
    reason: "Indignação cômica + prova social escondida no preço.",
    fire: 2,
  },
  {
    number: 4,
    text: "se eu te contar que eu desisti de café por causa disso aqui",
    emotion: "Esperança",
    trigger: "Recompensa",
    reason: "Promessa específica + identificação com a vida real.",
    fire: 2,
  },
  {
    number: 5,
    text: "passei 6 meses cansada porque ninguém me contou disso",
    emotion: "Frustração",
    trigger: "FOMO",
    reason: "Mostra que existia uma resposta o tempo todo, ativa curiosidade.",
    fire: 3,
  },
  {
    number: 6,
    text: "minha médica jurou que eu tava com B12 baixa — não era",
    emotion: "Curiosidade",
    trigger: "Autoridade",
    reason: "Subverte expectativa de figura de autoridade.",
    fire: 2,
  },
  {
    number: 7,
    text: "eu não acredito que vou expor isso mas tá aqui ó",
    emotion: "Vulnerabilidade",
    trigger: "Curiosidade",
    reason: "Sensação de segredo proibido + reveal.",
    fire: 2,
  },
  {
    number: 8,
    text: "tô tomando isso há 30 dias e até meu cachorro reparou",
    emotion: "Humor",
    trigger: "Identificação",
    reason: "Hipérbole engraçada, vibe de fofoca caseira.",
    fire: 1,
  },
  {
    number: 9,
    text: "se sua tia toma chá pra energia, mostra isso pra ela",
    emotion: "Conexão",
    trigger: "Comparação social",
    reason: "Toca em comportamento universal brasileiro.",
    fire: 2,
  },
  {
    number: 10,
    text: "compra na vitrine — não nesse, na de cima da página",
    emotion: "Urgência",
    trigger: "CTA",
    reason: "Especificidade brutal + sensação de exclusividade.",
    fire: 3,
  },
];

export type ConversationPreview = {
  id: string;
  title: string;
  agent: AgentId;
  preview: string;
  time: string;
};

export const CONVERSATIONS: ConversationPreview[] = [
  {
    id: "c1",
    title: "NAC Always Fit",
    agent: "script",
    preview: "10 hooks com humor brasileiro pro suplemento…",
    time: "há 2h",
  },
  {
    id: "c2",
    title: "Skincare virais essa semana",
    agent: "viral",
    preview: "Trouxe os 5 vídeos top do nicho beleza no BR…",
    time: "ontem",
  },
  {
    id: "c3",
    title: "Como ativo afiliados na loja?",
    agent: "help",
    preview: "No painel seller-br, vai em Marketing → Afiliados…",
    time: "2 dias",
  },
];

export const USAGE = {
  period: "Mai/2026",
  searches: { used: 18, max: 30 },
  scripts: { used: 32, max: 50 },
  resetDate: "08/06/2026",
};

export const PLAN = {
  name: "Pro",
  price: "R$ 49,90",
  status: "active" as const,
  renewsAt: "08/06/2026",
  features: [
    "30 buscas Vyral/mês",
    "50 scripts/mês",
    "Análise ilimitada de produtos",
    "Tira-dúvidas ilimitado",
    "Suporte por chat",
  ],
};

export const NICHES = ["Beleza", "Moda", "Acessórios", "Casa", "Saúde", "Eletrônicos", "Pet", "Fitness"];

export type NewsCategory = "atualizacao" | "estrategia" | "tendencia" | "tutorial" | "evento" | "alerta";

export type NewsPost = {
  slug: string;
  title: string;
  subtitle: string;
  category: NewsCategory;
  publishedAt: string; // ISO date
  publishedDisplay: string; // pretty
  readingMinutes: number;
  author: { name: string; role: string; initial: string };
  cover: string; // label for placeholder
  tags: string[];
  isNew?: boolean;
  body: NewsBlock[];
};

export type NewsBlock =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "quote"; text: string; by?: string }
  | { kind: "list"; items: string[] }
  | { kind: "callout"; tone: "brand" | "warn" | "good"; title: string; text: string };

export const NEWS_CATEGORIES: Record<NewsCategory, { label: string; emoji: string }> = {
  atualizacao: { label: "Atualização", emoji: "📣" },
  estrategia: { label: "Estratégia", emoji: "🎯" },
  tendencia: { label: "Tendência", emoji: "🔥" },
  tutorial: { label: "Tutorial", emoji: "🛠" },
  evento: { label: "Evento", emoji: "🗓" },
  alerta: { label: "Alerta", emoji: "⚠️" },
};

const EXPERT_AUTHOR = { name: "Aline · expert Spark", role: "Mentora TikTok Shop", initial: "A" };

export const NEWS: NewsPost[] = [
  {
    slug: "tiktok-shop-comissao-junho-2026",
    title: "TikTok Shop atualizou as comissões — o que muda pra você em junho",
    subtitle: "Algumas categorias subiram, outras caíram. Já adaptei minha estratégia de divulgação aqui.",
    category: "atualizacao",
    publishedAt: "2026-05-11",
    publishedDisplay: "hoje · 09:14",
    readingMinutes: 3,
    author: EXPERT_AUTHOR,
    cover: "atualizacao tiktok shop",
    tags: ["TikTok Shop", "Comissão", "BR"],
    isNew: true,
    body: [
      {
        kind: "p",
        text: "Bom dia, criadoras. O TikTok Shop publicou ontem a tabela nova de comissões pra junho/2026 e algumas mexidas valem a pena reorganizar o que você vinha divulgando.",
      },
      { kind: "h", text: "O que mudou" },
      {
        kind: "list",
        items: [
          "Beleza e cuidados pessoais: subiu pra 18% (de 15%)",
          "Suplementos e saúde: 20% (mantém)",
          "Casa e cozinha: subiu pra 12% (de 10%)",
          "Moda íntima: caiu pra 14% (de 17%)",
        ],
      },
      {
        kind: "callout",
        tone: "brand",
        title: "Minha leitura",
        text: "Se você tava pesado em moda íntima, dá uma olhada em beleza e casa esse mês — a margem ficou bem mais convidativa.",
      },
      { kind: "h", text: "O que fazer hoje" },
      {
        kind: "list",
        items: [
          "Confere as comissões dos seus produtos atuais no painel seller-br",
          "Roda o agente Virais filtrando por categoria que subiu pra ver oportunidade",
          "Atualiza os scripts dos produtos que continuam — não precisa rejeitar tudo",
        ],
      },
      {
        kind: "p",
        text: "Tem dúvida sobre algum produto seu específico? Manda no agente Tira-dúvidas que eu deixei ele atualizado com a tabela nova.",
      },
    ],
  },
  {
    slug: "5-ganchos-quentes-de-maio",
    title: "5 ganchos que tão estourando essa semana — adapta agora",
    subtitle: "Coletei dos vídeos com 1M+ views nos últimos 7 dias. Funcionam em quase qualquer nicho.",
    category: "tendencia",
    publishedAt: "2026-05-10",
    publishedDisplay: "ontem",
    readingMinutes: 4,
    author: EXPERT_AUTHOR,
    cover: "ganchos virais",
    tags: ["Hook", "Viral", "Copywriting"],
    isNew: true,
    body: [
      {
        kind: "p",
        text: "Passei os últimos 3 dias mapeando o que tá colando no feed brasileiro. Esses 5 formatos têm aparecido em diferentes nichos e converteram bem.",
      },
      { kind: "h", text: "1. O “esquema fofoca”" },
      {
        kind: "quote",
        text: "minha cunhada toma escondida e eu descobri o pote no banheiro",
        by: "@laurinhabh — 1.8M views",
      },
      {
        kind: "p",
        text: "Funciona porque ativa o cérebro social. A pessoa precisa saber o que vem depois. Adapte: troca cunhada por mãe, irmã, vizinha.",
      },
      { kind: "h", text: "2. O “especificidade absurda”" },
      {
        kind: "quote",
        text: "gastei R$ 89 e hoje ninguém me acredita que sou mãe de 3",
        by: "@fitmari — 2.3M views",
      },
      {
        kind: "callout",
        tone: "good",
        title: "Dica",
        text: "Use o agente Scripts e fala: \"cria 10 variações desse gancho pro produto X\". Ele já entrega com a estrutura certinha.",
      },
      { kind: "h", text: "3, 4 e 5 (continuação no app)" },
      {
        kind: "p",
        text: "Postei os outros 3 dentro do agente Virais com vídeos de exemplo. Roda lá e olha a aba “destaques desta semana”.",
      },
    ],
  },
  {
    slug: "live-quinta-21h-roteiro-pra-vender-frio",
    title: "Live na quinta às 21h — roteiro pra vender no frio",
    subtitle: "Vou montar 3 scripts ao vivo pra produtos que vendem mais no inverno.",
    category: "evento",
    publishedAt: "2026-05-09",
    publishedDisplay: "anteontem",
    readingMinutes: 1,
    author: EXPERT_AUTHOR,
    cover: "live evento",
    tags: ["Live", "Inverno", "Script"],
    body: [
      { kind: "p", text: "Quinta-feira, 21h no insta. Vou mostrar como eu estruturo script pra produto de inverno (chá térmico, manta, hidratante denso, suplemento de imunidade)." },
      { kind: "list", items: ["Roteiro com gancho + dor + solução", "Variação com humor", "Versão 30s e 60s pra cada"] },
      {
        kind: "callout",
        tone: "brand",
        title: "Salva o link",
        text: "instagram.com/aline.tiktokshop · ativa o sininho pra não perder.",
      },
    ],
  },
  {
    slug: "cuidado-com-promessa-medica",
    title: "Cuidado com promessa médica nos scripts de suplemento",
    subtitle: "TikTok tá derrubando vídeos com claim de cura. Olha como fazer certo.",
    category: "alerta",
    publishedAt: "2026-05-07",
    publishedDisplay: "4 dias atrás",
    readingMinutes: 5,
    author: EXPERT_AUTHOR,
    cover: "alerta",
    tags: ["Política", "Suplemento", "Compliance"],
    body: [
      {
        kind: "callout",
        tone: "warn",
        title: "Atenção",
        text: "3 criadoras do grupo perderam vídeos por causa de termos médicos sem ressalva.",
      },
      { kind: "p", text: "O TikTok tem reforçado moderação em claims médicos. Não significa que você não pode falar do produto — significa que o jeito de falar muda." },
      { kind: "h", text: "Evite essas palavras" },
      { kind: "list", items: ["“cura”", "“trata”", "“remédio”", "“aprovado pela medicina”", "“substitui o médico”"] },
      { kind: "h", text: "Use no lugar" },
      { kind: "list", items: ["“ajuda a sentir”", "“minha experiência”", "“o que funcionou pra mim”", "“aliado da rotina”"] },
      {
        kind: "p",
        text: "Eu atualizei o prompt do agente Scripts pra ele já trazer linguagem segura. Mas confere antes de postar — você é a responsável final.",
      },
    ],
  },
  {
    slug: "tutorial-vitrine-tiktok-shop",
    title: "Tutorial: montando uma vitrine que converte (passo a passo)",
    subtitle: "9 minutos de leitura. Mostra onde 90% das criadoras erram na vitrine.",
    category: "tutorial",
    publishedAt: "2026-05-05",
    publishedDisplay: "6 dias atrás",
    readingMinutes: 9,
    author: EXPERT_AUTHOR,
    cover: "tutorial vitrine",
    tags: ["Tutorial", "Vitrine", "Conversão"],
    body: [
      { kind: "p", text: "Vou direto ao ponto: vitrine não é catálogo. É um funil. Quando você entende isso, dobra o ticket médio." },
      { kind: "h", text: "Estrutura ideal em 3 camadas" },
      { kind: "list", items: ["Topo: produto de R$ 19–39 (impulsiona o clique)", "Meio: produto âncora R$ 89–149 (a venda principal)", "Fundo: complemento R$ 30–60 (aumenta ticket)"] },
      {
        kind: "callout",
        tone: "good",
        title: "Exemplo",
        text: "Topo: máscara facial R$ 24. Meio: sérum vitamina C R$ 119. Fundo: roller massagem R$ 49.",
      },
      { kind: "p", text: "Continua dentro do tutorial — abre no agente Tira-dúvidas se quiser que eu explique pra um caso específico seu." },
    ],
  },
];

export function getNewsBySlug(slug: string): NewsPost | undefined {
  return NEWS.find((n) => n.slug === slug);
}
