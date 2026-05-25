import Link from "next/link";
import {
  ArrowRight,
  Check,
  Camera,
  Smartphone,
  Zap,
  Sparkle,
  Heart,
  ShieldCheck,
  Clock,
  PlayCircle,
  GraduationCap,
  MessageCircle,
  Pen,
  Search,
  Lock,
  Infinity as InfinityIcon,
  Star,
} from "lucide-react";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { AgentTile } from "@/components/atoms/agent-tile";
import { type AgentId } from "@/lib/agents";

const KIWIFY_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL ?? "https://pay.kiwify.com.br/YOR83Pu";

// =================================================================
// Dados (copy)
// =================================================================

const agents: { id: AgentId; t: string; d: string }[] = [
  {
    id: "info",
    t: "Análise de produto",
    d: "Sobe a foto e a IA extrai público, dor, gatilhos, objeções, hooks e tudo que você precisa pra vender.",
  },
  {
    id: "script",
    t: "Roteiros prontos",
    d: "5 roteiros completos (gancho 3s + desenvolvimento + benefício + CTA) com fórmula validada que converte.",
  },
  {
    id: "help",
    t: "Suporte 24/7",
    d: "Pergunta qualquer coisa sobre TikTok Shop: regras, frete, conta de criador, comissão, políticas.",
  },
];

const dores = [
  "Travo na hora de gravar o vídeo e não sei o que falar",
  "Boto o produto à venda mas não sei como vender ele",
  "Vejo gente vendendo no TikTok Shop mas não sei começar",
  "Já testei IA mas ela escreve igual robô americano",
  "Quero gravar mais mas falta criatividade pra hook",
  "Tenho medo de cair de shadowban ou quebrar regra",
];

const beneficios = [
  {
    Icon: Sparkle,
    t: "Roteiros 100% prontos pra gravar",
    d: "Não é só hook — é o vídeo INTEIRO. Gancho, desenvolvimento, benefício real e CTA leve.",
  },
  {
    Icon: Camera,
    t: "Análise completa do seu produto",
    d: "Sobe a foto. Em segundos: público, dor, preço, concorrentes, gatilhos emocionais, objeções a quebrar.",
  },
  {
    Icon: GraduationCap,
    t: "Aulas e lives ao vivo inclusas",
    d: "Não é só ferramenta. Você tem o método em vídeo, com trilha completa pra dominar do zero ao avançado.",
  },
  {
    Icon: Heart,
    t: "Conversa em português, com tom de amiga",
    d: "Esquece IA fria de gringo. Aqui é PT-BR, doce, com humor brasileiro e gírias certas.",
  },
  {
    Icon: ShieldCheck,
    t: "Dentro das regras do TikTok Shop",
    d: "Cada roteiro respeita as diretrizes pra você não levar bloqueio nem shadowban.",
  },
  {
    Icon: Smartphone,
    t: "Funciona 100% no celular",
    d: "Instala como app no seu iPhone ou Android. Usa de qualquer lugar, mesmo offline em algumas telas.",
  },
];

const steps = [
  {
    n: "01",
    t: "Sobe a foto do produto",
    d: "Pode ser print da Shopee, foto sua, ou link do produto no TikTok Shop.",
  },
  {
    n: "02",
    t: "A IA mapeia tudo",
    d: "Categoria, público-alvo, dor, faixa de preço, concorrentes, gatilhos emocionais, objeções a quebrar — em segundos.",
  },
  {
    n: "03",
    t: "Pede roteiros",
    d: "5 roteiros com estilos diferentes (fofoca, polêmico, educativo, storytelling, transformação) prontos pra gravar.",
  },
  {
    n: "04",
    t: "Grava e posta",
    d: "Você só lê o roteiro na câmera. Os hooks foram pensados pra prender atenção nos primeiros 3 segundos.",
  },
];

const features = [
  "Análise de produto ILIMITADA com foto",
  "Roteiros completos com fórmula validada",
  "5 estilos por produto (fofoca, polêmico, educativo, storytelling, transformação)",
  "Templates por nicho: skincare, suplementos, makeup, cabelo, perfumaria, casa, moda, maternidade, pet e mais",
  "Aulas em vídeo inclusas",
  "Lives ao vivo periodicamente",
  "Suporte tira-dúvidas 24/7 via chat IA",
  "Notícias e atualizações do TikTok Shop",
  "Catálogo de produtos salvos pra usar quando quiser",
  "Roteiros salvos pra copiar quando precisar",
  "Funciona no celular como app (PWA)",
  "Atualizações constantes — entra novo nicho/template",
];

