"use client";

import * as React from "react";
import { ExternalLink, Sparkles, ChevronDown } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import {
  AGENTS_CATALOG,
  CATEGORY_LABELS,
  groupByCategory,
  type AgentCatalogItem,
} from "@/lib/agents-catalog";

/**
 * Página /agentes — portal central dos GPTs/Gems externos.
 *
 * Visual: cada agente é um card "magazine" — hero com imagem (ou gradient
 * de fallback) + chip flutuante, corpo com texto e dois CTAs grandes.
 * Quando o link ainda não existir, mostra estado "Em breve".
 *
 * Detalhes "Como funciona" do agente abrem em expansão (accordion) pra
 * não poluir visualmente o grid.
 */

function AgentCard({ agent }: { agent: AgentCatalogItem }) {
  const [expanded, setExpanded] = React.useState(false);
  const hasChatgpt = !!agent.chatgptUrl;
  const hasGemini = !!agent.geminiUrl;
  const hasAnyLink = hasChatgpt || hasGemini;

  return (
    <article className="group rounded-3xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-[0_2px_10px_-6px_rgba(20,20,40,0.06)] hover:shadow-[0_12px_32px_-12px_rgba(20,20,40,0.18)] hover:border-spark-brand/30 transition-all duration-300 flex flex-col">
      {/* HERO — imagem ou gradient com emoji grande */}
      <div className={`relative h-44 sm:h-48 overflow-hidden bg-gradient-to-br ${agent.accent}`}>
        {agent.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agent.imageUrl}
            alt={agent.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <>
            {/* Pattern decorativo no gradient */}
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 35%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 35%)",
              }}
            />
            {/* Emoji grande centralizado */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[80px] sm:text-[96px] drop-shadow-[0_4px_20px_rgba(0,0,0,0.18)] group-hover:scale-110 transition-transform duration-500">
                {agent.emoji}
              </span>
            </div>
          </>
        )}

        {/* Chip flutuante */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10.5px] font-extrabold text-spark-ink tracking-tight shadow-sm">
            {agent.emoji} {agent.chip ?? agent.name}
          </span>
        </div>

        {/* Status "Em breve" se sem links */}
        {!hasAnyLink && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-spark-ink/80 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider">
              Em breve
            </span>
          </div>
        )}
      </div>

      {/* CORPO */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="text-[16px] font-extrabold text-spark-ink tracking-tight leading-tight">
          {agent.name}
        </h3>
        <p className="mt-1.5 text-[13px] text-spark-ink-70 leading-snug">
          {agent.shortDescription}
        </p>

        {/* Como funciona — accordion */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 -mx-1 px-1 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-spark-brand hover:text-spark-brand-deep transition-colors"
        >
          {expanded ? "Esconder" : "Como funciona"}
          <ChevronDown
            size={12}
            strokeWidth={2.5}
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        {expanded && (
          <div className="mt-2 rounded-xl bg-spark-surface-sunken/60 px-3 py-2.5 text-[12px] text-spark-ink-70 leading-relaxed">
            {agent.howItWorks}
          </div>
        )}

        {/* CTAs */}
        <div className="mt-auto pt-4">
          {hasAnyLink ? (
            <div className="flex flex-col sm:flex-row gap-2">
              {hasChatgpt && (
                <a
                  href={agent.chatgptUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#10a37f] text-white text-[12.5px] font-extrabold active:scale-95 transition-transform"
                >
                  ChatGPT
                  <ExternalLink size={11} strokeWidth={2.5} />
                </a>
              )}
              {hasGemini && (
                <a
                  href={agent.geminiUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[12.5px] font-extrabold active:scale-95 transition-transform"
                >
                  Gemini
                  <ExternalLink size={11} strokeWidth={2.5} />
                </a>
              )}
            </div>
          ) : (
            <div className="text-center text-[11.5px] text-spark-ink-50 py-2.5 rounded-xl bg-spark-surface-sunken/60">
              Liberamos nas próximas semanas 💕
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function HowItWorksBox() {
  return (
    <div className="relative rounded-3xl bg-brand-grad-hero text-white p-5 mb-7 overflow-hidden shadow-[0_12px_32px_-16px_oklch(0.55_0.24_340/0.45)]">
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="absolute -top-12 -right-8 w-48 h-48 rounded-full bg-white/20 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-10 -left-6 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none"
      />

      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Sparkles size={17} strokeWidth={2.2} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-[14px] font-extrabold tracking-tight mb-2.5">Como funciona ✨</h3>
          <ol className="space-y-1.5 text-[12.5px] text-white/95 leading-relaxed">
            <li className="flex gap-2">
              <span className="font-extrabold opacity-80 shrink-0">1.</span>
              <span>Escolhe o agente do seu nicho e clica em ChatGPT ou Gemini.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-extrabold opacity-80 shrink-0">2.</span>
              <span>Conversa direto na plataforma — manda foto/nome do produto.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-extrabold opacity-80 shrink-0">3.</span>
              <span>
                Cola a ficha em <strong>📦 Produtos</strong> ou os roteiros em{" "}
                <strong>✍️ Scripts</strong> aqui no app.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-extrabold opacity-80 shrink-0">4.</span>
              <span>Pronto, ficou tudo organizadinho num só lugar 💕</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function AgentesBody({ desktop = false }: { desktop?: boolean }) {
  const groups = React.useMemo(() => groupByCategory(AGENTS_CATALOG), []);
  const order: Array<keyof typeof groups> = ["info", "scripts", "suporte"];

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "max-w-[1100px]" : "px-4 pt-4"}>
        {desktop && (
          <>
            <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
              ✨ Agentes Yara
            </div>
            <h1 className="mt-1 font-extrabold tracking-tight leading-[1.1] text-[36px]">
              Suas especialistas ✨
            </h1>
          </>
        )}
        <p
          className={`text-[13.5px] text-spark-ink-50 max-w-[600px] ${desktop ? "mt-1.5 mb-7" : "mb-6"}`}
        >
          Cada agente é uma especialista no seu nicho. Conversa direto no ChatGPT ou Gemini, sem
          custo extra. Depois salva os resultados aqui pra ter tudo organizado. 💕
        </p>

        <HowItWorksBox />

        <div className="space-y-8">
          {order.map((cat) => {
            const items = groups[cat];
            if (items.length === 0) return null;
            const meta = CATEGORY_LABELS[cat];
            return (
              <section key={cat}>
                <div className="mb-4 px-1 flex items-end justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-[10.5px] font-extrabold text-spark-brand uppercase tracking-[0.1em] mb-1">
                      {cat === "info"
                        ? "Análise"
                        : cat === "scripts"
                          ? `${items.length} nichos`
                          : "Suporte"}
                    </div>
                    <h2 className="text-[18px] font-extrabold text-spark-ink tracking-tight leading-tight">
                      {meta.label}
                    </h2>
                    <p className="text-[12.5px] text-spark-ink-50 mt-0.5 leading-snug">
                      {meta.description}
                    </p>
                  </div>
                </div>
                <div
                  className={`grid gap-3.5 sm:gap-4 ${
                    desktop ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  {items.map((agent) => (
                    <AgentCard key={agent.slug} agent={agent} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AgentesMobile() {
  return (
    <>
      <MobileHeader title="Agentes ✨" back={{ href: "/" }} />
      <AgentesBody />
      <BottomNav active="chat" />
    </>
  );
}

function AgentesDesktop() {
  return <AgentesBody desktop />;
}

export default function AgentesPage() {
  return <ResponsiveShell mobile={<AgentesMobile />} desktop={<AgentesDesktop />} active="chat" />;
}
