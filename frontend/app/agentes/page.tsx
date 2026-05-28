"use client";

import * as React from "react";
import { ExternalLink, Sparkles, ChevronDown } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/cn";
import {
  AGENTS_CATALOG,
  CATEGORY_LABELS,
  groupByCategory,
  type AgentCatalogItem,
} from "@/lib/agents-catalog";

/**
 * Página /agentes — portal central dos GPTs/Gems externos.
 *
 * UX:
 *   - 2 abas no topo: ChatGPT | Gemini. Aluna escolhe a plataforma
 *     que ela tem conta e cada card mostra só o botão dela. Preferência
 *     salva em localStorage pra não precisar reclicar.
 *   - Box "Como funciona" explica o fluxo do método em 4 passos.
 *   - Cada agente é um card "magazine" com hero (imagem ou gradient +
 *     emoji), chip flutuante, descrição e accordion "Como funciona".
 *   - Quando o agente não tem link na plataforma escolhida, mostra
 *     "Em breve nessa plataforma" + atalho pra outra (se tiver).
 */

type Platform = "chatgpt" | "gemini";

const PLATFORM_STORAGE_KEY = "tts:agentes:platform";

/**
 * Observa quando um elemento entra no viewport.
 * Retorna {ref, isVisible}. Visibilidade é "one-way" — uma vez visível,
 * marca como tal e não volta pra escondido (evita flash quando aluna
 * rola pra cima/pra baixo).
 */
function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = React.useRef<T | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Se navegador não suporta IO ou usuário pediu reduce-motion, já mostra
    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -50px 0px", threshold: 0.1, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}

function usePersistedPlatform(): [Platform, (p: Platform) => void] {
  const [platform, setPlatform] = React.useState<Platform>("chatgpt");
  // Hidrata do localStorage só no client (SSR seguro)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(PLATFORM_STORAGE_KEY);
      if (saved === "chatgpt" || saved === "gemini") setPlatform(saved);
    } catch {
      // ignora — modo privado etc.
    }
  }, []);
  const update = React.useCallback((p: Platform) => {
    setPlatform(p);
    try {
      localStorage.setItem(PLATFORM_STORAGE_KEY, p);
    } catch {
      // ignora
    }
  }, []);
  return [platform, update];
}

function PlatformTabs({
  platform,
  onChange,
}: {
  platform: Platform;
  onChange: (p: Platform) => void;
}) {
  return (
    <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-1 flex gap-1 mb-6">
      <TabButton
        active={platform === "chatgpt"}
        onClick={() => onChange("chatgpt")}
        ariaLabel="Selecionar ChatGPT"
      >
        <span className="text-[14px]">💬</span>
        <span>ChatGPT</span>
      </TabButton>
      <TabButton
        active={platform === "gemini"}
        onClick={() => onChange("gemini")}
        ariaLabel="Selecionar Gemini"
      >
        <span className="text-[14px]">✨</span>
        <span>Gemini</span>
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
  ariaLabel,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-extrabold transition-all",
        active
          ? "bg-brand-grad text-white shadow-[0_4px_14px_-6px_oklch(0.55_0.24_340/0.5)]"
          : "text-spark-ink-50 hover:text-spark-ink hover:bg-spark-surface-sunken/60",
      )}
    >
      {children}
    </button>
  );
}

