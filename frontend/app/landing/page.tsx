import Link from "next/link";
import {
  ArrowRight,
  Search,
  Flame,
  Pen,
  MessageCircle,
  Sparkle,
  Check,
  Camera,
  Smartphone,
  Zap,
  TrendingUp,
} from "lucide-react";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { AgentTile } from "@/components/atoms/agent-tile";
import { type AgentId } from "@/lib/agents";

const KIWIFY_CHECKOUT_URL = "https://kiwify.com.br";

const agents: { id: AgentId; t: string; d: string }[] = [
  {
    id: "info",
    t: "Análise de produto",
    d: "Sobe a foto e ele extrai público-alvo, dor, faixa de preço e concorrentes em segundos.",
  },
  {
    id: "viral",
    t: "Virais da semana",
    d: "Mostra o que tá bombando no TikTok Shop BR e USA, com receita estimada de cada vídeo.",
  },
  {
    id: "script",
    t: "Scripts com hook",
    d: "Gera 10 hooks por produto usando neurociência, gatilhos cerebrais e humor brasileiro.",
  },
  {
    id: "help",
    t: "Tira-dúvidas",
    d: "Pergunta qualquer coisa sobre TikTok Shop: regras, frete, conta de criador, comissão.",
  },
];

const benefits = [
  { Icon: Camera, t: "Sobe a foto, recebe a ficha pronta", d: "Em vez de planilha, IA estrutura tudo." },
  { Icon: TrendingUp, t: "Descobre virais antes da concorrência", d: "Não chuta — usa dado de quem já vendeu." },
  { Icon: Zap, t: "10 hooks em 30 segundos", d: "Cada um com gatilho cerebral identificado." },
  { Icon: Smartphone, t: "Funciona no celular", d: "PWA — instala e usa como app nativo." },
];

const steps = [
  { n: 1, t: "Você sobe a foto do produto", d: "Pode ser print da Shopee, TikTok Shop ou foto sua." },
  { n: 2, t: "A IA mapeia tudo", d: "Público, dor, preço, concorrentes — em segundos." },
  { n: 3, t: "Busca virais brasileiros", d: "Top vídeos que estão vendendo agora, com gancho extraído." },
  { n: 4, t: "Gera 10 hooks prontos", d: "Copia, cola no TikTok, posta. Tabela completa com motivo." },
];

const testimonials = [
  {
    name: "Marcela",
    role: "Vendendo skincare há 6 meses",
    quote: "Antes eu travava no roteiro. Agora a IA me dá 10 hooks e eu escolho o que mais combina comigo.",
  },
  {
    name: "Camila",
    role: "Começando agora",
    quote: "Não sabia nem por onde começar. A análise de produto explicou tudo que eu precisava saber pra vender.",
  },
  {
    name: "Bia",
    role: "Vende 2k/mês no TikTok Shop",
    quote: "Os virais salvaram minha semana. Vi o que tava bombando e adaptei pra três produtos meus.",
  },
];

