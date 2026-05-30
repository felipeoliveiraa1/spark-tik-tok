import Link from "next/link";
import {
  ArrowRight,
  Check,
  Sparkle,
  ShieldCheck,
  Clock,
  GraduationCap,
  Lock,
  Star,
  Package,
  PenLine,
  Activity,
  Radio,
  Newspaper,
  Heart,
  Quote,
} from "lucide-react";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { Sticker } from "@/components/atoms/sticker";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { AgentTile } from "@/components/atoms/agent-tile";
import { type AgentId } from "@/lib/agents";
import { VISIBLE_AGENTS_CATALOG, CATEGORY_LABELS } from "@/lib/agents-catalog";

const KIWIFY_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL ?? "https://pay.kiwify.com.br/YOR83Pu";

// =================================================================
// COPY — editorial, sem clichê de landing
// =================================================================

const agents: { id: AgentId; t: string; d: string }[] = [
  {
    id: "info",
    t: "análise",
    d: "Sobe a foto. A IA devolve público, dor, gatilho, hook e objeção. Em 30 segundos você sabe pra quem vender e como.",
  },
  {
    id: "script",
    t: "roteiro",
    d: "5 estilos por produto. Gancho 3s, desenvolvimento, benefício real, CTA leve. Você escolhe o que salva.",
  },
  {
    id: "help",
    t: "tira-dúvida",
    d: "Regra do TikTok Shop, conta de criador, comissão, frete, política. Pergunta no chat — resposta na hora.",
  },
];

const antesDepois = [
  { antes: "Planilha bagunçada de produto", depois: "Catálogo organizado no app" },
  { antes: "IA gringa que escreve igual robô", depois: "Agente com tom de amiga" },
  { antes: "Postar no escuro sem método", depois: "Rotina diária com aderência mensurável" },
  { antes: "Tirar dúvida no DM do Insta", depois: "Tira-dúvida no chat, 24/7" },
  { antes: "Aula em PDF de 2 anos atrás", depois: "Aula em vídeo + live ao vivo no app" },
  { antes: "Roteiro perdido no bloco de notas", depois: "Biblioteca de scripts salvos" },
];

const pilares = [
  { Icon: Sparkle, t: "agentes ia", d: "10 especialistas: 9 nichos de scripts e tira-dúvida." },
  { Icon: Package, t: "catálogo", d: "Seus produtos cadastrados, prontos pra usar nos agentes." },
  { Icon: PenLine, t: "scripts", d: "Biblioteca dos seus roteiros salvos. Você escolhe o que vai." },
  { Icon: Activity, t: "rotina", d: "Aderência semanal, evolução e referências num lugar só." },
  { Icon: GraduationCap, t: "aulas", d: "Trilha completa do Método TTS, em vídeo." },
  { Icon: Radio, t: "ao vivo", d: "Encontros com a Yara pra tirar dúvida em tempo real." },
  { Icon: Newspaper, t: "news", d: "Atualizações do TikTok Shop direto no seu feed." },
  { Icon: Heart, t: "tom de amiga", d: "Doce, brasileira, sem inglês forçado nem robôzice." },
];

const steps = [
  { n: "01", t: "cadastra produto", d: "Foto, link, print ou texto. A IA analisa em segundos." },
  { n: "02", t: "pede roteiro", d: "5 estilos, fórmula validada. Você escolhe o que combina." },
  { n: "03", t: "salva o bom", d: "Roteiro que curtiu vai pra biblioteca. Nada salva sem você." },
  { n: "04", t: "grava e marca", d: "Posta o vídeo, marca a rotina, vê a aderência subir." },
];

const features = [
  "10 agentes IA · 9 especialistas por nicho + 1 suporte",
  "Catálogo ilimitado dos seus produtos",
  "Biblioteca ilimitada dos seus roteiros",
  "Análise de produto com foto, link ou texto — sem limite",
  "5 estilos por roteiro com fórmula validada",
  "Templates pra +12 nichos · você pode adicionar o seu",
  "Rotina diária com aderência semanal e evolução",
  "Aulas em vídeo · trilha Método TTS completa",
  "Lives ao vivo periódicas com Q&A",
  "News do TikTok Shop direto no app",
  "Você no controle: nada salva sem o seu clique",
  "App no celular (PWA) · offline em algumas telas",
  "Atualizações constantes e novos templates",
];

const featuredTestimonial = {
  name: "Camila S.",
  role: "Começou faz 3 meses · faturou R$ 2k em 30 dias",
  quote:
    "Eu nunca tinha vendido nada online. As aulas me ensinaram o método, a rotina me deu disciplina, os agentes me deram roteiro. Em 30 dias bati R$ 2 mil. E o app é tão lindo que eu abro só pra olhar.",
};

const smallTestimonials = [
  {
    name: "Marcela R.",
    role: "Skincare · 8 meses",
    quote: "Antes 1 vídeo por semana. Hoje 4-5 por dia. Venda triplicou.",
  },
  {
    name: "Bia M.",
    role: "R$ 8k/mês",
    quote: "Os roteiros não parecem IA. Hook que prende, CTA que não força.",
  },
  {
    name: "Aline F.",
    role: "Mãe empreendedora",
    quote: "Primeira IA que parece eu falando. E o app é o mais bonito que já usei.",
  },
];

const faqs = [
  {
    q: "Preciso entender de IA pra usar?",
    a: "Não. Você conversa com os agentes como conversa com uma amiga — em português, sem termo técnico.",
  },
  {
    q: "A IA salva tudo automático? Vou perder controle?",
    a: "Não. Aqui a IA é consultora, não autora. Você decide o que salva no seu catálogo e na biblioteca de scripts. Nada vai pro seu repositório sem você clicar.",
  },
  {
    q: "Quanto tempo até o primeiro resultado?",
    a: "Primeiro roteiro: 30 segundos. Primeira venda: depende do seu funil, mas a maioria das alunas vê diferença na primeira semana usando a rotina.",
  },
  {
    q: "Funciona pro meu nicho?",
    a: "Sim. Temos templates pra skincare, makeup, suplementos, cabelo, perfumaria, casa, moda, maternidade, eletrônicos, acessórios, pet, calçados — e você pode adicionar o seu.",
  },
  {
    q: "É só pra quem já vende?",
    a: "Não. A maior parte das alunas tá começando. As aulas ensinam o método do zero.",
  },
  {
    q: "Posso usar no celular?",
    a: "Sim, foi feito pra celular primeiro. Instala como app no iPhone ou Android.",
  },
  {
    q: "Tem limite de uso?",
    a: "Não. Ilimitado em tudo — análise, roteiro, salvamento, perguntas.",
  },
  {
    q: "Como funciona a garantia?",
    a: "7 dias pra testar. Se não rolar, reembolso 100% pela Kiwify. Sem pergunta.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. 2 cliques pelo painel da Kiwify. Sem multa, sem fidelidade.",
  },
];

