"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Plus } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { CountUp } from "@/components/atoms/count-up";
import { cn } from "@/lib/cn";

/**
 * /rotina/referencia — timeline editorial premium da rotina ideal Yara.
 *
 * Layout:
 *   • Hero radial: back + sticker + Tanker "o dia / que escala."
 *   • Stats inline (3 KPIs com CountUp)
 *   • Timeline magazine com 18 blocos. Cada bloco tem horário, dot
 *     colorido por categoria, card com emoji grande, título, descrição.
 *     Blocos highlight ganham gradient brand + sombra.
 *   • Categoria legend dropdown
 *   • Footer "consistência > perfeição"
 *   • FloatingMainNav lateral
 */

type Block = {
  time: string;
  title: string;
  description: string;
  emoji: string;
  category: "manhã" | "trabalho" | "saúde" | "comunidade" | "vendas" | "noite";
  highlight?: boolean;
};

const TIMELINE: Block[] = [
  { time: "06:00 - 07:30", title: "Ritual de Autocuidado", description: "Despertar, skincare matinal, suplementação e se arrumar. Organização rápida do quarto + alinhamento do cenário. Café da manhã.", emoji: "✨", category: "manhã" },
  { time: "07:30", title: "POSTAGEM MANUAL · Vídeo 1", description: "Primeiro vídeo do dia + interação inicial com a audiência.", emoji: "📱", category: "trabalho", highlight: true },
  { time: "08:00 - 09:00", title: "LIVE Bate-papo (conexão)", description: "Tomando café da manhã ao vivo com a comunidade. Conexão antes de vender.", emoji: "🔴", category: "comunidade", highlight: true },
  { time: "09:00", title: "POSTAGEM MANUAL · Vídeo 2", description: "Segundo vídeo do dia.", emoji: "📱", category: "trabalho", highlight: true },
  { time: "09:15 - 11:00", title: "Estudo de Mercado + Gravação em Lote", description: "Bloco de gravação direta — deixar 10 a 14 vídeos prontos nos rascunhos pra publicação ao longo da semana.", emoji: "🎬", category: "trabalho" },
  { time: "11:00", title: "POSTAGEM MANUAL · Vídeo 3", description: "Terceiro vídeo + 5 min de interação nos comentários.", emoji: "📱", category: "trabalho", highlight: true },
  { time: "11:05 - 12:30", title: "Academia & Saúde", description: "Treino físico — corpo cuidado = energia pra performance no resto do dia.", emoji: "🏋️", category: "saúde" },
  { time: "12:30 - 13:30", title: "Almoço", description: "Pausa real. Sem celular. Recarga.", emoji: "🍽️", category: "saúde" },
  { time: "13:30", title: "POSTAGEM MANUAL · Vídeo 4", description: "Quarto vídeo + banho e troca de roupa pra parte da tarde.", emoji: "📱", category: "trabalho", highlight: true },
  { time: "14:00 - 15:30", title: "Análise de Métricas", description: "Bloco A: retenção, ganchos. Bloco B (alternado): cruzamento de faturamento + cliques no carrinho.", emoji: "📊", category: "trabalho" },
  { time: "15:30 - 16:30", title: "Lote de Comunicação", description: "Responder comentários, WhatsApp e e-mails de uma vez só.", emoji: "💬", category: "comunidade" },
  { time: "16:30", title: "POSTAGEM MANUAL · Vídeo 5", description: "Quinto vídeo + lanchinho da tarde.", emoji: "📱", category: "trabalho", highlight: true },
  { time: "16:45 - 17:30", title: "Janela Doméstica", description: "Resolver TODAS as tarefas da casa de uma vez. Não espalhar.", emoji: "🏠", category: "saúde" },
  { time: "17:30", title: "POSTAGEM MANUAL · Vídeo 6", description: "Sexto vídeo + jantar funcional e leve.", emoji: "📱", category: "trabalho", highlight: true },
  { time: "18:30 - 19:00", title: "Backstage da Live", description: "Organização de produtos, luz, som e cupons.", emoji: "🎤", category: "vendas" },
  { time: "19:00 - 21:00", title: "LIVE SHOP", description: "Foco total em retenção e vendas. O grande momento do dia.", emoji: "🛍️", category: "vendas", highlight: true },
  { time: "21:00", title: "POSTAGEM MANUAL · Vídeo 7 (último)", description: "Sétimo e último vídeo do dia + fechamento financeiro da Live Shop.", emoji: "📱", category: "trabalho", highlight: true },
  { time: "21:30 - 23:00", title: "Higiene do Sono", description: "Skincare noturno, suplementação da noite, banho relaxante. Zero telas a partir das 22:15.", emoji: "🌙", category: "noite" },
];

const CATEGORY_COLORS: Record<
  Block["category"],
  { dot: string; ring: string; chip: string; chipText: string }
