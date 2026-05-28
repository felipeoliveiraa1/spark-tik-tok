"use client";

import * as React from "react";
import { ExternalLink, Sparkles, ChevronDown, ChevronsDown } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/cn";
import {
  AGENTS_CATALOG,
  type AgentCatalogItem,
} from "@/lib/agents-catalog";

/**
 * Página /agentes — portal central dos GPTs/Gems externos.
 *
 * UX: scroll-snap-y feed estilo TikTok. Cada agente ocupa a tela
 * inteira (snap-mandatory). Mesma experiência em mobile e desktop —
 * só muda o tamanho do conteúdo (mais largo no desktop).
 *
 * Plataforma (ChatGPT | Gemini) salva em localStorage. Cada card
 * mostra só o botão da plataforma escolhida.
 */

type Platform = "chatgpt" | "gemini";

const PLATFORM_STORAGE_KEY = "tts:agentes:platform";

function usePersistedPlatform(): [Platform, (p: Platform) => void] {
  const [platform, setPlatform] = React.useState<Platform>("chatgpt");
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

/**
 * Observa qual elemento de uma lista está MAIS visível no viewport
 * (≥ 50% visível). Usado pelos dots de progresso e pra acionar
 * animações quando o slide entra em foco.
 */
function useActiveSlide(slugs: string[], rootRef?: React.RefObject<HTMLElement | null>) {
  const [active, setActive] = React.useState<string>(slugs[0] ?? "");
  const refs = React.useRef<Map<string, HTMLElement | null>>(new Map());

  const setRef = React.useCallback(
    (slug: string) => (el: HTMLElement | null) => {
      refs.current.set(slug, el);
    },
    [],
  );

  React.useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const slug = (visible.target as HTMLElement).dataset.slug;
          if (slug) setActive(slug);
        }
      },
      {
        root: rootRef?.current ?? null,
        threshold: [0.5, 0.6, 0.7],
      },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [slugs, rootRef]);

  return { active, setRef };
}

// =================================================================
// Tabs ChatGPT | Gemini
// =================================================================

function PlatformTabs({
  platform,
  onChange,
  className,
  size = "md",
}: {
  platform: Platform;
  onChange: (p: Platform) => void;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-spark-surface border border-spark-hairline p-1 flex gap-1",
        className,
      )}
    >
      <TabButton
        active={platform === "chatgpt"}
        onClick={() => onChange("chatgpt")}
        ariaLabel="Selecionar ChatGPT"
        size={size}
      >
        <span className={size === "lg" ? "text-[16px]" : "text-[14px]"}>💬</span>
        <span>ChatGPT</span>
      </TabButton>
      <TabButton
        active={platform === "gemini"}
        onClick={() => onChange("gemini")}
        ariaLabel="Selecionar Gemini"
        size={size}
      >
        <span className={size === "lg" ? "text-[16px]" : "text-[14px]"}>✨</span>
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
  size,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  size: "md" | "lg";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition-all",
        size === "lg" ? "px-5 py-3 text-[15px]" : "px-4 py-2.5 text-[13px]",
        active
          ? "bg-brand-grad text-white shadow-[0_4px_14px_-6px_oklch(0.55_0.24_340/0.5)]"
          : "text-spark-ink-50 hover:text-spark-ink hover:bg-spark-surface-sunken/60",
      )}
    >
      {children}
    </button>
  );
}

// =================================================================
// CTA — varia por plataforma
// =================================================================