function CTAButtonRow({ size = "lg" as "lg" | "md" }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <a href={KIWIFY_CHECKOUT_URL} target="_blank" rel="noreferrer" className="block">
        <SButton variant="primary" size={size} full IconRight={ArrowRight}>
          Quero começar agora · R$ 49,90/mês
        </SButton>
      </a>
      <Link href="/login" className="block">
        <SButton variant="ghost" size={size} full>
          Já tenho acesso
        </SButton>
      </Link>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh w-full bg-spark-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-spark-bg/90 backdrop-blur-md border-b border-spark-hairline">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 py-3.5 flex items-center gap-3">
          <SparkWordmark size={20} />
          <SBadge tone="brand">Beta</SBadge>
          <div className="flex-1" />
          <Link
            href="/login"
            className="hidden sm:inline-block text-[13px] font-semibold text-spark-ink-70 hover:text-spark-ink transition-colors"
          >
            Entrar
          </Link>
          <a href={KIWIFY_CHECKOUT_URL} target="_blank" rel="noreferrer">
            <SButton variant="primary" size="sm" IconRight={ArrowRight}>
              Comprar
            </SButton>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-brand-grad-hero opacity-[0.08]"
        />
        <div className="relative max-w-[1200px] mx-auto px-5 lg:px-10 pt-12 pb-16 lg:pt-20 lg:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[12px] font-bold text-spark-brand bg-brand-grad-soft px-3 py-1.5 rounded-full">
              ✨ IA pra criadoras de TikTok Shop
            </div>
            <h1 className="mt-4 text-[40px] sm:text-[52px] lg:text-[68px] font-extrabold tracking-[-0.03em] leading-[1.02] text-spark-ink">
              Crie scripts
              <br />
              que <span className="text-spark-brand">vendem 💕</span> no
              <br />
              TikTok Shop.
            </h1>
            <p className="mt-5 text-[16px] lg:text-[18px] text-spark-ink-70 leading-[1.55] max-w-[540px]">
              Sua IA pessoal pra analisar produto, achar viral e escrever hook que converte.
              Pensado por e pra criadoras brasileiras, em PT-BR, com humor real. 💅
            </p>
            <div className="mt-8">
              <CTAButtonRow />
            </div>
            <div className="mt-5 flex items-center gap-2 text-[12px] text-spark-ink-50">
              <Check size={14} strokeWidth={2} className="text-good" />
              7 dias de garantia · cancela quando quiser via Kiwify
            </div>
          </div>

          {/* Mockup do produto (mobile preview) */}
          <div className="relative mx-auto lg:mx-0">
            <div className="w-[280px] sm:w-[320px] rounded-[36px] border-[6px] border-spark-ink shadow-[0_40px_80px_-30px_rgba(20,20,40,0.4)] overflow-hidden bg-white">
              <div className="aspect-[9/19.5] bg-spark-bg flex flex-col">
                <div className="pt-10 px-4">
                  <div className="text-[11px] text-spark-ink-50 font-semibold">Oi, Maria 👋</div>
                  <div className="mt-1 text-[22px] font-extrabold tracking-[-0.02em] leading-[1.1]">
                    O que vamos
                    <br />
                    criar hoje?
                  </div>
                  <div className="mt-3 p-3 rounded-[18px] text-white bg-brand-grad-hero">
                    <div className="text-[9px] font-bold uppercase tracking-[0.08em] opacity-85 flex items-center gap-1">
                      <Sparkle size={10} strokeWidth={1.7} /> Nova conversa
                    </div>
                    <div className="mt-1.5 text-[14px] font-bold leading-[1.2]">
                      &ldquo;Sobe a foto do produto, eu cuido do resto.&rdquo;
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-4">
                  <div className="text-[9px] font-bold text-spark-ink-50 uppercase tracking-[0.08em] mb-2">
                    Atalhos
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {agents.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-[14px] bg-spark-surface border border-spark-hairline"
                      >
                        <AgentTile agent={a.id} size={24} />
                        <div className="mt-2 text-[11px] font-bold leading-tight">{a.t}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1" />
                <div className="px-3 pb-4 mt-3">
                  <div className="h-9 rounded-full bg-spark-surface-sunken border border-spark-hairline" />
                </div>
              </div>
            </div>
            {/* Floating agent badges */}
            <div className="absolute -top-2 -right-4 sm:right-0 hidden sm:flex flex-col gap-2">
              {agents.slice(0, 3).map((a, i) => (
                <div
                  key={a.id}
                  className="bg-white rounded-full shadow-[0_8px_24px_-12px_rgba(20,20,40,0.3)] border border-spark-hairline pl-1.5 pr-3 py-1.5 flex items-center gap-2"
                  style={{ transform: `translateX(${i * 12}px)` }}
                >
                  <AgentTile agent={a.id} size={22} />
                  <span className="text-[11px] font-bold">{a.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="max-w-[1200px] mx-auto px-5 lg:px-10 py-14 lg:py-20">
        <div className="text-center max-w-[640px] mx-auto">
          <div className="text-[12px] font-bold text-spark-brand uppercase tracking-[0.08em]">
            Por que Método TTS
          </div>
          <h2 className="mt-2 text-[32px] lg:text-[42px] font-extrabold tracking-[-0.025em] leading-[1.1]">
            Você não precisa virar especialista em IA pra vender.
          </h2>
          <p className="mt-3 text-[15px] lg:text-[17px] text-spark-ink-70 leading-[1.55]">
            Nós já fizemos isso. Você só sobe a foto e usa o que ele te entrega.
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {benefits.map((b) => (
            <div
              key={b.t}
              className="p-5 rounded-[18px] bg-spark-surface border border-spark-hairline"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-grad-soft text-spark-brand-deep flex items-center justify-center">
                <b.Icon size={20} strokeWidth={1.7} />
              </div>
              <div className="mt-3 text-[15px] font-bold leading-[1.25]">{b.t}</div>
              <div className="mt-1.5 text-[13px] text-spark-ink-70 leading-[1.4]">{b.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Os 4 agentes */}
      <section className="bg-spark-surface-sunken border-y border-spark-hairline">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 py-14 lg:py-20">
          <div className="text-center max-w-[640px] mx-auto">
            <div className="text-[12px] font-bold text-spark-brand uppercase tracking-[0.08em]">
              Os 4 agentes
            </div>
            <h2 className="mt-2 text-[32px] lg:text-[42px] font-extrabold tracking-[-0.025em] leading-[1.1]">
              Cada um é especialista em uma parte do seu funil.
            </h2>
          </div>
          <div className="mt-10 grid md:grid-cols-2 gap-3.5">
            {agents.map((a) => (
              <div
                key={a.id}
                className="p-5 lg:p-6 rounded-[20px] bg-spark-surface border border-spark-hairline flex gap-4"
              >
                <AgentTile agent={a.id} size={52} />
                <div className="flex-1">
                  <div className="text-[17px] font-extrabold tracking-[-0.01em]">{a.t}</div>
                  <div className="mt-1.5 text-[14px] text-spark-ink-70 leading-[1.5]">{a.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-[1200px] mx-auto px-5 lg:px-10 py-14 lg:py-20">
        <div className="text-center max-w-[640px] mx-auto">
          <div className="text-[12px] font-bold text-spark-brand uppercase tracking-[0.08em]">
            Como funciona
          </div>
          <h2 className="mt-2 text-[32px] lg:text-[42px] font-extrabold tracking-[-0.025em] leading-[1.1]">
            Em 4 passos, do produto ao script viral.
          </h2>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {steps.map((s) => (
            <div key={s.n} className="p-5 rounded-[18px] bg-spark-surface border border-spark-hairline">
              <div className="w-9 h-9 rounded-full bg-spark-ink text-white flex items-center justify-center font-extrabold font-mono">
                {s.n}
              </div>
              <div className="mt-3 text-[15px] font-bold leading-[1.25]">{s.t}</div>
              <div className="mt-1.5 text-[13px] text-spark-ink-70 leading-[1.4]">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-spark-surface-sunken border-y border-spark-hairline">
        <div className="max-w-[820px] mx-auto px-5 lg:px-10 py-14 lg:py-20 text-center">
          <div className="text-[12px] font-bold text-spark-brand uppercase tracking-[0.08em]">
            Preço
          </div>
          <h2 className="mt-2 text-[32px] lg:text-[42px] font-extrabold tracking-[-0.025em] leading-[1.1]">
            Um plano. Tudo incluído.
          </h2>
          <p className="mt-3 text-[15px] lg:text-[17px] text-spark-ink-70">
            Sem pegadinha, sem cobrança extra. Cancela quando quiser.
          </p>

          <div className="mt-8 inline-block w-full max-w-[480px] p-7 rounded-[26px] bg-spark-surface border border-spark-hairline shadow-[0_30px_60px_-30px_rgba(20,20,40,0.2)] text-left">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold text-spark-ink-50 uppercase tracking-[0.08em]">
                  Plano Pro
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-[44px] font-extrabold font-mono tracking-[-0.02em]">R$ 49,90</span>
                  <span className="text-[14px] text-spark-ink-50">/mês</span>
                </div>
              </div>
              <SBadge tone="brand">Promo de lançamento</SBadge>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {[
                "30 buscas de virais por mês",
                "50 scripts gerados por mês",
                "Análise de produto ilimitada",
                "Tira-dúvidas ilimitado",
                "Histórico salvo na nuvem",
                "Acesso PWA — instala no celular",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-[14px]">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{ background: "oklch(0.62 0.16 150)" }}
                  >
                    <Check size={12} strokeWidth={2.5} />
                  </div>
                  {f}
                </div>
              ))}
            </div>

            <div className="mt-7">
              <a href={KIWIFY_CHECKOUT_URL} target="_blank" rel="noreferrer" className="block">
                <SButton variant="primary" size="lg" full IconRight={ArrowRight}>
                  Quero começar agora
                </SButton>
              </a>
              <div className="mt-3 text-[11px] text-spark-ink-50 text-center">
                Pagamento processado por Kiwify · 7 dias de garantia
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="max-w-[1200px] mx-auto px-5 lg:px-10 py-14 lg:py-20">
        <div className="text-center max-w-[640px] mx-auto">
          <div className="text-[12px] font-bold text-spark-brand uppercase tracking-[0.08em]">
            Quem já usa
          </div>
          <h2 className="mt-2 text-[32px] lg:text-[42px] font-extrabold tracking-[-0.025em] leading-[1.1]">
            Criadoras que pararam de travar no roteiro.
          </h2>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-3.5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-5 rounded-[18px] bg-spark-surface border border-spark-hairline"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-brand-grad text-white flex items-center justify-center font-extrabold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-[14px] font-bold">{t.name}</div>
                  <div className="text-[11px] text-spark-ink-50">{t.role}</div>
                </div>
              </div>
              <div className="mt-3 text-[13.5px] text-spark-ink-70 leading-[1.5] italic">
                &ldquo;{t.quote}&rdquo;
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-[1200px] mx-auto px-5 lg:px-10 pb-16 lg:pb-24">
        <div className="rounded-[28px] p-8 lg:p-14 text-white bg-brand-grad-hero shadow-[0_40px_80px_-40px_oklch(0.5_0.22_305/0.6)] text-center">
          <SparkMark size={48} white />
          <h2 className="mt-4 text-[28px] lg:text-[44px] font-extrabold tracking-[-0.025em] leading-[1.1] max-w-[640px] mx-auto">
            Bora trocar o &ldquo;eu não sei o que postar&rdquo; por &ldquo;já tem 10 hooks prontos&rdquo;?
          </h2>
          <div className="mt-7 flex flex-col sm:flex-row gap-2 justify-center max-w-[480px] mx-auto">
            <a href={KIWIFY_CHECKOUT_URL} target="_blank" rel="noreferrer" className="block flex-1">
              <button className="w-full h-[56px] rounded-full bg-white text-spark-brand-deep text-[16px] font-bold inline-flex items-center justify-center gap-2 hover:bg-white/90 transition-colors">
                Comprar agora · R$ 49,90 <ArrowRight size={18} strokeWidth={1.7} />
              </button>
            </a>
            <Link href="/login" className="block flex-1">
              <button className="w-full h-[56px] rounded-full bg-white/15 backdrop-blur text-white text-[16px] font-bold border border-white/30 hover:bg-white/25 transition-colors">
                Já tenho acesso
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-spark-hairline">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SparkWordmark size={16} />
            <span className="text-[11px] text-spark-ink-50 font-mono">v1.4.0 · PWA</span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-spark-ink-50">
            <Link href="#" className="hover:text-spark-ink transition-colors">Termos</Link>
            <Link href="#" className="hover:text-spark-ink transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-spark-ink transition-colors">Suporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