// =================================================================
// ATOMS
// =================================================================

function CTAPrimary({
  label = "Quero o método agora",
  size = "lg" as "lg" | "md",
}) {
  return (
    <a href={KIWIFY_CHECKOUT_URL} target="_blank" rel="noreferrer" className="block">
      <SButton variant="primary" size={size} full IconRight={ArrowRight}>
        {label}
      </SButton>
    </a>
  );
}

function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={14} fill="oklch(0.85 0.18 80)" stroke="oklch(0.85 0.18 80)" />
      ))}
    </div>
  );
}

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className={`text-eyebrow ${light ? "text-white/85" : "text-spark-brand"}`}>
      {children}
    </div>
  );
}

function ChapterMarker({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-4 text-spark-ink-50">
      <span className="font-mono text-[12px] font-extrabold tracking-wider">
        cap. {n}
      </span>
      <div className="flex-1 h-px bg-spark-hairline" />
      <span className="text-eyebrow text-spark-brand">{title}</span>
    </div>
  );
}

// =================================================================
// PÁGINA
// =================================================================

export default function LandingPage() {
  return (
    <div className="min-h-dvh w-full bg-spark-bg overflow-x-hidden">
      {/* ============== HEADER ============== */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-spark-bg/85 border-b border-spark-hairline">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-10 py-1.5 lg:py-2 flex items-center gap-2 sm:gap-3">
          {/* Logo responsiva: maior no desktop, media no mobile */}
          <div className="lg:hidden">
            <SparkWordmark size={52} />
          </div>
          <div className="hidden lg:block">
            <SparkWordmark size={76} />
          </div>
          <div className="flex-1" />

          {/* Entrar — agora visivel em mobile tambem */}
          <Link
            href="/login"
            className="inline-flex items-center px-3 sm:px-3.5 py-2 rounded-full text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 transition-all duration-300"
          >
            Entrar
          </Link>

          <a href={KIWIFY_CHECKOUT_URL} target="_blank" rel="noreferrer">
            <SButton variant="primary" size="sm" IconRight={ArrowRight}>
              Quero entrar
            </SButton>
          </a>
        </div>
      </header>

      {/* ============== HERO — capa de revista ============== */}
      <section className="relative overflow-hidden hero-radial">
        {/* Blobs reduzidos e mais transparentes no mobile pra nao lavar
            o fundo de rosa e prejudicar contraste do headline gradient */}
        <HeroBlob
          color="rose"
          variant={1}
          className="-top-32 -left-32 w-[360px] h-[360px] lg:w-[640px] lg:h-[640px] opacity-60 lg:opacity-100"
        />
        <HeroBlob
          color="peach"
          variant={2}
          className="top-20 -right-40 w-[340px] h-[340px] lg:w-[600px] lg:h-[600px] opacity-50 lg:opacity-100"
        />
        <HeroBlob
          color="lilac"
          variant={3}
          className="-bottom-40 left-1/4 w-[300px] h-[300px] lg:w-[520px] lg:h-[520px] opacity-50 lg:opacity-100"
        />
        <SparkleField count={24} seed={777} className="opacity-55" />

        {/* Sticker editorial */}
        <div className="hidden xl:block absolute top-20 right-12 z-10">
          <Sticker text="ED. PREMIUM · MÉTODO TTS · 2026 · " emoji="✨" size={134} />
        </div>

        <div className="relative max-w-[1240px] mx-auto px-5 lg:px-10 pt-14 lg:pt-24">
          {/* Cabeçalho de revista */}
          <SectionReveal direction="down" durationMs={500}>
            <div className="flex items-center justify-between text-spark-ink-50 mb-10">
              <div className="font-mono text-[11px] font-extrabold uppercase tracking-widest">
                edição inaugural · vol. 01
              </div>
              <div className="hidden sm:flex font-mono text-[11px] font-extrabold uppercase tracking-widest gap-4">
                <span>tiktok shop</span>
                <span>·</span>
                <span>criadoras br</span>
                <span>·</span>
                <span>método</span>
              </div>
            </div>
          </SectionReveal>

          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12 lg:gap-16 items-center pb-20 lg:pb-28">
            <div>
              <SectionReveal direction="up" delay={100} durationMs={1000}>
                <h1
                  className="font-display lowercase tracking-tight text-spark-ink leading-[0.82]"
                  style={{ fontSize: "clamp(3.5rem, 9vw, 8rem)" }}
                >
                  uma rotina.
                  <br />
                  mil roteiros.
                  <br />
                  <span className="text-grad-brand">um método.</span>
                </h1>
              </SectionReveal>

              <SectionReveal direction="up" delay={350}>
                <p className="mt-8 text-fluid-lead text-spark-ink-70 leading-snug max-w-[56ch] font-semibold">
                  Pra criadora que cansou de IA gringa, planilha bagunçada e palpite de guru.{" "}
                  <strong>Sistema integrado</strong> de agentes, catálogo, scripts, rotina, aulas e
                  lives — feito por mulher pra mulher, com método.
                </p>
              </SectionReveal>

              <SectionReveal direction="up" delay={500}>
                <div className="mt-10 max-w-[440px]">
                  <CTAPrimary label="Quero o método · R$ 49/mês" />
                  <div className="mt-3.5 flex items-center justify-center gap-2 text-[12px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
                    <ShieldCheck size={13} strokeWidth={2.5} className="text-good" />
                    7 dias de garantia · cancela quando quiser
                  </div>
                </div>
              </SectionReveal>

              <SectionReveal direction="up" delay={650}>
                <div className="mt-10 flex items-center gap-4">
                  <div className="flex -space-x-2.5">
                    {["M", "C", "B", "A"].map((l, i) => (
                      <div
                        key={i}
                        className="w-11 h-11 rounded-full border-[3px] border-spark-bg bg-brand-grad text-white flex items-center justify-center font-display text-[16px] shadow-lift-brand"
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                  <div>
                    <Stars n={5} />
                    <div className="text-[12px] text-spark-ink-70 font-extrabold mt-1">
                      +500 criadoras · 4.9 ★
                    </div>
                  </div>
                </div>
              </SectionReveal>
            </div>

            {/* Mockup — duas telas empilhadas em perspectiva */}
            <SectionReveal direction="up" delay={400} durationMs={900}>
              <div className="relative mx-auto lg:mx-0 max-w-[440px]">
                {/* Phone secundário atrás (rotina) */}
                <div
                  className="hidden sm:block absolute top-12 -left-12 w-[230px] rounded-[36px] border-[8px] border-spark-ink shadow-hero overflow-hidden bg-spark-bg"
                  style={{ transform: "rotate(-8deg)" }}
                  aria-hidden
                >
                  <div className="aspect-[9/19] bg-brand-grad-soft relative overflow-hidden flex flex-col items-center justify-center p-5">
                    <div className="text-[9px] font-extrabold text-spark-brand-deep uppercase tracking-widest">
                      ✦ rotina hoje
                    </div>
                    <svg width="130" height="130" viewBox="0 0 220 220" className="rotate-[-90deg] mt-4">
                      <defs>
                        <linearGradient id="mockRing" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.22 350)" />
                          <stop offset="100%" stopColor="oklch(0.72 0.18 30)" />
                        </linearGradient>
                      </defs>
                      <circle cx="110" cy="110" r="92" stroke="oklch(0.94 0.02 340)" strokeWidth="18" fill="none" />
                      <circle
                        cx="110"
                        cy="110"
                        r="92"
                        stroke="url(#mockRing)"
                        strokeWidth="18"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 92}
                        strokeDashoffset={2 * Math.PI * 92 * (1 - 0.84)}
                      />
                    </svg>
                    <div className="-mt-[88px] font-display lowercase text-spark-ink leading-none text-[36px]">
                      84%
                    </div>
                    <div className="mt-14 text-[9px] font-extrabold text-spark-ink-70 uppercase tracking-wider">
                      aderência semanal
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-good/10 text-good text-[8px] font-extrabold uppercase tracking-wider">
                      <Activity size={9} strokeWidth={2.5} />
                      streak: 12d
                    </div>
                  </div>
                </div>

                {/* Phone principal — home magazine */}
                <div className="relative w-[290px] sm:w-[330px] mx-auto rounded-[44px] border-[10px] border-spark-ink shadow-hero overflow-hidden bg-white">
                  <div className="aspect-[9/19.5] bg-spark-bg flex flex-col relative overflow-hidden hero-radial">
                    <HeroBlob
                      color="rose"
                      variant={1}
                      className="-top-20 -right-20 w-[260px] h-[260px]"
                    />
                    <HeroBlob
                      color="peach"
                      variant={2}
                      className="bottom-20 -left-20 w-[220px] h-[220px]"
                    />
                    <SparkleField count={8} seed={42} className="opacity-50" />

                    {/* Status bar fake */}
                    <div className="px-5 pt-3 flex items-center justify-between text-[9px] font-extrabold text-spark-ink font-mono">
                      <span>09:42</span>
                      <span className="flex items-center gap-1">●●●●</span>
                    </div>

                    <div className="pt-6 px-5 relative">
                      <div className="flex items-center justify-between">
                        <SparkWordmark size={28} />
                        <div className="w-9 h-9 rounded-full bg-brand-grad text-white flex items-center justify-center font-display text-[14px] shadow-lift-brand">
                          M
                        </div>
                      </div>

                      <div className="mt-6 text-eyebrow text-spark-brand">✦ boa tarde, maria</div>
                      <div
                        className="mt-1.5 font-display lowercase text-spark-ink leading-[0.88]"
                        style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)" }}
                      >
                        chega de postar
                        <br />
                        <span className="text-grad-brand">no escuro.</span>
                      </div>

                      {/* Quick KPIs em row mais visual */}
                      <div className="mt-5 flex items-center gap-2">
                        {[
                          { e: "📦", v: "12", l: "produtos", tone: true },
                          { e: "✍️", v: "47", l: "scripts" },
                          { e: "🎓", v: "8/15", l: "aulas" },
                        ].map((k, i) => (
                          <div
                            key={i}
                            className={`flex-1 p-2.5 rounded-spark-xl border shadow-rest ${
                              k.tone
                                ? "bg-brand-grad-soft border-spark-brand/20"
                                : "bg-spark-surface border-spark-hairline"
                            }`}
                          >
                            <div className="text-[13px] leading-none">{k.e}</div>
                            <div
                              className={`mt-1 font-mono font-extrabold text-[13px] leading-none ${
                                k.tone ? "text-spark-brand-deep" : "text-spark-ink"
                              }`}
                            >
                              {k.v}
                            </div>
                            <div className="text-[7px] text-spark-ink-50 font-extrabold uppercase tracking-wider mt-1">
                              {k.l}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Card de chat com agente */}
                      <div className="mt-3 p-3 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
                        <div className="text-[8.5px] font-extrabold text-spark-ink-50 uppercase tracking-wider mb-2">
                          ✦ conversa agora
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-grad text-white flex items-center justify-center text-[12px] shrink-0 shadow-sm">
                            🧴
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9.5px] font-extrabold text-spark-ink">
                              scripts skincare
                            </div>
                            <div className="text-[10px] text-spark-ink-70 mt-0.5 leading-snug">
                              Já tá com 5 hooks prontos do sérum...
                            </div>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-good mt-2.5 shrink-0 animate-pulse" />
                        </div>
                      </div>

                      {/* Mini galeria de agentes por nicho */}
                      <div className="mt-3">
                        <div className="text-[8.5px] font-extrabold text-spark-ink-50 uppercase tracking-wider mb-2">
                          ✦ 10 agentes
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {["💪", "🧴", "💄", "💇‍♀️", "🌸", "🏠", "👗", "🤱", "📱", "💬"].map((e, i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full bg-spark-surface border border-spark-hairline flex items-center justify-center text-[12px] shadow-rest"
                            >
                              {e}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Floating nav bottom */}
                    <div className="px-3 pb-4 mt-3 relative">
                      <div className="flex justify-center">
                        <div className="px-2 py-1.5 rounded-full glass border border-spark-hairline shadow-lift flex items-center gap-1">
                          {[
                            { Icon: Sparkle, active: true },
                            { Icon: Package, active: false },
                            { Icon: PenLine, active: false },
                            { Icon: Activity, active: false },
                            { Icon: GraduationCap, active: false },
                          ].map((it, i) => (
                            <div
                              key={i}
                              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                it.active
                                  ? "bg-brand-grad text-white shadow-lift-brand"
                                  : "text-spark-ink-50"
                              }`}
                            >
                              <it.Icon size={12} strokeWidth={2.4} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat bubble flutuante - Yara mensagem entrando */}
                <div
                  className="hidden sm:block absolute -bottom-4 -right-8 max-w-[200px] p-3.5 rounded-spark-2xl glass border border-spark-hairline shadow-lift"
                  style={{ transform: "rotate(3deg)" }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-grad text-white flex items-center justify-center text-[14px] shrink-0">
                      💬
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9.5px] font-extrabold text-spark-brand-deep uppercase tracking-wider">
                        yara · live
                      </div>
                      <div className="text-[11px] text-spark-ink mt-1 leading-snug font-semibold">
                        Live ao vivo hoje 19h ✨
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating: badge nicho hoje */}
                <div
                  className="hidden sm:block absolute top-4 -right-6 px-3 py-2 rounded-full glass border border-spark-hairline shadow-lift"
                  style={{ transform: "rotate(6deg)" }}
                  aria-hidden
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px]">🔥</span>
                    <span className="text-[10px] font-extrabold text-spark-ink uppercase tracking-wider">
                      bombou hoje
                    </span>
                  </div>
                </div>

                {/* Original badges flutuantes (mantém pequenos no canto) */}
                <div className="hidden lg:flex absolute top-32 -right-16 flex-col gap-2">
                  {agents.slice(0, 3).map((a, i) => (
                    <div
                      key={a.id}
                      className="glass rounded-full shadow-lift border border-spark-hairline pl-1.5 pr-3 py-1 flex items-center gap-1.5"
                      style={{ transform: `translateX(${i * 12}px)` }}
                    >
                      <AgentTile agent={a.id} size={20} />
                      <span className="text-[10px] font-extrabold text-spark-ink capitalize">
                        {a.t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ============== MARQUEE — declaração horizontal ============== */}
      <section
        className="relative overflow-hidden bg-spark-ink text-white py-8 lg:py-10 border-y border-spark-ink/0"
        aria-hidden
      >
        <div className="flex whitespace-nowrap animate-marquee">
          {Array.from({ length: 4 }).map((_, k) => (
            <div key={k} className="flex items-center gap-8 pr-8">
              {[
                "MÉTODO TTS",
                "✦",
                "PRA QUEM VENDE",
                "✦",
                "NÃO PRA QUEM CHUTA",
                "✦",
                "FEITO POR MULHER",
                "✦",
                "PRA MULHER",
                "✦",
              ].map((t, i) => (
                <span
                  key={`${k}-${i}`}
                  className="font-display lowercase tracking-tight leading-none"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                >
                  {t === "✦" ? <span className="text-grad-brand">✦</span> : t.toLowerCase()}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============== CAP. 01 · O DIAGNÓSTICO ============== */}
      <section className="relative bg-spark-surface-sunken border-b border-spark-hairline overflow-hidden">
        <SparkleField count={10} seed={222} className="opacity-30" />
        <div className="relative max-w-[1100px] mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-20 lg:pb-28">
          <SectionReveal direction="up" durationMs={500}>
            <ChapterMarker n="01" title="o diagnóstico" />
          </SectionReveal>

          <SectionReveal direction="up" delay={150} durationMs={900}>
            <h2
              className="mt-8 font-display lowercase tracking-tight text-spark-ink leading-[0.88] max-w-[820px]"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              o jeito antigo de vender no tiktok shop{" "}
              <span className="text-grad-brand">já era.</span>
            </h2>
          </SectionReveal>

          <SectionReveal direction="up" delay={300}>
            <p className="mt-7 text-fluid-lead text-spark-ink-70 max-w-[58ch] leading-snug font-semibold">
              A gente cansou de planilha caindo, IA fria de gringo e palpite de guru. O Método TTS
              nasceu pra ser o oposto disso — sistema, não improviso.
            </p>
          </SectionReveal>

          {/* Comparação antes/depois */}
          <div className="mt-16 grid sm:grid-cols-2 gap-4 lg:gap-6">
            <SectionReveal direction="left" durationMs={700}>
              <div className="p-6 lg:p-8 rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-rest h-full">
                <div className="text-eyebrow text-spark-ink-50 mb-5">✦ antes</div>
                <ul className="space-y-3.5">
                  {antesDepois.map((p) => (
                    <li
                      key={p.antes}
                      className="flex items-start gap-3 text-[14.5px] text-spark-ink-70 leading-snug font-semibold"
                    >
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-spark-ink-50 shrink-0" />
                      {p.antes}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionReveal>

            <SectionReveal direction="right" durationMs={700}>
              <div className="p-6 lg:p-8 rounded-spark-3xl bg-brand-grad-soft border border-spark-brand/20 shadow-lift-brand h-full">
                <div className="text-eyebrow text-spark-brand mb-5">✦ com método tts</div>
                <ul className="space-y-3.5">
                  {antesDepois.map((p) => (
                    <li
                      key={p.depois}
                      className="flex items-start gap-3 text-[14.5px] text-spark-ink leading-snug font-semibold"
                    >
                      <div className="w-5 h-5 rounded-full bg-brand-grad text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      {p.depois}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ============== PULL-QUOTE EDITORIAL ============== */}
      <section className="relative overflow-hidden bg-spark-ink text-white">
        <SparkleField
          count={20}
          seed={111}
          color="rgba(255,255,255,0.55)"
          className="opacity-60"
        />
        <div
          aria-hidden
          className="absolute -top-32 -left-32 w-[560px] h-[560px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.24 340 / 0.35), transparent 65%)",
            filter: "blur(50px)",
          }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-32 w-[560px] h-[560px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.20 25 / 0.30), transparent 65%)",
            filter: "blur(50px)",
          }}
        />

        <div className="relative max-w-[1200px] mx-auto px-5 lg:px-10 py-24 lg:py-32 text-center">
          <SectionReveal direction="up" durationMs={500}>
            <Quote
              size={40}
              strokeWidth={2}
              className="mx-auto opacity-50 -mb-2"
            />
          </SectionReveal>

          <SectionReveal direction="up" delay={150} durationMs={1100}>
            <p
              className="font-display lowercase tracking-tight leading-[0.92] max-w-[940px] mx-auto"
              style={{ fontSize: "clamp(2.5rem, 6.5vw, 6rem)" }}
            >
              criadora não <span className="text-grad-brand">chuta.</span>
              <br />
              criadora vende com <span className="text-grad-brand">método.</span>
            </p>
          </SectionReveal>

          <SectionReveal direction="up" delay={400}>
            <div className="mt-10 text-eyebrow opacity-80">
              ✦ manifesto · método tts
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ============== CAP. 02 · O SISTEMA ============== */}
      <section className="relative overflow-hidden hero-radial">
        <HeroBlob color="rose" variant={1} className="-top-32 -left-24 w-[500px] h-[500px]" />
        <HeroBlob color="peach" variant={2} className="bottom-0 -right-32 w-[480px] h-[480px]" />
        <SparkleField count={14} seed={888} className="opacity-45" />

        <div className="relative max-w-[1200px] mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-20 lg:pb-28">
          <SectionReveal direction="up" durationMs={500}>
            <ChapterMarker n="02" title="o sistema" />
          </SectionReveal>

          <div className="mt-8 grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-end">
            <SectionReveal direction="up" delay={150} durationMs={900}>
              <h2
                className="font-display lowercase tracking-tight text-spark-ink leading-[0.88]"
                style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
              >
                tudo no <span className="text-grad-brand">mesmo app.</span>
              </h2>
            </SectionReveal>

            <SectionReveal direction="up" delay={300}>
              <p className="text-fluid-lead text-spark-ink-70 leading-snug font-semibold">
                Não é mais ferramenta isolada. É sistema integrado: você cadastra um produto e ele
                aparece nos agentes, nas referências, na sua rotina. Tudo conversa.
              </p>
            </SectionReveal>
          </div>

          {/* Pilares grid */}
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pilares.map((p, i) => (
              <SectionReveal key={p.t} direction="up" delay={i * 50}>
                <div className="group p-6 rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-rest hover:shadow-lift transition-all duration-500 ease-premium hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 rounded-spark-xl bg-brand-grad-soft text-spark-brand-deep flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <p.Icon size={22} strokeWidth={2.2} />
                  </div>
                  <div
                    className="mt-5 font-display lowercase tracking-tight text-spark-ink leading-tight"
                    style={{ fontSize: "clamp(1.1rem, 1.5vw, 1.3rem)" }}
                  >
                    {p.t}
                  </div>
                  <div className="mt-2.5 text-[13.5px] text-spark-ink-70 leading-relaxed">
                    {p.d}
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============== AGENTES — destaque ============== */}
      <section className="relative bg-spark-surface-sunken border-y border-spark-hairline overflow-hidden">
        <SparkleField count={12} seed={333} className="opacity-30" />
        <div className="relative max-w-[1200px] mx-auto px-5 lg:px-10 py-20 lg:py-28">
          <SectionReveal direction="up" durationMs={500}>
            <Eyebrow>✦ os agentes</Eyebrow>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={900}>
            <h2
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.9] max-w-[820px]"
              style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
            >
              10 especialistas. <span className="text-grad-brand">uma pra cada nicho.</span>
            </h2>
          </SectionReveal>

          <SectionReveal direction="up" delay={250}>
            <p className="mt-5 text-fluid-lead text-spark-ink-70 leading-snug max-w-[58ch] font-semibold">
              Cada agente resolve uma parte do funil. Você pergunta no chat — eles entregam. Sem
              prompt complicado, sem inglês forçado.
            </p>
          </SectionReveal>

          {/* Grid editorial com TODOS os agentes visiveis */}
          {(["info", "scripts", "suporte"] as const).map((cat, catIdx) => {
            const items = VISIBLE_AGENTS_CATALOG.filter((a) => a.category === cat);
            if (items.length === 0) return null;
            const meta = CATEGORY_LABELS[cat];
            const isScripts = cat === "scripts";
            return (
              <div key={cat} className="mt-14">
                <SectionReveal direction="up" durationMs={500} delay={catIdx * 100}>
                  <div className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
                    <div>
                      <div className="text-eyebrow text-spark-brand">
                        ✦ {meta.label.toLowerCase()}
                      </div>
                      <div className="text-[13px] text-spark-ink-50 mt-1.5 font-semibold">
                        {meta.description}
                      </div>
                    </div>
                    <div className="font-mono text-[11px] font-extrabold text-spark-ink-50 uppercase tracking-widest">
                      {items.length} {items.length === 1 ? "agente" : "agentes"}
                    </div>
                  </div>
                </SectionReveal>

                <div
                  className={`grid gap-4 ${
                    isScripts
                      ? "sm:grid-cols-2 lg:grid-cols-4"
                      : "lg:grid-cols-2"
                  }`}
                >
                  {items.map((a, i) => (
                    <SectionReveal
                      key={a.slug}
                      direction="up"
                      delay={i * 50}
                      durationMs={500}
                    >
                      <div className="group h-full p-6 rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-rest hover:shadow-lift transition-all duration-500 ease-premium hover:-translate-y-1 relative overflow-hidden">
                        <div
                          aria-hidden
                          className={`absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-30 bg-gradient-to-br ${a.accent} blur-2xl transition-opacity duration-500 group-hover:opacity-50`}
                        />
                        <div className="relative">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-[36px] leading-none transition-transform duration-300 group-hover:scale-110 origin-left">
                              {a.emoji}
                            </div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[10.5px] font-extrabold uppercase tracking-wider shrink-0">
                              {a.chip}
                            </span>
                          </div>
                          <div
                            className="mt-5 font-display lowercase tracking-tight text-spark-ink leading-tight"
                            style={{
                              fontSize: isScripts
                                ? "clamp(1.1rem, 1.5vw, 1.25rem)"
                                : "clamp(1.25rem, 2vw, 1.5rem)",
                            }}
                          >
                            {a.name.toLowerCase()}
                          </div>
                          <div className="mt-3 text-[13px] text-spark-ink-70 leading-relaxed">
                            {a.shortDescription}
                          </div>
                        </div>
                      </div>
                    </SectionReveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============== CAP. 03 · ROTINA — destaque com mockup ============== */}
      <section className="relative bg-brand-grad-soft border-y border-spark-brand/15 overflow-hidden">
        <HeroBlob color="rose" variant={1} className="-top-32 -left-40 w-[560px] h-[560px]" />
        <HeroBlob color="peach" variant={2} className="bottom-0 -right-40 w-[520px] h-[520px]" />
        <SparkleField count={16} seed={444} className="opacity-55" />

        <div className="relative max-w-[1200px] mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-20 lg:pb-28">
          <SectionReveal direction="up" durationMs={500}>
            <ChapterMarker n="03" title="a virada" />
          </SectionReveal>

          <div className="mt-8 grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">
            <div>
              <SectionReveal direction="up" delay={100} durationMs={900}>
                <h2
                  className="font-display lowercase tracking-tight text-spark-ink leading-[0.88]"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
                >
                  hábito{" "}
                  <span className="text-grad-brand">&gt;</span> inspiração.
                </h2>
              </SectionReveal>

              <SectionReveal direction="up" delay={300}>
                <p className="mt-7 text-fluid-lead text-spark-ink-70 leading-snug font-semibold">
                  A diferença entre quem posta 1 vídeo por semana e quem posta 5 por dia não é
                  talento — é rotina. O Método TTS te dá um anel de aderência, gráfico de evolução
                  e acervo de referências, tudo dentro do app.
                </p>
              </SectionReveal>

              <SectionReveal direction="up" delay={500}>
                <ul className="mt-8 space-y-4">
                  {[
                    {
                      t: "Aderência semanal",
                      d: "Anel de progresso bate olho e mostra se a semana fluiu.",
                    },
                    {
                      t: "Evolução mensal",
                      d: "Gráfico mostra sua trajetória — sem chute, com dado.",
                    },
                    {
                      t: "Referências curadas",
                      d: "Vídeos virais do nicho pra inspirar sem buscar.",
                    },
                  ].map((it) => (
                    <li key={it.t} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-grad text-white flex items-center justify-center shrink-0 mt-0.5 shadow-lift-brand">
                        <Check size={13} strokeWidth={3} />
                      </div>
                      <div>
                        <div className="text-[14.5px] font-extrabold text-spark-ink leading-tight">
                          {it.t}
                        </div>
                        <div className="text-[13px] text-spark-ink-70 mt-1 leading-relaxed">
                          {it.d}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionReveal>
            </div>

            {/* Anel mockup */}
            <SectionReveal direction="up" delay={350} durationMs={900}>
              <div className="aspect-square max-w-[460px] mx-auto rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-hero p-10 lg:p-14 flex flex-col items-center justify-center relative overflow-hidden">
                <HeroBlob
                  color="rose"
                  variant={1}
                  className="-top-20 -right-20 w-[260px] h-[260px] opacity-50"
                />
                <SparkleField count={8} seed={87} className="opacity-50" />

                <div className="relative">
                  <svg width="220" height="220" viewBox="0 0 220 220" className="rotate-[-90deg]">
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="oklch(0.65 0.22 350)" />
                        <stop offset="100%" stopColor="oklch(0.72 0.18 30)" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="110"
                      cy="110"
                      r="92"
                      stroke="oklch(0.94 0.02 340)"
                      strokeWidth="14"
                      fill="none"
                    />
                    <circle
                      cx="110"
                      cy="110"
                      r="92"
                      stroke="url(#ringGrad)"
                      strokeWidth="14"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 92}
                      strokeDashoffset={2 * Math.PI * 92 * (1 - 0.84)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className="font-display lowercase tracking-tight text-spark-ink leading-none"
                      style={{ fontSize: "clamp(3rem, 6vw, 4.5rem)" }}
                    >
                      84%
                    </div>
                    <div className="text-[11px] font-extrabold text-spark-brand-deep uppercase tracking-wider mt-1.5">
                      aderência
                    </div>
                  </div>
                </div>

                <div className="relative mt-6 text-center">
                  <div className="text-[13px] text-spark-ink-70 font-semibold">
                    Bateu meta em <strong>6 dos 7 dias</strong> dessa semana.
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-good/10 border border-good/20 text-good text-[11px] font-extrabold uppercase tracking-wider">
                    <Activity size={11} strokeWidth={2.5} />
                    streak: 12 dias
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* ============== CAP. 04 · COMO COMEÇA ============== */}
      <section className="relative overflow-hidden">
        <SparkleField count={12} seed={333} className="opacity-30" />
        <div className="relative max-w-[1200px] mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-20 lg:pb-28">
          <SectionReveal direction="up" durationMs={500}>
            <ChapterMarker n="04" title="como começa" />
          </SectionReveal>

          <SectionReveal direction="up" delay={150} durationMs={900}>
            <h2
              className="mt-8 font-display lowercase tracking-tight text-spark-ink leading-[0.88] max-w-[820px]"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              4 passos. <span className="text-grad-brand">do produto à postagem.</span>
            </h2>
          </SectionReveal>

          <SectionReveal direction="up" delay={300}>
            <p className="mt-7 text-fluid-lead text-spark-ink-70 leading-snug max-w-[58ch] font-semibold">
              Você no controle do começo ao fim. A IA é consultora — quem decide é você.
            </p>
          </SectionReveal>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <SectionReveal key={s.n} direction="up" delay={i * 80}>
                <div className="group p-6 lg:p-7 rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-rest hover:shadow-lift transition-all duration-500 ease-premium hover:-translate-y-1 h-full">
                  <div
                    className="font-display lowercase text-grad-brand leading-none tracking-tight transition-transform duration-300 group-hover:scale-105 origin-left"
                    style={{ fontSize: "clamp(3.5rem, 5vw, 4.5rem)" }}
                  >
                    {s.n}
                  </div>
                  <div
                    className="mt-5 font-display lowercase tracking-tight text-spark-ink leading-tight"
                    style={{ fontSize: "clamp(1.125rem, 1.5vw, 1.375rem)" }}
                  >
                    {s.t}
                  </div>
                  <div className="mt-3 text-[13.5px] text-spark-ink-70 leading-relaxed">
                    {s.d}
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>

          <SectionReveal direction="up" delay={400}>
            <div className="mt-14 text-center max-w-[440px] mx-auto">
              <CTAPrimary label="Quero gravar meu primeiro vídeo" />
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ============== STATS GRANDES ============== */}
      <section className="relative overflow-hidden bg-spark-ink text-white border-y border-spark-ink/0">
        <SparkleField
          count={20}
          seed={6789}
          color="rgba(255,255,255,0.5)"
          className="opacity-65"
        />
        <div
          aria-hidden
          className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.24 340 / 0.30), transparent 60%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative max-w-[1200px] mx-auto px-5 lg:px-10 py-20 lg:py-28">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              { num: "+500", label: "criadoras ativas" },
              { num: "+12k", label: "roteiros gerados" },
              { num: "4.9", label: "nota média" },
              { num: "24/7", label: "tira-dúvida" },
            ].map((s, i) => (
              <SectionReveal key={s.label} direction="up" delay={i * 100}>
                <div className="text-center">
                  <div
                    className="font-display lowercase tracking-tight leading-none"
                    style={{ fontSize: "clamp(3.5rem, 6vw, 6rem)" }}
                  >
                    {s.num}
                  </div>
                  <div className="mt-4 text-[11px] uppercase tracking-widest opacity-80 font-extrabold">
                    {s.label}
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============== READER STORIES — featured + grid ============== */}
      <section className="relative overflow-hidden">
        <HeroBlob color="rose" variant={1} className="-top-40 -right-32 w-[480px] h-[480px] opacity-50" />
        <SparkleField count={12} seed={666} className="opacity-35" />

        <div className="relative max-w-[1200px] mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-20 lg:pb-28">
          <SectionReveal direction="up" durationMs={500}>
            <Eyebrow>✦ histórias reais</Eyebrow>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={900}>
            <h2
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.9] max-w-[820px]"
              style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
            >
              criadoras que <span className="text-grad-brand">viraram</span> a chave.
            </h2>
          </SectionReveal>

          {/* Featured testimonial */}
          <SectionReveal direction="up" delay={300} durationMs={900}>
            <div className="mt-14 grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-12 items-center p-8 lg:p-12 rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-hero relative overflow-hidden">
              <HeroBlob
                color="peach"
                variant={2}
                className="-top-20 -left-20 w-[260px] h-[260px] opacity-50"
              />

              <div className="relative">
                <div
                  className="w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-brand-grad text-white flex items-center justify-center font-display shadow-lift-brand mx-auto lg:mx-0"
                  style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}
                >
                  {featuredTestimonial.name[0]}
                </div>
                <div className="mt-5 text-center lg:text-left">
                  <div className="font-display lowercase tracking-tight text-spark-ink leading-tight text-[24px]">
                    {featuredTestimonial.name.toLowerCase()}
                  </div>
                  <div className="text-[12px] text-spark-ink-50 font-extrabold mt-1 uppercase tracking-wider">
                    {featuredTestimonial.role}
                  </div>
                  <div className="mt-3 flex justify-center lg:justify-start">
                    <Stars n={5} />
                  </div>
                </div>
              </div>

              <div className="relative">
                <Quote size={36} strokeWidth={2} className="text-spark-brand opacity-60" />
                <p
                  className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[1.05]"
                  style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.25rem)" }}
                >
                  {featuredTestimonial.quote}
                </p>
              </div>
            </div>
          </SectionReveal>

          {/* Small testimonials */}
          <div className="mt-6 grid sm:grid-cols-3 gap-5">
            {smallTestimonials.map((t, i) => (
              <SectionReveal key={t.name} direction="up" delay={i * 80}>
                <div className="p-6 rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-rest hover:shadow-lift transition-all duration-500 ease-premium hover:-translate-y-0.5 flex flex-col h-full">
                  <Stars n={5} />
                  <div className="mt-4 text-[14px] text-spark-ink leading-relaxed flex-1 font-semibold">
                    &ldquo;{t.quote}&rdquo;
                  </div>
                  <div className="mt-5 pt-4 border-t border-spark-hairline flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-grad text-white flex items-center justify-center font-display text-[16px] shadow-lift-brand">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="text-[13px] font-extrabold text-spark-ink">{t.name}</div>
                      <div className="text-[10.5px] text-spark-ink-50 font-semibold mt-0.5">
                        {t.role}
                      </div>
                    </div>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============== GARANTIA ============== */}
      <section className="relative bg-spark-surface-sunken border-y border-spark-hairline overflow-hidden">
        <SparkleField count={8} seed={111} className="opacity-25" />
        <div className="relative max-w-[900px] mx-auto px-5 lg:px-10 py-20 lg:py-24">
          <SectionReveal direction="up" durationMs={800}>
            <div className="rounded-spark-3xl bg-spark-surface border-2 border-spark-brand/20 p-8 lg:p-12 text-center shadow-hero relative overflow-hidden">
              <HeroBlob
                color="rose"
                variant={1}
                className="-top-32 -right-32 w-[400px] h-[400px] opacity-50"
              />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-grad text-white shadow-lift-brand">
                  <ShieldCheck size={36} strokeWidth={2.4} />
                </div>
                <div className="mt-5 text-eyebrow text-spark-brand">✦ promessa</div>
                <h2
                  className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
                  style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
                >
                  7 dias pra testar. se não rolar,
                  <br />
                  <span className="text-grad-brand">o risco é nosso.</span>
                </h2>
                <p className="mt-5 text-fluid-lead text-spark-ink-70 max-w-[58ch] mx-auto leading-snug font-semibold">
                  Sem pergunta, sem burocracia, sem letra miúda. Você testa o método inteiro e, se
                  achar que não é pra você, pede o dinheiro de volta pela Kiwify.
                </p>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ============== PRICING ============== */}
      <section className="relative overflow-hidden hero-radial">
        <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[500px] h-[500px]" />
        <HeroBlob color="peach" variant={2} className="bottom-0 -right-32 w-[500px] h-[500px]" />
        <SparkleField count={14} seed={4444} className="opacity-50" />

        <div className="relative max-w-[1200px] mx-auto px-5 lg:px-10 py-20 lg:py-28">
          <SectionReveal direction="up" durationMs={500}>
            <div className="text-center">
              <Eyebrow>✦ investimento</Eyebrow>
            </div>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={900}>
            <h2
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.9] text-center max-w-[820px] mx-auto"
              style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
            >
              um plano. <span className="text-grad-brand">tudo incluído.</span>
            </h2>
          </SectionReveal>

          <SectionReveal direction="up" delay={250}>
            <p className="mt-5 text-fluid-lead text-spark-ink-70 leading-snug max-w-[58ch] mx-auto text-center font-semibold">
              Acesso ao método completo. Sem upsell, sem feature bloqueada, sem pegadinha.
            </p>
          </SectionReveal>

          <SectionReveal direction="up" delay={400} durationMs={800}>
            <div className="mt-14 max-w-[600px] mx-auto">
              <div className="rounded-spark-3xl bg-spark-surface border-2 border-spark-brand/30 shadow-hero overflow-hidden">
                {/* Header preço */}
                <div className="p-8 lg:p-10 bg-brand-grad text-white relative overflow-hidden">
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)",
                    }}
                  />
                  <SparkleField
                    count={8}
                    seed={543}
                    color="rgba(255,255,255,0.6)"
                    className="opacity-70"
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-[11.5px] font-extrabold uppercase tracking-widest opacity-95">
                        método tts · acesso completo
                      </div>
                      <SBadge tone="warn">🔥 Promo lançamento</SBadge>
                    </div>
                    <div className="mt-5 text-[14px] line-through opacity-70">De R$ 97,00</div>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-display tracking-tight leading-none"
                        style={{ fontSize: "clamp(3.5rem, 7vw, 5rem)" }}
                      >
                        R$ 49
                      </span>
                      <span className="text-[18px] opacity-90 font-extrabold">,00 /mês</span>
                    </div>
                    <div className="mt-2 text-[13.5px] opacity-95 font-semibold">
                      Menos que um lanche por mês.
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="p-8 lg:p-10">
                  <div className="text-eyebrow text-spark-brand mb-5">✦ tudo incluso</div>
                  <ul className="space-y-3">
                    {features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-[14px] text-spark-ink font-semibold"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm"
                          style={{ background: "oklch(0.62 0.16 150)" }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <CTAPrimary label="Quero o método agora" />
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
                        <Lock size={11} strokeWidth={2.5} />
                        Pagamento seguro pela Kiwify
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
                        <ShieldCheck
                          size={11}
                          strokeWidth={2.5}
                          className="text-good"
                        />
                        7 dias de garantia · devolução 100%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ============== FAQ ============== */}
      <section className="relative bg-spark-surface-sunken border-y border-spark-hairline overflow-hidden">
        <SparkleField count={10} seed={789} className="opacity-30" />
        <div className="relative max-w-[860px] mx-auto px-5 lg:px-10 py-20 lg:py-28">
          <SectionReveal direction="up" durationMs={500}>
            <div className="text-center">
              <Eyebrow>✦ perguntas frequentes</Eyebrow>
            </div>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={900}>
            <h2
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.9] text-center"
              style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
            >
              ainda com dúvida?
              <br />
              <span className="text-grad-brand">aqui tá a resposta.</span>
            </h2>
          </SectionReveal>

          <div className="mt-12 space-y-3.5">
            {faqs.map((f, i) => (
              <SectionReveal key={i} direction="up" delay={i * 40}>
                <details className="group p-5 lg:p-6 rounded-spark-2xl bg-spark-surface border border-spark-hairline open:border-spark-brand/40 open:shadow-lift transition-all duration-300 ease-premium hover:shadow-rest">
                  <summary className="flex items-center justify-between cursor-pointer list-none gap-4">
                    <span className="text-[15.5px] font-extrabold text-spark-ink leading-tight">
                      {f.q}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-spark-surface-sunken text-spark-brand flex items-center justify-center shrink-0 group-open:bg-brand-grad group-open:text-white transition-all duration-300 ease-premium group-open:rotate-180">
                      <span className="font-extrabold text-[18px] leading-none group-open:hidden">
                        +
                      </span>
                      <span className="font-extrabold text-[18px] leading-none hidden group-open:inline">
                        −
                      </span>
                    </div>
                  </summary>
                  <p className="mt-4 text-[14px] text-spark-ink-70 leading-relaxed">{f.a}</p>
                </details>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============== FINAL CALL — minimal, manifesto ============== */}
      <section className="relative max-w-[1240px] mx-auto px-5 lg:px-10 py-20 lg:py-28">
        <SectionReveal direction="up" durationMs={900}>
          <div className="rounded-spark-3xl p-10 lg:p-24 text-white bg-brand-grad-hero shadow-hero text-center relative overflow-hidden">
            <SparkleField
              count={28}
              seed={1234}
              color="rgba(255,255,255,0.6)"
              className="opacity-70"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%)",
              }}
            />

            <div className="relative">
              <div className="flex justify-center">
                <SparkMark size={88} white />
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-[11.5px] font-extrabold uppercase tracking-widest bg-white/15 backdrop-blur px-3.5 py-1.5 rounded-full border border-white/20">
                <Clock size={12} strokeWidth={2.5} />
                primeiro roteiro em 30 segundos
              </div>
              <h2
                className="mt-8 font-display lowercase tracking-tight leading-[0.85] max-w-[900px] mx-auto"
                style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
              >
                vem pro
                <br />
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, oklch(1 0 0), oklch(0.92 0.08 30))",
                  }}
                >
                  método.
                </span>
              </h2>
              <p className="mt-7 text-fluid-lead opacity-95 max-w-[640px] mx-auto leading-snug font-semibold">
                R$ 49/mês · acesso completo · 7 dias de garantia · cancela quando quiser
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center max-w-[560px] mx-auto">
                <a
                  href={KIWIFY_CHECKOUT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="block flex-1"
                >
                  <button className="group w-full h-[60px] rounded-full bg-spark-surface text-spark-brand-deep text-[15px] font-extrabold inline-flex items-center justify-center gap-2 hover:bg-spark-surface/90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-premium shadow-hero">
                    Quero entrar agora
                    <ArrowRight
                      size={20}
                      strokeWidth={2.5}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </button>
                </a>
                <Link href="/login" className="block flex-1">
                  <button className="w-full h-[60px] rounded-full bg-white/15 backdrop-blur text-white text-[15px] font-extrabold border border-white/25 hover:bg-white/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-premium">
                    Já tenho acesso
                  </button>
                </Link>
              </div>

              <div className="mt-7 flex items-center justify-center gap-2 text-[12px] opacity-90 font-extrabold uppercase tracking-wider">
                <ShieldCheck size={13} strokeWidth={2.5} />
                Pagamento seguro via Kiwify · sem fidelidade
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="bg-spark-surface border-t border-spark-hairline">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 py-12 lg:py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <SparkWordmark size={28} />
              <p className="mt-4 text-[13px] text-spark-ink-70 leading-relaxed max-w-[260px] font-semibold">
                Sistema completo pra criadoras de TikTok Shop. Feito por mulher, em português, com
                método.
              </p>
            </div>

            <div>
              <div className="text-eyebrow text-spark-brand mb-3">✦ produto</div>
              <ul className="space-y-2.5 text-[13px] font-semibold">
                <li>
                  <a
                    href={KIWIFY_CHECKOUT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-spark-ink-70 hover:text-spark-brand-deep transition-colors duration-300"
                  >
                    Comprar
                  </a>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-spark-ink-70 hover:text-spark-brand-deep transition-colors duration-300"
                  >
                    Entrar
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-spark-ink-70 hover:text-spark-brand-deep transition-colors duration-300"
                  >
                    Funcionalidades
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-eyebrow text-spark-brand mb-3">✦ suporte</div>
              <ul className="space-y-2.5 text-[13px] font-semibold">
                <li>
                  <a
                    href="mailto:contato@metodotts.app"
                    className="text-spark-ink-70 hover:text-spark-brand-deep transition-colors duration-300"
                  >
                    contato@metodotts.app
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-spark-ink-70 hover:text-spark-brand-deep transition-colors duration-300"
                  >
                    Central de ajuda
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-eyebrow text-spark-brand mb-3">✦ legal</div>
              <ul className="space-y-2.5 text-[13px] font-semibold">
                <li>
                  <a
                    href="#"
                    className="text-spark-ink-70 hover:text-spark-brand-deep transition-colors duration-300"
                  >
                    Termos de uso
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-spark-ink-70 hover:text-spark-brand-deep transition-colors duration-300"
                  >
                    Política de privacidade
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-spark-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
            <div>© {new Date().getFullYear()} Método TTS · Todos os direitos reservados</div>
            <div className="flex items-center gap-1.5">
              <Lock size={11} strokeWidth={2.5} />
              Pagamento seguro Kiwify
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