function PlatformCta({
  url,
  otherUrl,
  platform,
  size = "md",
}: {
  url: string | null;
  otherUrl: string | null;
  platform: Platform;
  size?: "md" | "lg";
}) {
  const otherLabel = platform === "chatgpt" ? "Gemini" : "ChatGPT";
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "w-full inline-flex items-center justify-center gap-2 rounded-2xl text-white font-extrabold active:scale-95 transition-transform shadow-[0_8px_24px_-12px_rgba(20,20,40,0.3)]",
          size === "lg" ? "px-6 py-4 text-[15px]" : "px-5 py-3.5 text-[14px]",
          platform === "chatgpt"
            ? "bg-[#10a37f]"
            : "bg-gradient-to-r from-blue-500 to-purple-500",
        )}
      >
        Abrir no {platform === "chatgpt" ? "ChatGPT" : "Gemini"}
        <ExternalLink size={size === "lg" ? 15 : 13} strokeWidth={2.5} />
      </a>
    );
  }
  if (otherUrl) {
    return (
      <div
        className={cn(
          "rounded-2xl bg-spark-surface-sunken/60 px-4 text-center text-spark-ink-50 leading-snug",
          size === "lg" ? "py-4 text-[13px]" : "py-3 text-[12px]",
        )}
      >
        Ainda não tem no {platform === "chatgpt" ? "ChatGPT" : "Gemini"}, mas tá rolando no{" "}
        <strong>{otherLabel}</strong> 💕
      </div>
    );
  }
  return (
    <div
      className={cn(
        "text-center text-spark-ink-50 rounded-2xl bg-spark-surface-sunken/60",
        size === "lg" ? "py-4 text-[13px]" : "py-3 text-[12px]",
      )}
    >
      Liberamos nas próximas semanas 💕
    </div>
  );
}

// =================================================================
// Slide individual de agente — funciona em mobile e desktop
// =================================================================