> = {
  manhã: {
    dot: "bg-yellow-300",
    ring: "ring-yellow-200",
    chip: "bg-yellow-100",
    chipText: "text-yellow-800",
  },
  trabalho: {
    dot: "bg-spark-brand",
    ring: "ring-spark-brand/30",
    chip: "bg-spark-brand-soft",
    chipText: "text-spark-brand-deep",
  },
  saúde: {
    dot: "bg-emerald-400",
    ring: "ring-emerald-200",
    chip: "bg-emerald-100",
    chipText: "text-emerald-800",
  },
  comunidade: {
    dot: "bg-rose-400",
    ring: "ring-rose-200",
    chip: "bg-rose-100",
    chipText: "text-rose-800",
  },
  vendas: {
    dot: "bg-amber-400",
    ring: "ring-amber-200",
    chip: "bg-amber-100",
    chipText: "text-amber-800",
  },
  noite: {
    dot: "bg-indigo-400",
    ring: "ring-indigo-200",
    chip: "bg-indigo-100",
    chipText: "text-indigo-800",
  },
};

const CATEGORIES_ORDER: Block["category"][] = [
  "manhã",
  "trabalho",
  "saúde",
  "comunidade",
  "vendas",
  "noite",
];

// =================================================================
// HERO
// =================================================================

function HeroSection({ desktop }: { desktop: boolean }) {
  const videoCount = TIMELINE.filter((b) => b.title.includes("POSTAGEM")).length;
  const liveCount = TIMELINE.filter((b) => b.category === "comunidade" || b.title.includes("LIVE SHOP")).length;

  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
        paddingBottom: desktop ? "80px" : "56px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[520px] h-[520px]" />
      <HeroBlob color="lilac" variant={3} className="bottom-0 left-1/3 w-[400px] h-[400px]" />
      <SparkleField count={14} seed={520} className="opacity-70" />

      <div className={`relative ${desktop ? "px-12 max-w-[1100px] mx-auto" : "px-5"}`}>
        <SectionReveal direction="down" durationMs={500}>
          <Link
            href="/rotina/hoje"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pro check-in
          </Link>
        </SectionReveal>

        <div className="flex items-start justify-between gap-4 mt-6">
          <SectionReveal direction="down" delay={100} durationMs={600}>
            <div className="text-eyebrow text-spark-brand-deep">
              ✦ modelo de referência
            </div>
            <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[34ch] font-semibold">
              06h às 23h da rotina que faz a Yara vender milhões.
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="ROTINA · 2026 · IDEAL · " emoji="📖" size={128} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={150} durationMs={900}>
          <h1
            className="mt-6 font-display lowercase leading-[0.9] tracking-tight max-w-[14ch]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            <span className="block text-spark-ink">o dia</span>
            <span className="block text-grad-brand">que escala.</span>
          </h1>
        </SectionReveal>

        <SectionReveal direction="up" delay={700}>
          <div className="mt-10 grid grid-cols-3 gap-3 max-w-[640px]">
            <StatPill emoji="📱" value={videoCount} label="postagens" />
            <StatPill emoji="🔴" value={liveCount} label="lives" />
            <StatPill emoji="🎬" value={14} label="gravações" suffix="" small />
          </div>
        </SectionReveal>

        <SectionReveal direction="up" delay={900}>
          <Link
            href="/rotina/hoje"
            className="mt-7 group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-spark-ink text-white text-[14px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-1 hover:bg-spark-brand-deep active:translate-y-0"
          >
            <Plus
              size={16}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:rotate-90"
            />
            Fazer check-in do meu dia
            <ArrowUpRight
              size={16}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </SectionReveal>
      </div>
    </section>
  );
}

function StatPill({
  emoji,
  value,
  label,
  suffix,
  small,
}: {
  emoji: string;
  value: number;
  label: string;
  suffix?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-spark-2xl glass border border-spark-hairline p-4">
      <div className="text-[20px]">{emoji}</div>
      <div className="mt-2 font-extrabold tracking-tight leading-none text-spark-ink text-[26px]">
        <CountUp value={value} durationMs={900} />
        {suffix}
      </div>
      <div
        className={cn(
          "mt-1.5 text-spark-ink-50 font-semibold leading-tight",
          small ? "text-[10.5px]" : "text-[11.5px]",
        )}
      >
        {label}
      </div>
    </div>
  );
}

// =================================================================
// LEGENDA
// =================================================================