const testimonials = [
  {
    name: "Marcela R.",
    role: "Vende skincare há 8 meses",
    quote:
      "Antes eu gravava um vídeo por semana porque travava no roteiro. Agora gravo 4-5 por dia, e a venda triplicou.",
    rating: 5,
  },
  {
    name: "Camila S.",
    role: "Começou faz 3 meses",
    quote:
      "Nunca tinha vendido nada online. As aulas me ensinaram tudo e a IA me deu os roteiros. Em 30 dias bati R$ 2k.",
    rating: 5,
  },
  {
    name: "Bia M.",
    role: "Faz R$ 8k/mês no TikTok Shop",
    quote:
      "Os roteiros são REALMENTE bons. Tem gancho que prende, desenvolvimento natural e CTA que não fica forçado.",
    rating: 5,
  },
  {
    name: "Aline F.",
    role: "Mãe e empreendedora",
    quote:
      "Eu testei 3 IAs antes e todas escreviam igual robô. Aqui é a primeira vez que parece eu falando.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "Preciso entender de IA pra usar?",
    a: "Nada. Você conversa com a IA como conversa com uma amiga — em português, sem termo técnico. Ela faz todo o trabalho.",
  },
  {
    q: "Quanto tempo leva pra ter resultado?",
    a: "O primeiro roteiro sai em 30 segundos. Pra resultado em venda, depende do seu funil — mas alunas costumam ver diferença na primeira semana de postagem.",
  },
  {
    q: "Funciona pra qualquer nicho?",
    a: "Sim. Temos templates específicos pra skincare, suplementos, makeup, cabelo, perfumaria, casa, moda, maternidade, eletrônicos, acessórios, pet, calçados e mais. Pode digitar seu nicho próprio também.",
  },
  {
    q: "É só pra quem já vende?",
    a: "Não. A maior parte das alunas tá começando. A análise de produto ensina TUDO que você precisa saber antes de gravar o primeiro vídeo.",
  },
  {
    q: "Posso usar no celular?",
    a: "Sim. O app funciona 100% no celular — você instala como aplicativo no iPhone/Android e usa de qualquer lugar.",
  },
  {
    q: "Tem limite de roteiros ou análises?",
    a: "Não. Ilimitado em tudo. Você usa quantas vezes precisar.",
  },
  {
    q: "Como funciona a garantia?",
    a: "Você tem 7 dias pra testar. Se não gostar, pede reembolso direto pela Kiwify e recebe 100% do dinheiro de volta. Sem perguntas.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Cancelamento em 2 cliques pelo painel da Kiwify. Sem multa, sem fidelidade.",
  },
];

// =================================================================
// Componentes auxiliares
// =================================================================

function CTAPrimary({ label = "Quero começar agora", size = "lg" as "lg" | "md" }) {
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[11.5px] font-bold text-spark-brand uppercase tracking-[0.1em] bg-brand-grad-soft px-3 py-1.5 rounded-full">
      {children}
    </div>
  );
}

