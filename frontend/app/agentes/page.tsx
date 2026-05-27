"use client";

import * as React from "react";
import { ExternalLink, Sparkles, Info } from "lucide-react";
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
 * Página /agentes — portal central pros agentes externos (ChatGPT GPTs +
 * Gemini Gems). Substituiu o chat interno do app.
 *
 * Cada agente é um card com:
 *   - emoji + nome + descrição curta
 *   - botões pra ChatGPT e Gemini (se o link existir)
 *   - "Como funciona" explicativo
 *
 * Fonte dos dados: lib/agents-catalog.ts
 */

function AgentCard({ agent }: { agent: AgentCatalogItem }) {
  const hasChatgpt = !!agent.chatgptUrl;
  const hasGemini = !!agent.geminiUrl;
  const hasAnyLink = hasChatgpt || hasGemini;

  return (
    <article className="rounded-2xl bg-spark-surface border border-spark-hairline overflow-hidden">
      {/* Header colorido com gradient do nicho */}
      <div className={`bg-gradient-to-br ${agent.accent} px-4 py-3.5`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center text-[24px] shrink-0">
            {agent.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-extrabold text-white tracking-tight leading-tight truncate">
              {agent.name}
            </h3>
            <p className="text-[11.5px] text-white/90 font-medium mt-0.5 leading-snug line-clamp-2">
              {agent.shortDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[12.5px] text-spark-ink-70 leading-relaxed">{agent.howItWorks}</p>

        {hasAnyLink ? (
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {hasChatgpt && (
              <a
                href={agent.chatgptUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#10a37f] text-white text-[12.5px] font-bold active:scale-95 transition-transform"
              >
                💬 Abrir no ChatGPT
                <ExternalLink size={11} strokeWidth={2.5} />
              </a>
            )}
            {hasGemini && (
              <a
                href={agent.geminiUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[12.5px] font-bold active:scale-95 transition-transform"
              >
                ✨ Abrir no Gemini
                <ExternalLink size={11} strokeWidth={2.5} />
              </a>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-spark-surface-sunken/60 px-3 py-2 flex items-center gap-2 text-[11.5px] text-spark-ink-50">
            <Info size={12} strokeWidth={2} />
            Em breve — vamos liberar nas próximas semanas 💕
          </div>
        )}
      </div>
    </article>
  );
}

function HowItWorksBox() {
  return (
    <div className="rounded-2xl bg-spark-brand-soft border border-spark-brand/20 p-4 mb-6">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-grad text-white flex items-center justify-center shrink-0">
          <Sparkles size={15} strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <h3 className="text-[13.5px] font-extrabold text-spark-ink mb-2">Como funciona ✨</h3>
          <ol className="space-y-1.5 text-[12.5px] text-spark-ink-70 leading-relaxed">
            <li>
              <strong className="text-spark-ink">1.</strong> Escolhe o agente do seu nicho e clica em
              ChatGPT ou Gemini.
            </li>
            <li>
              <strong className="text-spark-ink">2.</strong> Conversa direto na plataforma —
              manda foto/nome do produto, recebe ficha ou roteiros.
            </li>
            <li>
              <strong className="text-spark-ink">3.</strong> Cola a ficha em <strong>📦 Produtos</strong>
              {" "}ou os roteiros em <strong>✍️ Scripts</strong> aqui no app pra salvar no seu catálogo.
            </li>
            <li>
              <strong className="text-spark-ink">4.</strong> Pronto, ficou tudo organizadinho num só
              lugar 💕
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
      <div className={desktop ? "max-w-[920px]" : "px-4 pt-4"}>
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
          className={`text-[13.5px] text-spark-ink-50 max-w-[560px] ${desktop ? "mt-1.5 mb-6" : "mb-5"}`}
        >
          Cada agente é uma especialista no seu nicho. Conversa direto no ChatGPT ou Gemini, sem
          custo extra. Depois salva os resultados aqui pra ter tudo organizado. 💕
        </p>

        <HowItWorksBox />

        <div className="space-y-7">
          {order.map((cat) => {
            const items = groups[cat];
            if (items.length === 0) return null;
            const meta = CATEGORY_LABELS[cat];
            return (
              <section key={cat}>
                <div className="mb-3 px-1">
                  <h2 className="text-[15px] font-extrabold text-spark-ink tracking-tight">
                    {meta.label}
                  </h2>
                  <p className="text-[12px] text-spark-ink-50 mt-0.5 leading-snug">
                    {meta.description}
                  </p>
                </div>
                <div className={`grid gap-3 ${desktop ? "grid-cols-2" : "grid-cols-1"}`}>
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