function Legend() {
  return (
    <SectionReveal>
      <div className="rounded-spark-2xl glass border border-spark-hairline p-4 sm:p-5">
        <div className="text-eyebrow text-spark-brand mb-3">✦ legenda</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES_ORDER.map((cat) => {
            const c = CATEGORY_COLORS[cat];
            return (
              <span
                key={cat}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold tracking-tight uppercase",
                  c.chip,
                  c.chipText,
                )}
              >
                <span aria-hidden className={cn("w-2 h-2 rounded-full", c.dot)} />
                {cat}
              </span>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// TIMELINE BLOCK
// =================================================================

function TimelineBlock({
  block,
  index,
  isLast,
}: {
  block: Block;
  index: number;
  isLast: boolean;
}) {
  const colors = CATEGORY_COLORS[block.category];
  return (
    <SectionReveal direction="up" delay={Math.min(index * 40, 240)}>
      <div className="flex gap-3 sm:gap-5">
        {/* Hora */}
        <div className="shrink-0 w-16 sm:w-24 pt-2">
          <div className="text-[11px] sm:text-[12px] font-extrabold text-spark-ink-50 uppercase tracking-wider leading-tight font-mono">
            {block.time}
          </div>
        </div>

        {/* Trilha + card */}
        <div
          className={cn(
            "relative pl-5 sm:pl-7 flex-1 min-w-0",
            !isLast && "pb-4 sm:pb-5",
          )}
        >
          {/* Linha */}
          <div
            aria-hidden
            className="absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-spark-hairline via-spark-hairline to-transparent"
          />

          {/* Dot */}
          <div
            aria-hidden
            className={cn(
              "absolute -left-[7px] top-2.5 w-4 h-4 rounded-full ring-4 ring-white shadow-sm",
              colors.dot,
              colors.ring,
            )}
            style={{ boxShadow: "0 4px 12px -4px rgba(0,0,0,0.18)" }}
          />

          {/* Card */}
          <div
            className={cn(
              "rounded-spark-2xl p-4 sm:p-5 transition-all duration-300 ease-premium hover-lift",
              block.highlight
                ? "bg-gradient-to-br from-spark-brand-soft via-white to-amber-50 border border-spark-brand/25 shadow-rest"
                : "bg-spark-surface border border-spark-hairline shadow-rest",
            )}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className={cn(
                  "shrink-0 flex items-center justify-center rounded-2xl",
                  block.highlight
                    ? "bg-white shadow-rest text-[28px] w-12 h-12 sm:w-14 sm:h-14"
                    : "bg-spark-surface-sunken/50 text-[24px] w-11 h-11 sm:w-12 sm:h-12",
                )}
                aria-hidden
              >
                {block.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider",
                      colors.chip,
                      colors.chipText,
                    )}
                  >
                    <span aria-hidden className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
                    {block.category}
                  </span>
                  {block.highlight && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-spark-ink text-white text-[9px] font-extrabold uppercase tracking-wider">
                      ✦ destaque
                    </span>
                  )}
                </div>
                <h3 className="text-[14.5px] sm:text-[15.5px] font-extrabold text-spark-ink leading-tight tracking-tight">
                  {block.title}
                </h3>
                <p className="mt-2 text-[12.5px] sm:text-[13px] text-spark-ink-70 leading-snug">
                  {block.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// FOOTER
// =================================================================

function FooterMessage() {
  return (
    <SectionReveal direction="up">
      <div className="relative overflow-hidden rounded-spark-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 text-white p-8 sm:p-12 text-center shadow-hero">
        <SparkleField count={10} seed={444} color="rgba(255,255,255,0.6)" className="opacity-60" />
        <div
          aria-hidden
          className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-white/15 blur-3xl animate-blob-1"
        />
        <div className="relative">
          <div className="text-[40px] mb-4">🌷</div>
          <h2
            className="font-display lowercase leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)" }}
          >
            consistência<br />
            <span className="opacity-90">vence perfeição.</span>
          </h2>
          <p className="mt-5 text-[14px] leading-snug opacity-95 max-w-[42ch] mx-auto">
            Escolhe 3 itens dessa rotina pra começar essa semana. Quando virar hábito, adiciona mais. ✨
          </p>
          <Link
            href="/rotina/hoje"
            className="group mt-7 inline-flex items-center gap-2 px-7 py-4 rounded-full bg-white text-spark-brand-deep text-[14px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-1"
          >
            <Plus
              size={16}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:rotate-90"
            />
            Começar agora
            <ArrowUpRight
              size={16}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// BODY
// =================================================================

function ReferenciaBody({ desktop = false }: { desktop?: boolean }) {
  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      <HeroSection desktop={desktop} />

      <section className={`relative ${desktop ? "px-12 py-12" : "px-5 py-8"}`}>
        <div className={desktop ? "max-w-[920px] mx-auto" : ""}>
          <Legend />

          <div className="mt-8">
            {TIMELINE.map((block, idx) => (
              <TimelineBlock
                key={idx}
                block={block}
                index={idx}
                isLast={idx === TIMELINE.length - 1}
              />
            ))}
          </div>

          <div className="mt-8">
            <FooterMessage />
          </div>
        </div>
      </section>
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function ReferenciaMobile() {
  return <ReferenciaBody />;
}

function ReferenciaDesktop() {
  return <ReferenciaBody desktop />;
}

export default function ReferenciaPage() {
  return (
    <>
      <ResponsiveShell
        mobile={<ReferenciaMobile />}
        desktop={<ReferenciaDesktop />}
        active="rotina"
        customSidebar
      />
      <FloatingMainNav active="rotina" />
    </>
  );
}