function SectionHeading({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-[680px] mx-auto">
      <SectionLabel>{label}</SectionLabel>
      <h2 className="mt-3 text-[30px] sm:text-[36px] lg:text-[44px] font-extrabold tracking-tight leading-[1.05]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-[15px] lg:text-[17px] text-spark-ink-70 leading-[1.55]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// =================================================================
// Página
// =================================================================

export default function LandingPage() {
  return (
    <div className="min-h-dvh w-full bg-spark-bg">
      {/* ============== HEADER ============== */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-spark-hairline">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 py-3 flex items-center gap-3">
          <SparkWordmark size={34} />
          <div className="flex-1" />
          <Link
            href="/login"
            className="hidden sm:inline-block text-[13px] font-semibold text-spark-ink-70 hover:text-spark-ink transition-colors px-3"
          >
            Já tenho acesso
          </Link>
          <a href={KIWIFY_CHECKOUT_URL} target="_blank" rel="noreferrer">
            <SButton variant="primary" size="sm" IconRight={ArrowRight}>
              Quero entrar
            </SButton>
          </a>
        </div>
      </header>

      {/* ============== HERO ============== */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-brand-grad-hero opacity-[0.10]"
        />
        <div
          aria-hidden
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
          style={{ background: "oklch(0.65 0.20 350)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: "oklch(0.62 0.22 20)" }}
        />

        <div className="relative max-w-[1200px] mx-auto px-5 lg:px-10 pt-14 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-bold text-spark-brand bg-white border border-spark-brand/20 px-3 py-1.5 rounded-full shadow-sm">
              ✨ Pra criadoras de TikTok Shop
            </div>
            <h1 className="mt-5 text-[40px] sm:text-[52px] lg:text-[64px] font-extrabold tracking-tight leading-[1.02] text-spark-ink">
              Pare de travar.
              <br />
              <span className="text-spark-brand">Comece a vender</span> no TikTok Shop hoje. 💕
            </h1>
            <p className="mt-5 text-[16px] lg:text-[18px] text-spark-ink-70 leading-[1.55] max-w-[560px]">
              Sua IA pessoal que analisa o produto, escreve <strong>5 roteiros completos</strong> com
              uma fórmula validada e te explica o que postar — sem complicação, sem inglês, sem robô.
            </p>

            {/* Lista rápida */}
            <ul className="mt-6 space-y-2.5">
              {[
                "5 roteiros prontos pra gravar em segundos",
                "Análise completa do seu produto com foto",
                "Aulas e lives ao vivo inclusas",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[14.5px] text-spark-ink">
                  <div className="w-5 h-5 rounded-full bg-good text-white flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={2.5} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 max-w-[420px]">
              <CTAPrimary label="Começar agora · R$ 49,00/mês" />
              <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-spark-ink-50">
                <ShieldCheck size={14} strokeWidth={2} className="text-good" />
                7 dias de garantia · cancela quando quiser
              </div>
            </div>

            {/* Mini prova social */}
            <div className="mt-7 flex items-center gap-4">
              <div className="flex -space-x-2">
                {["M", "C", "B", "A"].map((l, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-white bg-brand-grad text-white flex items-center justify-center font-bold text-[13px]"
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <Stars n={5} />
                <div className="text-[11.5px] text-spark-ink-50 font-semibold">
                  +500 criadoras usando · nota 4.9
                </div>
              </div>
            </div>
          </div>

          {/* Mockup do produto (mobile preview) */}
          <div className="relative mx-auto lg:mx-0">
            <div className="w-[280px] sm:w-[320px] rounded-[40px] border-[8px] border-spark-ink shadow-[0_50px_100px_-30px_rgba(20,20,40,0.45)] overflow-hidden bg-white relative">
              <div className="aspect-[9/19.5] bg-spark-bg flex flex-col">
                <div className="pt-12 px-5">
                  <div className="flex justify-center mb-4">
                    <SparkWordmark size={32} />
                  </div>
                  <div className="text-[11px] text-spark-brand font-bold uppercase tracking-[0.06em]">
                    Boa tarde, Maria 💕
                  </div>
                  <div className="mt-1 text-[22px] font-extrabold tracking-tight leading-[1.05]">
                    Pronta pra criar algo lindo hoje? ✨
                  </div>

                  {/* KPIs card */}
                  <div className="mt-4 rounded-2xl bg-white border border-spark-hairline overflow-hidden shadow-sm">
                    <div className="grid grid-cols-3 divide-x divide-spark-hairline">
                      {[
                        { e: "📦", v: "12", l: "Produtos", tone: true },
                        { e: "✍️", v: "47", l: "Roteiros" },
                        { e: "🎓", v: "8/15", l: "Aulas" },
                      ].map((k, i) => (
                        <div
                          key={i}
                          className={`p-2.5 text-center ${k.tone ? "bg-brand-grad-soft/60" : ""}`}
                        >
                          <div className="text-[16px]">{k.e}</div>
                          <div
                            className={`mt-1 font-extrabold font-mono text-[15px] ${k.tone ? "text-spark-brand-deep" : ""}`}
                          >
                            {k.v}
                          </div>
                          <div className="text-[8px] text-spark-ink-50 font-semibold uppercase tracking-wide">
                            {k.l}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-[18px] text-white bg-brand-grad-hero">
                    <div className="text-[9px] font-bold uppercase tracking-[0.08em] opacity-85 flex items-center gap-1">
                      <Sparkle size={10} strokeWidth={1.7} /> Nova conversa
                    </div>
                    <div className="mt-1.5 text-[13px] font-bold leading-[1.2]">
                      &ldquo;Sobe a foto do produto, eu cuido do resto.&rdquo;
                    </div>
                  </div>
                </div>

                <div className="flex-1" />
                <div className="px-3 pb-4 mt-3">
                  <div className="h-9 rounded-full bg-spark-surface-sunken border border-spark-hairline" />
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-2 -right-4 sm:right-0 hidden sm:flex flex-col gap-2">
              {agents.slice(0, 3).map((a, i) => (
                <div
                  key={a.id}
                  className="bg-white rounded-full shadow-[0_8px_24px_-12px_rgba(20,20,40,0.35)] border border-spark-hairline pl-1.5 pr-3 py-1.5 flex items-center gap-2"
                  style={{ transform: `translateX(${i * 14}px)` }}
                >
                  <AgentTile agent={a.id} size={22} />
                  <span className="text-[11px] font-bold">{a.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== DOR ============== */}
      <section className="bg-spark-surface-sunken border-y border-spark-hairline">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-10 py-16 lg:py-20">
          <SectionHeading
            label="O problema"
            title={
              <>
                Se você se identifica com isso,
                <br className="hidden sm:block" />
                a gente foi feita pra você. 💕
              </>
            }
          />

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dores.map((d) => (
              <div
                key={d}
                className="p-4 rounded-2xl bg-white border border-spark-hairline flex items-start gap-3"
              >
                <div className="text-[20px] leading-none mt-0.5">😩</div>
                <div className="text-[14px] text-spark-ink leading-[1.4]">{d}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-[16px] lg:text-[18px] font-bold text-spark-ink max-w-[640px] mx-auto">
              Não é falta de esforço seu. É falta de método e de uma IA que entenda você. ✨
            </p>
          </div>
        </div>
      </section>

      {/* ============== SOLUÇÃO / AGENTES ============== */}
      <section className="max-w-[1200px] mx-auto px-5 lg:px-10 py-16 lg:py-24">
        <SectionHeading
          label="A solução"
          title={
            <>
              3 especialistas em IA <br className="hidden sm:block" />
              treinadas pra te fazer vender.
            </>
          }
          subtitle="Cada uma resolve uma parte do seu funil. Você conversa por chat e elas entregam o trabalho pronto."
        />

        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {agents.map((a) => (
            <div
              key={a.id}
              className="p-6 lg:p-7 rounded-3xl bg-spark-surface border border-spark-hairline shadow-[0_8px_24px_-16px_rgba(20,20,40,0.12)] hover:shadow-[0_18px_40px_-22px_rgba(20,20,40,0.25)] transition-shadow"
            >
              <AgentTile agent={a.id} size={64} />
              <div className="mt-4 text-[19px] font-extrabold tracking-tight">{a.t}</div>
              <div className="mt-2 text-[14px] text-spark-ink-70 leading-[1.5]">{a.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============== COMO FUNCIONA ============== */}
      <section className="bg-spark-surface-sunken border-y border-spark-hairline">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 py-16 lg:py-24">
          <SectionHeading
            label="Como funciona"
            title={
              <>
                Do produto ao roteiro
                <br className="hidden sm:block" />
                em <span className="text-spark-brand">4 passos simples</span>.
              </>
            }
          />

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s) => (
              <div
                key={s.n}
                className="p-5 lg:p-6 rounded-3xl bg-white border border-spark-hairline relative"
              >
                <div className="absolute -top-3 -right-3 w-12 h-12 rounded-2xl bg-brand-grad text-white flex items-center justify-center font-extrabold font-mono text-[16px] shadow-[0_6px_20px_-8px_oklch(0.55_0.24_340/0.5)]">
                  {s.n}
                </div>
                <div className="mt-2 text-[16px] font-extrabold tracking-tight">{s.t}</div>
                <div className="mt-2 text-[13.5px] text-spark-ink-70 leading-[1.5]">{s.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center max-w-[420px] mx-auto">
            <CTAPrimary label="Quero gravar o primeiro vídeo hoje" />
          </div>
        </div>
      </section>

      {/* ============== BENEFÍCIOS / O QUE VOCÊ TEM ============== */}
      <section className="max-w-[1200px] mx-auto px-5 lg:px-10 py-16 lg:py-24">
        <SectionHeading
          label="O que você vai ter"
          title={
            <>
              Tudo o que você precisa pra <br className="hidden sm:block" />
              vender no TikTok Shop — junto. 💖
            </>
          }
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {beneficios.map((b) => (
            <div
              key={b.t}
              className="p-6 rounded-3xl bg-spark-surface border border-spark-hairline"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-grad-soft text-spark-brand-deep flex items-center justify-center">
                <b.Icon size={22} strokeWidth={1.8} />
              </div>
              <div className="mt-4 text-[16px] font-extrabold leading-[1.25] tracking-tight">
                {b.t}
              </div>
              <div className="mt-2 text-[14px] text-spark-ink-70 leading-[1.5]">{b.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============== AUTORIDADE / MÉTODO ============== */}
      <section className="bg-brand-grad-soft border-y border-spark-brand/15">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-10 py-16 lg:py-24">
          <SectionHeading
            label="O método"
            title={
              <>
                Não é só uma IA qualquer. <br className="hidden sm:block" />
                É um <span className="text-spark-brand">método validado</span> embutido numa IA.
              </>
            }
            subtitle="Cada roteiro segue uma fórmula testada com criadoras reais que já geraram milhões em vendas no TikTok Shop brasileiro."
          />

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                Icon: Sparkle,
                t: "Fórmula validada de roteiro",
                d: "Gancho 3s + desenvolvimento + benefício real + CTA leve. Estrutura que prende e converte.",
              },
              {
                Icon: GraduationCap,
                t: "Templates por nicho",
                d: "12 nichos com estilo próprio: skincare, suplementos, makeup, cabelo, perfumaria, casa, moda, maternidade, pet e mais.",
              },
              {
                Icon: PlayCircle,
                t: "Aulas em vídeo inclusas",
                d: "Trilha de educação completa pra você entender o método antes de gravar.",
              },
              {
                Icon: MessageCircle,
                t: "Lives ao vivo com Q&A",
                d: "Encontros periódicos pra tirar dúvidas e ver novidades do TikTok Shop em tempo real.",
              },
              {
                Icon: ShieldCheck,
                t: "Dentro das diretrizes",
                d: "Roteiros respeitam as regras do TikTok Shop pra evitar bloqueio ou shadowban.",
              },
              {
                Icon: Pen,
                t: "5 estilos por roteiro",
                d: "Fofoca, polêmico, educativo, storytelling, transformação — pra você testar o que combina com a sua voz.",
              },
            ].map((item) => (
              <div
                key={item.t}
                className="p-6 rounded-3xl bg-white border border-spark-hairline shadow-[0_4px_16px_-10px_rgba(20,20,40,0.1)]"
              >
                <div className="w-11 h-11 rounded-2xl bg-brand-grad text-white flex items-center justify-center">
                  <item.Icon size={20} strokeWidth={2} />
                </div>
                <div className="mt-4 text-[15.5px] font-extrabold tracking-tight leading-[1.25]">
                  {item.t}
                </div>
                <div className="mt-2 text-[13.5px] text-spark-ink-70 leading-[1.5]">{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== DEPOIMENTOS ============== */}
      <section className="max-w-[1200px] mx-auto px-5 lg:px-10 py-16 lg:py-24">
        <SectionHeading
          label="Resultados reais"
          title={
            <>
              Criadoras que pararam de travar
              <br className="hidden sm:block" />
              e começaram a faturar. 💸
            </>
          }
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-5 rounded-3xl bg-spark-surface border border-spark-hairline flex flex-col"
            >
              <Stars n={t.rating} />
              <div className="mt-3 text-[13.5px] text-spark-ink leading-[1.55] flex-1">
                &ldquo;{t.quote}&rdquo;
              </div>
              <div className="mt-4 pt-3 border-t border-spark-hairline flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-brand-grad text-white flex items-center justify-center font-extrabold text-[13px]">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-spark-ink">{t.name}</div>
                  <div className="text-[10.5px] text-spark-ink-50">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============== GARANTIA ============== */}
      <section className="bg-spark-surface-sunken border-y border-spark-hairline">
        <div className="max-w-[900px] mx-auto px-5 lg:px-10 py-16 lg:py-20">
          <div className="rounded-[28px] bg-white border-2 border-spark-brand/20 p-7 lg:p-10 text-center shadow-[0_30px_60px_-30px_rgba(20,20,40,0.15)]">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-grad text-white shadow-[0_18px_40px_-16px_oklch(0.55_0.24_340/0.55)]">
              <ShieldCheck size={36} strokeWidth={2} />
            </div>
            <div className="mt-5 text-[12px] font-bold text-spark-brand uppercase tracking-[0.1em]">
              Garantia incondicional
            </div>
            <h2 className="mt-2 text-[28px] lg:text-[36px] font-extrabold tracking-tight leading-[1.1]">
              7 dias pra testar. Se não gostar, <br className="hidden sm:block" />
              <span className="text-spark-brand">devolvemos 100% do dinheiro.</span>
            </h2>
            <p className="mt-4 text-[15px] text-spark-ink-70 max-w-[560px] mx-auto leading-[1.55]">
              Sem perguntas, sem burocracia. Você testa a fundo por 7 dias e, se achar que não é pra
              você, pede reembolso direto pelo painel da Kiwify. O risco é nosso.
            </p>
          </div>
        </div>
      </section>

      {/* ============== PRICING ============== */}
      <section className="max-w-[1200px] mx-auto px-5 lg:px-10 py-16 lg:py-24">
        <SectionHeading
          label="Investimento"
          title={
            <>
              Um plano. Tudo incluído.
              <br className="hidden sm:block" />
              <span className="text-spark-brand">Sem limite, sem pegadinha.</span>
            </>
          }
        />

        <div className="mt-12 max-w-[560px] mx-auto">
          <div className="rounded-[32px] bg-white border-2 border-spark-brand/30 shadow-[0_40px_80px_-30px_rgba(20,20,40,0.25)] overflow-hidden">
            {/* Header do card */}
            <div className="p-7 lg:p-8 bg-brand-grad text-white relative overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)",
                }}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-bold uppercase tracking-[0.1em] opacity-90">
                    Plano Pro · Método TTS
                  </div>
                  <SBadge tone="warn">🔥 Promo lançamento</SBadge>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-[14px] line-through opacity-60">De R$ 97,00</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[52px] lg:text-[60px] font-extrabold font-mono tracking-tight leading-none">
                    R$ 49,00
                  </span>
                  <span className="text-[15px] opacity-85">/mês</span>
                </div>
                <div className="mt-1 text-[13px] opacity-90">
                  Menos que R$ 1,70 por dia.
                </div>
              </div>
            </div>

            {/* Lista de features */}
            <div className="p-7 lg:p-8">
              <div className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-[0.08em] mb-4 flex items-center gap-2">
                <InfinityIcon size={14} strokeWidth={2.2} className="text-spark-brand" />
                Tudo ilimitado:
              </div>
              <ul className="space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-spark-ink">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
                      style={{ background: "oklch(0.62 0.16 150)" }}
                    >
                      <Check size={12} strokeWidth={2.5} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <CTAPrimary label="Quero começar agora" />
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-spark-ink-50">
                  <Lock size={11} strokeWidth={2} />
                  Pagamento seguro processado pela Kiwify
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px] text-spark-ink-50">
                  <ShieldCheck size={11} strokeWidth={2} className="text-good" />
                  7 dias de garantia — devolução 100%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FAQ ============== */}
      <section className="bg-spark-surface-sunken border-y border-spark-hairline">
        <div className="max-w-[820px] mx-auto px-5 lg:px-10 py-16 lg:py-24">
          <SectionHeading
            label="Perguntas frequentes"
            title="Ainda com dúvida? Aqui tá a resposta. 💕"
          />

          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group p-5 rounded-2xl bg-white border border-spark-hairline open:border-spark-brand/40 transition-colors"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none gap-3">
                  <span className="text-[15px] font-extrabold tracking-tight text-spark-ink">
                    {f.q}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-spark-surface-sunken text-spark-brand flex items-center justify-center shrink-0 group-open:bg-spark-brand group-open:text-white transition-colors">
                    <span className="font-bold text-[18px] leading-none group-open:hidden">+</span>
                    <span className="font-bold text-[18px] leading-none hidden group-open:inline">−</span>
                  </div>
                </summary>
                <p className="mt-3 text-[14px] text-spark-ink-70 leading-[1.6]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CTA FINAL ============== */}
      <section className="max-w-[1200px] mx-auto px-5 lg:px-10 py-16 lg:py-24">
        <div className="rounded-[32px] p-8 lg:p-16 text-white bg-brand-grad-hero shadow-[0_50px_100px_-40px_oklch(0.5_0.22_305/0.65)] text-center relative overflow-hidden">
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
            <div className="mt-5 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] bg-white/20 backdrop-blur px-3 py-1.5 rounded-full">
              <Clock size={12} strokeWidth={2.2} />
              Comece agora · primeiro roteiro em 30s
            </div>
            <h2 className="mt-5 text-[32px] lg:text-[52px] font-extrabold tracking-tight leading-[1.05] max-w-[760px] mx-auto">
              Bora trocar o <span className="opacity-75">&ldquo;eu não sei o que postar&rdquo;</span> por <br className="hidden sm:block" />
              <span className="underline decoration-wavy decoration-white/40 underline-offset-[6px]">
                &ldquo;já tem 5 roteiros prontos&rdquo;
              </span>
              ?
            </h2>
            <p className="mt-5 text-[15px] lg:text-[18px] opacity-90 max-w-[600px] mx-auto leading-[1.5]">
              R$ 49,00/mês · acesso a tudo · 7 dias de garantia · cancela quando quiser
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center max-w-[520px] mx-auto">
              <a href={KIWIFY_CHECKOUT_URL} target="_blank" rel="noreferrer" className="block flex-1">
                <button className="w-full h-[58px] rounded-full bg-white text-spark-brand-deep text-[16px] font-extrabold inline-flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all shadow-[0_18px_40px_-16px_rgba(0,0,0,0.3)]">
                  Quero começar agora <ArrowRight size={20} strokeWidth={2.2} />
                </button>
              </a>
              <Link href="/login" className="block flex-1">
                <button className="w-full h-[58px] rounded-full bg-white/15 backdrop-blur text-white text-[16px] font-bold border border-white/30 hover:bg-white/25 active:scale-95 transition-all">
                  Já tenho acesso
                </button>
              </Link>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[12.5px] opacity-90">
              <ShieldCheck size={14} strokeWidth={2} />
              Pagamento seguro via Kiwify · sem fidelidade
            </div>
          </div>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="bg-white border-t border-spark-hairline">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 py-10 lg:py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <SparkWordmark size={28} />
              <p className="mt-3 text-[13px] text-spark-ink-50 leading-[1.5] max-w-[260px]">
                Sua IA pessoal pra criar conteúdo que vende no TikTok Shop. Feito por mulher pra
                mulher. 💕
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold text-spark-ink uppercase tracking-[0.08em] mb-3">
                Produto
              </div>
              <ul className="space-y-2 text-[13px]">
                <li>
                  <a href={KIWIFY_CHECKOUT_URL} target="_blank" rel="noreferrer" className="text-spark-ink-70 hover:text-spark-brand transition-colors">
                    Comprar
                  </a>
                </li>
                <li>
                  <Link href="/login" className="text-spark-ink-70 hover:text-spark-brand transition-colors">
                    Entrar
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-spark-ink-70 hover:text-spark-brand transition-colors">
                    Funcionalidades
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-[11px] font-bold text-spark-ink uppercase tracking-[0.08em] mb-3">
                Suporte
              </div>
              <ul className="space-y-2 text-[13px]">
                <li>
                  <a href="mailto:contato@metodotts.app" className="text-spark-ink-70 hover:text-spark-brand transition-colors">
                    contato@metodotts.app
                  </a>
                </li>
                <li>
                  <a href="#" className="text-spark-ink-70 hover:text-spark-brand transition-colors">
                    Central de ajuda
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-[11px] font-bold text-spark-ink uppercase tracking-[0.08em] mb-3">
                Legal
              </div>
              <ul className="space-y-2 text-[13px]">
                <li>
                  <a href="#" className="text-spark-ink-70 hover:text-spark-brand transition-colors">
                    Termos de uso
                  </a>
                </li>
                <li>
                  <a href="#" className="text-spark-ink-70 hover:text-spark-brand transition-colors">
                    Política de privacidade
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-spark-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px] text-spark-ink-50">
            <div>© {new Date().getFullYear()} Método TTS · Todos os direitos reservados.</div>
            <div className="flex items-center gap-1.5">
              <Lock size={11} strokeWidth={2} />
              Pagamento seguro processado pela Kiwify
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