function AgentSlide({
  agent,
  platform,
  setRef,
  index,
  total,
  desktop,
  isActive,
}: {
  agent: AgentCatalogItem;
  platform: Platform;
  setRef: (el: HTMLElement | null) => void;
  index: number;
  total: number;
  desktop: boolean;
  isActive: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const url = platform === "chatgpt" ? agent.chatgptUrl : agent.geminiUrl;
  const otherUrl = platform === "chatgpt" ? agent.geminiUrl : agent.chatgptUrl;
  const hasLinkAtAll = !!agent.chatgptUrl || !!agent.geminiUrl;

  return (
    <section
      ref={setRef}
      data-slug={agent.slug}
      className={cn(
        "snap-start snap-always min-h-full flex justify-center",
        desktop ? "py-12 px-12" : "px-4 py-4",
      )}
      aria-label={`${agent.name} (${index + 1} de ${total})`}
    >
      <div
        className={cn(
          "w-full flex flex-col gap-4 transition-all duration-700 ease-out",
          desktop ? "max-w-[680px] gap-6" : "gap-3",
          isActive ? "opacity-100 scale-100" : "opacity-60 scale-[0.97]",
        )}
      >
        {/* HERO */}
        <div
          className={cn(
            "relative rounded-[28px] overflow-hidden bg-gradient-to-br shrink-0",
            agent.accent,
          )}
          style={{ aspectRatio: desktop ? "16/10" : "4/3" }}
        >
          {agent.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agent.imageUrl}
              alt={agent.name}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out",
                isActive ? "scale-100" : "scale-105",
              )}
            />
          ) : (
            <>
              <div
                className="absolute inset-0 opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 75% 70%, rgba(255,255,255,0.3) 0%, transparent 40%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={cn(
                    "drop-shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform duration-700",
                    desktop ? "text-[180px]" : "text-[140px]",
                    isActive ? "scale-100" : "scale-90",
                  )}
                >
                  {agent.emoji}
                </span>
              </div>
            </>
          )}

          <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm font-extrabold text-spark-ink tracking-tight shadow-sm",
                desktop ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-1 text-[10.5px]",
              )}
            >
              {agent.emoji} {agent.chip ?? agent.name}
            </span>
            <span
              className={cn(
                "font-extrabold text-white/95 rounded-full bg-black/30 backdrop-blur-sm",
                desktop ? "px-3 py-1.5 text-[11px]" : "px-2 py-1 text-[10px]",
              )}
            >
              {index + 1}/{total}
            </span>
          </div>

          {!hasLinkAtAll && (
            <div className="absolute bottom-4 right-4">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full bg-spark-ink/80 backdrop-blur-sm font-bold text-white uppercase tracking-wider",
                  desktop ? "px-3 py-1.5 text-[11px]" : "px-2.5 py-1 text-[10px]",
                )}
              >
                Em breve
              </span>
            </div>
          )}
        </div>

        {/* TEXTO */}
        <div className="flex-1 flex flex-col min-h-0">
          <h2
            className={cn(
              "font-extrabold text-spark-ink tracking-tight leading-tight",
              desktop ? "text-[30px]" : "text-[22px]",
            )}
          >
            {agent.name}
          </h2>
          <p
            className={cn(
              "text-spark-ink-70 leading-snug",
              desktop ? "mt-2.5 text-[15.5px]" : "mt-2 text-[14px]",
            )}
          >
            {agent.shortDescription}
          </p>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className={cn(
              "-mx-1 px-1 inline-flex items-center gap-1.5 font-bold text-spark-brand hover:text-spark-brand-deep transition-colors w-fit",
              desktop ? "mt-3 text-[13px]" : "mt-2.5 text-[12px]",
            )}
          >
            {expanded ? "Esconder" : "Como funciona"}
            <ChevronDown
              size={desktop ? 14 : 13}
              strokeWidth={2.5}
              className={cn("transition-transform duration-200", expanded && "rotate-180")}
            />
          </button>
          {expanded && (
            <div
              className={cn(
                "rounded-2xl bg-spark-surface-sunken/70 text-spark-ink-70 leading-relaxed",
                desktop ? "mt-3 px-4 py-3.5 text-[14px]" : "mt-2 px-3.5 py-3 text-[12.5px]",
              )}
            >
              {agent.howItWorks}
            </div>
          )}

          <div className={cn("mt-auto", desktop ? "pt-6" : "pt-4")}>
            <PlatformCta
              url={url}
              otherUrl={otherUrl}
              platform={platform}
              size={desktop ? "lg" : "md"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// =================================================================
// Slide de intro (primeiro do feed)
// =================================================================

function IntroSlide({
  platform,
  onChangePlatform,
  totalAgents,
  count,
  setRef,
  desktop,
}: {
  platform: Platform;
  onChangePlatform: (p: Platform) => void;
  totalAgents: number;
  count: number;
  setRef: (el: HTMLElement | null) => void;
  desktop: boolean;
}) {
  return (
    <section
      ref={setRef}
      data-slug="__intro"
      className={cn(
        "snap-start snap-always min-h-full flex justify-center",
        desktop ? "py-12 px-12" : "px-4 py-4",
      )}
    >
      <div
        className={cn(
          "w-full flex flex-col",
          desktop ? "max-w-[680px] gap-6" : "gap-4",
        )}
      >
        {/* Hero box "Agentes Yara" */}
        <div
          className={cn(
            "relative rounded-[28px] bg-brand-grad-hero text-white overflow-hidden shadow-[0_12px_32px_-16px_oklch(0.55_0.24_340/0.45)] shrink-0",
            desktop ? "p-7" : "p-5",
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
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className={cn(
                  "rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center",
                  desktop ? "w-12 h-12" : "w-10 h-10",
                )}
              >
                <Sparkles
                  size={desktop ? 20 : 17}
                  strokeWidth={2.2}
                  className="text-white"
                />
              </div>
              <h2
                className={cn(
                  "font-extrabold tracking-tight",
                  desktop ? "text-[22px]" : "text-[17px]",
                )}
              >
                Agentes Yara ✨
              </h2>
            </div>
            <p
              className={cn(
                "text-white/95 leading-snug",
                desktop ? "text-[15.5px]" : "text-[13px]",
              )}
            >
              Cada agente é uma especialista no seu nicho. Conversa direto no ChatGPT ou Gemini,
              sem custo extra, e cola os resultados aqui no app pra ter tudo organizadinho 💕
            </p>
          </div>
        </div>

        <PlatformTabs
          platform={platform}
          onChange={onChangePlatform}
          size={desktop ? "lg" : "md"}
        />

        <div
          className={cn(
            "rounded-2xl bg-spark-surface border border-spark-hairline",
            desktop ? "p-5" : "p-4",
          )}
        >
          <h3
            className={cn(
              "font-extrabold text-spark-ink mb-3",
              desktop ? "text-[15px]" : "text-[13px]",
            )}
          >
            Como funciona
          </h3>
          <ol
            className={cn(
              "space-y-2 text-spark-ink-70 leading-relaxed",
              desktop ? "text-[14px]" : "text-[12.5px]",
            )}
          >
            <li className="flex gap-2.5">
              <span className="font-extrabold text-spark-brand shrink-0">1.</span>
              <span>Escolhe a plataforma que você usa (ChatGPT ou Gemini) acima.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="font-extrabold text-spark-brand shrink-0">2.</span>
              <span>Desliza pra baixo e escolhe o agente do seu nicho.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="font-extrabold text-spark-brand shrink-0">3.</span>
              <span>
                Cola a ficha em <strong>📦 Produtos</strong> ou os roteiros em{" "}
                <strong>✍️ Scripts</strong> aqui no app.
              </span>
            </li>
          </ol>
        </div>

        <div
          className={cn(
            "text-spark-ink-50 text-center",
            desktop ? "text-[13px]" : "text-[11.5px]",
          )}
        >
          {count} de {totalAgents} agentes disponíveis no{" "}
          <strong className="text-spark-ink">
            {platform === "chatgpt" ? "ChatGPT" : "Gemini"}
          </strong>
        </div>

        <div className="mt-auto flex flex-col items-center gap-1 text-spark-ink-50">
          <span
            className={cn(
              "font-bold uppercase tracking-[0.1em]",
              desktop ? "text-[12px]" : "text-[11px]",
            )}
          >
            desliza pra ver
          </span>
          <ChevronsDown
            size={desktop ? 22 : 20}
            strokeWidth={2.2}
            className="animate-bounce"
          />
        </div>
      </div>
    </section>
  );
}

// =================================================================
// Dots laterais de progresso
// =================================================================

function ScrollDots({
  slugs,
  active,
  desktop,
}: {
  slugs: string[];
  active: string;
  desktop: boolean;
}) {
  return (
    <div
      className={cn(
        "fixed top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 pointer-events-none",
        desktop ? "right-6" : "right-2",
      )}
      aria-hidden
    >
      {slugs.map((slug) => (
        <div
          key={slug}
          className={cn(
            "rounded-full transition-all duration-300",
            active === slug
              ? desktop
                ? "w-2 h-8 bg-spark-brand"
                : "w-1.5 h-6 bg-spark-brand"
              : desktop
                ? "w-2 h-2 bg-spark-ink-35"
                : "w-1.5 h-1.5 bg-spark-ink-35",
          )}
        />
      ))}
    </div>
  );
}

// =================================================================
// Container do feed (mobile + desktop)
// =================================================================

function AgentesFeed({
  platform,
  onChangePlatform,
  desktop,
}: {
  platform: Platform;
  onChangePlatform: (p: Platform) => void;
  desktop: boolean;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const count = React.useMemo(
    () =>
      AGENTS_CATALOG.reduce((acc, a) => {
        const url = platform === "chatgpt" ? a.chatgptUrl : a.geminiUrl;
        return url ? acc + 1 : acc;
      }, 0),
    [platform],
  );

  const slugsWithIntro = React.useMemo(
    () => ["__intro", ...AGENTS_CATALOG.map((a) => a.slug)],
    [],
  );
  const { active, setRef } = useActiveSlide(slugsWithIntro, scrollRef);

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory overscroll-contain scroll-smooth"
      >
        <IntroSlide
          platform={platform}
          onChangePlatform={onChangePlatform}
          totalAgents={AGENTS_CATALOG.length}
          count={count}
          setRef={setRef("__intro")}
          desktop={desktop}
        />
        {AGENTS_CATALOG.map((agent, idx) => (
          <AgentSlide
            key={agent.slug}
            agent={agent}
            platform={platform}
            setRef={setRef(agent.slug)}
            index={idx}
            total={AGENTS_CATALOG.length}
            desktop={desktop}
            isActive={active === agent.slug}
          />
        ))}
      </div>
      <ScrollDots slugs={slugsWithIntro} active={active} desktop={desktop} />
    </>
  );
}

// =================================================================
// PAGE
// =================================================================

function AgentesMobile() {
  const [platform, setPlatform] = usePersistedPlatform();
  return (
    <>
      <MobileHeader title="Agentes ✨" back={{ href: "/" }} />
      <AgentesFeed platform={platform} onChangePlatform={setPlatform} desktop={false} />
      <BottomNav active="chat" />
    </>
  );
}

function AgentesDesktop() {
  const [platform, setPlatform] = usePersistedPlatform();
  return <AgentesFeed platform={platform} onChangePlatform={setPlatform} desktop={true} />;
}

export default function AgentesPage() {
  return <ResponsiveShell mobile={<AgentesMobile />} desktop={<AgentesDesktop />} active="chat" />;
}