function AgentCard({
  agent,
  platform,
  index,
}: {
  agent: AgentCatalogItem;
  platform: Platform;
  /** Posição dentro do grid pra escalonar o delay da entrada. */
  index: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const { ref, isVisible } = useInView<HTMLElement>();
  const url = platform === "chatgpt" ? agent.chatgptUrl : agent.geminiUrl;
  const otherUrl = platform === "chatgpt" ? agent.geminiUrl : agent.chatgptUrl;
  const otherLabel = platform === "chatgpt" ? "Gemini" : "ChatGPT";
  const hasLinkAtAll = !!agent.chatgptUrl || !!agent.geminiUrl;

  // Stagger: cada card entra 80ms depois do anterior, capped em 320ms
  // pra não atrasar demais quando tem muitos.
  const delay = Math.min(index * 80, 320);

  return (
    <article
      ref={ref}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
      className={cn(
        "group rounded-3xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-[0_2px_10px_-6px_rgba(20,20,40,0.06)] hover:shadow-[0_12px_32px_-12px_rgba(20,20,40,0.18)] hover:border-spark-brand/30 flex flex-col",
        "transition-all duration-700 ease-out will-change-transform",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6",
      )}
    >
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
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 35%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 35%)",
              }}
            />
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

        {/* Status "Em breve" se nenhum link existe ainda */}
        {!hasLinkAtAll && (
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
          className="mt-3 -mx-1 px-1 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-spark-brand hover:text-spark-brand-deep transition-colors w-fit"
        >
          {expanded ? "Esconder" : "Como funciona"}
          <ChevronDown
            size={12}
            strokeWidth={2.5}
            className={cn("transition-transform duration-200", expanded && "rotate-180")}
          />
        </button>
        {expanded && (
          <div className="mt-2 rounded-xl bg-spark-surface-sunken/60 px-3 py-2.5 text-[12px] text-spark-ink-70 leading-relaxed">
            {agent.howItWorks}
          </div>
        )}

        {/* CTA — só botão da plataforma selecionada */}
        <div className="mt-auto pt-4">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-[13px] font-extrabold active:scale-95 transition-transform",
                platform === "chatgpt"
                  ? "bg-[#10a37f]"
                  : "bg-gradient-to-r from-blue-500 to-purple-500",
              )}
            >
              Abrir no {platform === "chatgpt" ? "ChatGPT" : "Gemini"}
              <ExternalLink size={12} strokeWidth={2.5} />
            </a>
          ) : otherUrl ? (
            <div className="rounded-xl bg-spark-surface-sunken/60 px-3 py-3 text-center">
              <div className="text-[11.5px] text-spark-ink-50 leading-snug">
                Ainda não tem no {platform === "chatgpt" ? "ChatGPT" : "Gemini"}, mas tá rolando no{" "}
                <strong>{otherLabel}</strong> 💕
              </div>
            </div>
          ) : (
            <div className="text-center text-[11.5px] text-spark-ink-50 py-3 rounded-xl bg-spark-surface-sunken/60">
              Liberamos nas próximas semanas 💕
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function HowItWorksBox() {
  const { ref, isVisible } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-3xl bg-brand-grad-hero text-white p-5 mb-5 overflow-hidden shadow-[0_12px_32px_-16px_oklch(0.55_0.24_340/0.45)]",
        "transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
    >
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
              <span>Escolhe a plataforma que você usa (ChatGPT ou Gemini) na aba acima.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-extrabold opacity-80 shrink-0">2.</span>
              <span>Clica no agente do seu nicho — abre na plataforma e você conversa com ela.</span>
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
  const [platform, setPlatform] = usePersistedPlatform();
  const groups = React.useMemo(() => groupByCategory(AGENTS_CATALOG), []);
  const order: Array<keyof typeof groups> = ["info", "scripts", "suporte"];

  // Conta quantos têm link em cada plataforma pra mostrar no chip da tab
  const counts = React.useMemo(() => {
    return AGENTS_CATALOG.reduce(
      (acc, a) => {
        if (a.chatgptUrl) acc.chatgpt += 1;
        if (a.geminiUrl) acc.gemini += 1;
        return acc;
      },
      { chatgpt: 0, gemini: 0 },
    );
  }, []);

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

        <PlatformTabs platform={platform} onChange={setPlatform} />

        <div className="mb-6 text-[11.5px] text-spark-ink-50 px-1">
          Mostrando agentes do{" "}
          <strong className="text-spark-ink">
            {platform === "chatgpt" ? "ChatGPT" : "Gemini"}
          </strong>{" "}
          ({counts[platform]} de {AGENTS_CATALOG.length} disponíveis).
        </div>

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
                  {items.map((agent, idx) => (
                    <AgentCard
                      key={agent.slug}
                      agent={agent}
                      platform={platform}
                      index={idx}
                    />
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
