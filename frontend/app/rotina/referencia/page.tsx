"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";

/**
 * /rotina/referencia — Timeline da rotina ideal do Método TTS.
 *
 * Inspiracional, não interativo. Aluna abre quando quer "se reinspirar".
 * Reflete exatamente o cronograma que Felipe descreveu.
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
  {
    time: "06:00 - 07:30",
    title: "Ritual de Autocuidado",
    description:
      "Despertar, skincare matinal, suplementação e se arrumar. Organização rápida do quarto + alinhamento do cenário. Café da manhã.",
    emoji: "✨",
    category: "manhã",
  },
  {
    time: "07:30",
    title: "POSTAGEM MANUAL · Vídeo 1",
    description: "Primeiro vídeo do dia + interação inicial com a audiência.",
    emoji: "📱",
    category: "trabalho",
    highlight: true,
  },
  {
    time: "08:00 - 09:00",
    title: "LIVE Bate-papo (conexão)",
    description: "Tomando café da manhã ao vivo com a comunidade. Conexão antes de vender.",
    emoji: "🔴",
    category: "comunidade",
    highlight: true,
  },
  {
    time: "09:00",
    title: "POSTAGEM MANUAL · Vídeo 2",
    description: "Segundo vídeo do dia.",
    emoji: "📱",
    category: "trabalho",
    highlight: true,
  },
  {
    time: "09:15 - 11:00",
    title: "Estudo de Mercado + Gravação em Lote",
    description: "Bloco de gravação direta — deixar 10 a 14 vídeos prontos nos rascunhos pra publicação ao longo da semana.",
    emoji: "🎬",
    category: "trabalho",
  },
  {
    time: "11:00",
    title: "POSTAGEM MANUAL · Vídeo 3",
    description: "Terceiro vídeo + 5 min de interação nos comentários.",
    emoji: "📱",
    category: "trabalho",
    highlight: true,
  },
  {
    time: "11:05 - 12:30",
    title: "Academia & Saúde",
    description: "Treino físico — corpo cuidado = energia pra performance no resto do dia.",
    emoji: "🏋️",
    category: "saúde",
  },
  {
    time: "12:30 - 13:30",
    title: "Almoço",
    description: "Pausa real. Sem celular. Recarga.",
    emoji: "🍽️",
    category: "saúde",
  },
  {
    time: "13:30",
    title: "POSTAGEM MANUAL · Vídeo 4",
    description: "Quarto vídeo + banho e troca de roupa pra parte da tarde.",
    emoji: "📱",
    category: "trabalho",
    highlight: true,
  },
  {
    time: "14:00 - 15:30",
    title: "Análise de Métricas",
    description: "Bloco A: retenção, ganchos. Bloco B (alternado): cruzamento de faturamento + cliques no carrinho.",
    emoji: "📊",
    category: "trabalho",
  },
  {
    time: "15:30 - 16:30",
    title: "Lote de Comunicação",
    description: "Responder comentários, WhatsApp e e-mails de uma vez só.",
    emoji: "💬",
    category: "comunidade",
  },
  {
    time: "16:30",
    title: "POSTAGEM MANUAL · Vídeo 5",
    description: "Quinto vídeo + lanchinho da tarde.",
    emoji: "📱",
    category: "trabalho",
    highlight: true,
  },
  {
    time: "16:45 - 17:30",
    title: "Janela Doméstica",
    description: "Resolver TODAS as tarefas da casa de uma vez. Não espalhar.",
    emoji: "🏠",
    category: "saúde",
  },
  {
    time: "17:30",
    title: "POSTAGEM MANUAL · Vídeo 6",
    description: "Sexto vídeo + jantar funcional e leve.",
    emoji: "📱",
    category: "trabalho",
    highlight: true,
  },
  {
    time: "18:30 - 19:00",
    title: "Backstage da Live",
    description: "Organização de produtos, luz, som e cupons.",
    emoji: "🎤",
    category: "vendas",
  },
  {
    time: "19:00 - 21:00",
    title: "LIVE SHOP",
    description: "Foco total em retenção e vendas. O grande momento do dia.",
    emoji: "🛍️",
    category: "vendas",
    highlight: true,
  },
  {
    time: "21:00",
    title: "POSTAGEM MANUAL · Vídeo 7 (último)",
    description: "Sétimo e último vídeo do dia + fechamento financeiro da Live Shop.",
    emoji: "📱",
    category: "trabalho",
    highlight: true,
  },
  {
    time: "21:30 - 23:00",
    title: "Higiene do Sono",
    description: "Skincare noturno, suplementação da noite, banho relaxante. Zero telas a partir das 22:15.",
    emoji: "🌙",
    category: "noite",
  },
];

const CATEGORY_COLORS: Record<Block["category"], { bg: string; ring: string; text: string }> = {
  manhã: {
    bg: "bg-yellow-100",
    ring: "ring-yellow-300",
    text: "text-yellow-800",
  },
  trabalho: {
    bg: "bg-spark-brand-soft",
    ring: "ring-spark-brand/40",
    text: "text-spark-brand-deep",
  },
  saúde: {
    bg: "bg-emerald-100",
    ring: "ring-emerald-300",
    text: "text-emerald-800",
  },
  comunidade: {
    bg: "bg-rose-100",
    ring: "ring-rose-300",
    text: "text-rose-800",
  },
  vendas: {
    bg: "bg-amber-100",
    ring: "ring-amber-300",
    text: "text-amber-800",
  },
  noite: {
    bg: "bg-indigo-100",
    ring: "ring-indigo-300",
    text: "text-indigo-800",
  },
};

function TimelineBlock({ block }: { block: Block }) {
  const colors = CATEGORY_COLORS[block.category];
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-16 sm:w-20 pt-1.5">
        <div className="text-[11px] font-extrabold text-spark-ink-50 uppercase tracking-wider leading-tight">
          {block.time}
        </div>
      </div>
      <div className="relative pl-5 pb-5 flex-1 min-w-0 border-l-2 border-spark-hairline">
        <div
          className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full ${colors.bg} ring-2 ring-white ${colors.ring}`}
        />
        <div
          className={`rounded-2xl p-4 ${
            block.highlight
              ? "bg-brand-grad-soft border border-spark-brand/20"
              : "bg-spark-surface border border-spark-hairline"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="text-[24px] shrink-0">{block.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[14px] font-extrabold text-spark-ink leading-tight">
                  {block.title}
                </h3>
                <span
                  className={`text-[9.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${colors.bg} ${colors.text}`}
                >
                  {block.category}
                </span>
              </div>
              <p className="mt-1.5 text-[12.5px] text-spark-ink-70 leading-snug">
                {block.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferenciaBody({ desktop = false }: { desktop?: boolean }) {
  const videoCount = TIMELINE.filter((b) => b.title.includes("POSTAGEM")).length;
  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "max-w-[720px]" : "px-4 pt-4"}>
        {desktop && (
          <>
            <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
              📖 Rotina TTS
            </div>
            <h1 className="mt-1 font-extrabold tracking-tight leading-[1.1] text-[36px]">
              O dia ideal ✨
            </h1>
          </>
        )}

        {/* Hero */}
        <div className="rounded-3xl bg-brand-grad-hero text-white p-5 mb-6 overflow-hidden relative shadow-[0_12px_32px_-16px_oklch(0.55_0.24_340/0.45)]">
          <div
            aria-hidden
            className="absolute -top-10 -right-6 w-44 h-44 rounded-full bg-white/15 blur-3xl pointer-events-none"
          />
          <div className="relative">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-90">
              Modelo de referência
            </div>
            <h2 className="mt-1 text-[20px] font-extrabold leading-tight">
              06:00 às 23:00 — a rotina que escala 💕
            </h2>
            <p className="mt-2 text-[13px] leading-snug opacity-95">
              {videoCount} postagens manuais ao dia, 2 lives (bate-papo + shop), gravação em lote, análise
              de métricas e MUITO autocuidado. Você não precisa copiar, mas vai te dar norte.
            </p>
            <Link
              href="/rotina/hoje"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-spark-brand-deep text-[13px] font-extrabold active:scale-95 transition-transform"
            >
              <Plus size={14} strokeWidth={2.5} />
              Fazer check-in do meu dia
            </Link>
          </div>
        </div>

        {/* Timeline */}
        <div>
          {TIMELINE.map((block, idx) => (
            <TimelineBlock key={idx} block={block} />
          ))}
        </div>

        {/* Footer motivacional */}
        <div className="mt-6 rounded-3xl bg-spark-surface border border-spark-hairline p-5 text-center">
          <div className="text-[28px] mb-2">🌷</div>
          <h3 className="text-[15px] font-extrabold text-spark-ink">
            Não precisa fazer tudo de uma vez
          </h3>
          <p className="text-[13px] text-spark-ink-50 mt-1.5 leading-snug">
            Escolhe 3 itens dessa rotina pra começar essa semana. Quando virar hábito, adiciona mais.
            Consistência &gt; perfeição ✨
          </p>
        </div>
      </div>
    </div>
  );
}

function ReferenciaMobile() {
  return (
    <>
      <MobileHeader
        variant="editorial"
        eyebrow="📖 REFERÊNCIA"
        title="A rotina ideal"
        back={{ href: "/rotina/hoje" }}
      />
      <ReferenciaBody />
      <BottomNav active="rotina" />
    </>
  );
}

function ReferenciaDesktop() {
  return <ReferenciaBody desktop />;
}

export default function ReferenciaPage() {
  return (
    <ResponsiveShell
      mobile={<ReferenciaMobile />}
      desktop={<ReferenciaDesktop />}
      active="rotina"
    />
  );
}
