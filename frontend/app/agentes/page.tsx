"use client";

import * as React from "react";
import { ArrowUpRight, ChevronDown, ChevronsDown, ExternalLink, HelpCircle, Sparkles } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { SplashScreen } from "@/components/atoms/splash-screen";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { CharacterReveal } from "@/components/atoms/character-reveal";
import { cn } from "@/lib/cn";
import { VISIBLE_AGENTS_CATALOG, type AgentCatalogItem } from "@/lib/agents-catalog";
import { TutorialOverlay } from "@/components/molecules/tutorial-overlay";
import { type TutorialStep } from "@/lib/tutorial";

/**
 * /agentes — vitrine premium magazine das especialistas externas (ChatGPT
 * GPTs + Gemini Gems). Refatorada pra dar a mesma sensação UAU da home.
 *
 * Estrutura cinematográfica (scroll-snap-y mandatory):
 *   • Splash de entrada
 *   • Intro slide: hero radial + blobs + sparkles + sticker + Tanker
 *     gigante "fala / com elas." + platform tabs + scroll indicator
 *   • Um slide por agente: hero image dramática, eyebrow + Tanker name,
 *     descrição, CTA premium, hover-lift, "Como funciona" expandível
 *   • FloatingMainNav lateral
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
      // ignora
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
 * Observa qual slide do feed scroll-snap está em foco no viewport.
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
// PLATFORM TABS — premium pill
// =================================================================

function PlatformTabs({
  platform,
  onChange,
  className,
}: {
  platform: Platform;
  onChange: (p: Platform) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1.5 rounded-full glass shadow-rest",
        className,
      )}
    >
      <TabButton active={platform === "chatgpt"} onClick={() => onChange("chatgpt")} label="ChatGPT" emoji="💬" />
      <TabButton active={platform === "gemini"} onClick={() => onChange("gemini")} label="Gemini" emoji="✨" />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  emoji,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  emoji: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-extrabold tracking-tight",
        "transition-all duration-300 ease-premium active:scale-95",
        active
          ? "bg-spark-ink text-white shadow-lift"
          : "text-spark-ink-70 hover:bg-spark-surface-sunken/60 hover:text-spark-ink",
      )}
    >
      <span className="text-[15px]">{emoji}</span>
      {label}
    </button>
  );
}

// =================================================================
// CTA por plataforma
// =================================================================

function PlatformCta({
  url,
  otherUrl,
  platform,
  large = false,
}: {
  url: string | null;
  otherUrl: string | null;
  platform: Platform;
  large?: boolean;
}) {
  const otherLabel = platform === "chatgpt" ? "Gemini" : "ChatGPT";

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition-all duration-300 ease-premium",
          "hover:-translate-y-0.5 active:translate-y-0 shadow-lift",
          large ? "px-8 py-5 text-[15px]" : "px-6 py-4 text-[13.5px]",
          platform === "chatgpt"
            ? "bg-[#10a37f] text-white hover:shadow-[0_20px_40px_-20px_rgba(16,163,127,0.55)]"
            : "text-white",
        )}
        style={
          platform === "gemini"
            ? {
                background:
                  "linear-gradient(135deg, oklch(0.6 0.18 250), oklch(0.55 0.22 310))",
              }
            : undefined
        }
      >
        Abrir no {platform === "chatgpt" ? "ChatGPT" : "Gemini"}
        <ArrowUpRight
          size={large ? 16 : 14}
          strokeWidth={2.5}
          className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>
    );
  }

  if (otherUrl) {
    return (
      <div
        className={cn(
          "rounded-full glass border border-spark-hairline text-spark-ink-70 text-center leading-snug",
          large ? "px-6 py-4 text-[13.5px]" : "px-5 py-3.5 text-[12.5px]",
        )}
      >
        Por enquanto só no <strong className="text-spark-ink">{otherLabel}</strong> 💕
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full glass border border-spark-hairline text-spark-ink-50 text-center",
        large ? "px-6 py-4 text-[13.5px]" : "px-5 py-3.5 text-[12.5px]",
      )}
    >
      Em breve 💕
    </div>
  );
}

// =================================================================
// INTRO SLIDE — hero magazine
// =================================================================

function IntroSlide({
  platform,
  onChangePlatform,
  totalAgents,
  count,
  setRef,
  desktop,
  onReopenTour,
}: {
  platform: Platform;
  onChangePlatform: (p: Platform) => void;
  totalAgents: number;
  count: number;
  setRef: (el: HTMLElement | null) => void;
  desktop: boolean;
  onReopenTour: () => void;
}) {
  return (
    <section
      ref={setRef}
      data-slug="__intro"
      className={cn(
        "snap-start snap-always min-h-full relative overflow-hidden hero-radial",
        "flex items-center justify-center",
      )}
    >
      {/* Blobs decorativos */}
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="peach" variant={2} className="top-20 -right-40 w-[520px] h-[520px]" />
      <HeroBlob color="lilac" variant={3} className="bottom-0 left-1/3 w-[400px] h-[400px]" />

      {/* Sparkles */}
      <SparkleField count={16} seed={91} className="opacity-70" />

      {/* Botão Tour — top-right */}
      <div
        className="absolute z-10"
        style={{
          top: desktop ? "24px" : "calc(env(safe-area-inset-top) + 12px)",
          right: desktop ? "48px" : "16px",
        }}
      >
        <button
          type="button"
          onClick={onReopenTour}
          className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass border border-spark-hairline text-spark-ink-70 hover:text-spark-brand-deep hover:bg-spark-brand-soft hover:-translate-y-0.5 text-[11.5px] font-extrabold uppercase tracking-widest shadow-rest transition-all duration-300 ease-premium"
          aria-label="Refazer tour de agentes"
        >
          <HelpCircle
            size={13}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <span className="hidden sm:inline">Tour</span>
        </button>
      </div>

      <div className={cn("relative w-full", desktop ? "max-w-[1100px] mx-auto px-12" : "px-5 py-10")}>
        {/* Top row: eyebrow + sticker */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <SectionReveal direction="down" durationMs={600}>
            <div data-tutorial-id="agentes-intro">
              <div className="text-eyebrow text-spark-brand-deep">
                ✦ {totalAgents} especialistas
              </div>
              <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[28ch] font-semibold">
                Cada nicho com sua expert. Conversa direto no ChatGPT ou Gemini.
              </div>
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={200}>
              <Sticker
                text="AGENTES TTS · 2026 · "
                emoji="✨"
                size={126}
              />
            </SectionReveal>
          )}
        </div>

        {/* Headline gigante TANKER */}
        <SectionReveal direction="up" delay={150} durationMs={900}>
          <h1
            className="font-display lowercase leading-[0.9] tracking-tight max-w-[14ch]"
            style={{ fontSize: "clamp(2.5rem, 9vw, 8rem)" }}
          >
            <CharacterReveal
              as="span"
              immediate
              staggerMs={28}
              className="block text-spark-ink"
            >
              fala
            </CharacterReveal>
            <CharacterReveal
              as="span"
              immediate
              staggerMs={28}
              delayMs={350}
              className="block"
              charClassName="text-grad-brand"
            >
              com elas.
            </CharacterReveal>
          </h1>
        </SectionReveal>

        {/* Tabs */}
        <SectionReveal direction="up" delay={750}>
          <div data-tutorial-id="agentes-tabs" className="mt-10 flex items-center gap-4 flex-wrap">
            <PlatformTabs platform={platform} onChange={onChangePlatform} />
            <span className="text-[12.5px] text-spark-ink-50 font-semibold">
              <strong className="text-spark-ink">{count}</strong> de {totalAgents} já no{" "}
              <strong className="text-spark-ink">{platform === "chatgpt" ? "ChatGPT" : "Gemini"}</strong>
            </span>
          </div>
        </SectionReveal>

        {/* Como funciona — 3 passos */}
        <SectionReveal direction="up" delay={900}>
          <div
            data-tutorial-id="agentes-how"
            className={cn(
              "mt-10 rounded-spark-2xl glass border border-spark-hairline p-6 sm:p-7",
            )}
          >
            <div className="text-eyebrow text-spark-brand mb-4">✦ como funciona</div>
            <ol className="grid sm:grid-cols-3 gap-5 text-[13.5px] text-spark-ink-70 leading-snug">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-grad text-white text-[12px] font-extrabold flex items-center justify-center shadow-lift-brand">
                  1
                </span>
                <span>
                  <strong className="text-spark-ink">Escolha</strong> a plataforma que você usa
                  acima.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-grad text-white text-[12px] font-extrabold flex items-center justify-center shadow-lift-brand">
                  2
                </span>
                <span>
                  <strong className="text-spark-ink">Deslize</strong> e abra o agente do seu
                  nicho.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-grad text-white text-[12px] font-extrabold flex items-center justify-center shadow-lift-brand">
                  3
                </span>
                <span>
                  <strong className="text-spark-ink">Cole</strong> o que ela gerou em Produtos
                  ou Scripts.
                </span>
              </li>
            </ol>
          </div>
        </SectionReveal>

        {/* Scroll indicator */}
        <SectionReveal delay={1100}>
          <div
            data-tutorial-id="agentes-scroll"
            className="mt-10 flex flex-col items-center gap-1 text-spark-ink-50"
          >
            <span className="text-eyebrow">desliza pra ver</span>
            <ChevronsDown size={20} strokeWidth={2.2} className="animate-bounce" />
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// AGENT SLIDE — card editorial magazine
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
        "snap-start snap-always min-h-full relative overflow-hidden",
        "flex items-center justify-center",
      )}
      aria-label={`${agent.name} (${index + 1} de ${total})`}
    >
      {/* Background sutil baseado no accent do agente */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-30",
          agent.accent,
        )}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,255,255,0.7), transparent 70%)",
        }}
      />

      <div
        className={cn(
          "relative w-full grid gap-8 transition-all duration-700 ease-premium",
          desktop ? "max-w-[1100px] mx-auto px-12 grid-cols-2 py-16" : "px-5 py-10 grid-cols-1",
          isActive ? "opacity-100 scale-100" : "opacity-70 scale-[0.98]",
        )}
      >
        {/* HERO IMAGE / VISUAL */}
        <div className={cn("relative", desktop ? "" : "order-1")}>
          <div
            className={cn(
              "relative rounded-spark-3xl overflow-hidden bg-gradient-to-br shadow-hero",
              agent.accent,
            )}
            style={{ aspectRatio: desktop ? "4/5" : "4/3" }}
          >
            {agent.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.imageUrl}
                alt={agent.name}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-premium",
                  isActive ? "scale-100" : "scale-105",
                )}
              />
            ) : (
              <>
                <div
                  className="absolute inset-0 opacity-30 mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.45) 0%, transparent 40%), radial-gradient(circle at 75% 70%, rgba(255,255,255,0.3) 0%, transparent 40%)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={cn(
                      "drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform duration-1000 ease-premium",
                      desktop ? "text-[220px]" : "text-[160px]",
                      isActive ? "scale-100" : "scale-90",
                    )}
                  >
                    {agent.emoji}
                  </span>
                </div>
              </>
            )}

            {/* Chip flutuante */}
            <div className="absolute top-5 left-5 right-5 flex items-start justify-between gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full glass font-extrabold text-spark-ink tracking-tight",
                  desktop ? "px-4 py-2 text-[12px]" : "px-3 py-1.5 text-[11px]",
                )}
              >
                {agent.emoji} {agent.chip ?? agent.name}
              </span>
              <span className="text-[10.5px] font-extrabold text-white/95 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                {index + 1}/{total}
              </span>
            </div>

            {!hasLinkAtAll && (
              <div className="absolute bottom-5 right-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-ink/85 backdrop-blur text-white text-[10.5px] font-extrabold tracking-widest uppercase">
                  Em breve
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className={cn("flex flex-col justify-center", desktop ? "" : "order-2")}>
          <div className="text-eyebrow text-spark-brand mb-3">
            ✦ {index + 1} de {total}
          </div>
          <h2
            className="font-display lowercase leading-[0.92] tracking-tight text-spark-ink"
            style={{ fontSize: desktop ? "clamp(2.5rem, 4.5vw, 4.5rem)" : "clamp(2rem, 8vw, 3rem)" }}
          >
            {agent.name.toLowerCase()}
          </h2>

          <p
            className={cn(
              "mt-5 text-spark-ink-70 leading-snug max-w-[44ch]",
              desktop ? "text-fluid-lead" : "text-fluid-body",
            )}
          >
            {agent.shortDescription}
          </p>

          {/* Expansível "Como funciona" */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-5 -mx-1 px-1 inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-spark-brand-deep hover:text-spark-brand transition-colors duration-300 w-fit"
          >
            {expanded ? "esconder" : "como funciona"}
            <ChevronDown
              size={13}
              strokeWidth={2.5}
              className={cn(
                "transition-transform duration-300",
                expanded && "rotate-180",
              )}
            />
          </button>
          {expanded && (
            <SectionReveal>
              <div className="mt-3 rounded-2xl bg-spark-surface-sunken/70 backdrop-blur-sm px-4 py-3.5 text-[13px] text-spark-ink-70 leading-relaxed max-w-[44ch]">
                {agent.howItWorks}
              </div>
            </SectionReveal>
          )}

          {/* CTA */}
          <div className="mt-8 sm:mt-10 max-w-[320px]">
            <PlatformCta url={url} otherUrl={otherUrl} platform={platform} large />
          </div>
        </div>
      </div>
    </section>
  );
}

// =================================================================
// SCROLL DOTS
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
        "fixed top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5 pointer-events-none",
        // Desktop: right side, evitando colidir com FloatingMainNav (que ficou à esquerda)
        desktop ? "right-8" : "right-2",
      )}
      aria-hidden
    >
      {slugs.map((slug) => (
        <div
          key={slug}
          className={cn(
            "rounded-full transition-all duration-500 ease-premium",
            active === slug
              ? desktop
                ? "w-2 h-8 bg-spark-brand"
                : "w-1.5 h-7 bg-spark-brand"
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
// FEED CONTAINER
// =================================================================

function AgentesFeed({
  platform,
  onChangePlatform,
  desktop,
  onReopenTour,
}: {
  platform: Platform;
  onChangePlatform: (p: Platform) => void;
  desktop: boolean;
  onReopenTour: () => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const count = React.useMemo(
    () =>
      VISIBLE_AGENTS_CATALOG.reduce((acc, a) => {
        const url = platform === "chatgpt" ? a.chatgptUrl : a.geminiUrl;
        return url ? acc + 1 : acc;
      }, 0),
    [platform],
  );

  const slugsWithIntro = React.useMemo(
    () => ["__intro", ...VISIBLE_AGENTS_CATALOG.map((a) => a.slug)],
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
          totalAgents={VISIBLE_AGENTS_CATALOG.length}
          count={count}
          setRef={setRef("__intro")}
          desktop={desktop}
          onReopenTour={onReopenTour}
        />
        {VISIBLE_AGENTS_CATALOG.map((agent, idx) => (
          <AgentSlide
            key={agent.slug}
            agent={agent}
            platform={platform}
            setRef={setRef(agent.slug)}
            index={idx}
            total={VISIBLE_AGENTS_CATALOG.length}
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

function AgentesMobile({ onReopenTour }: { onReopenTour: () => void }) {
  const [platform, setPlatform] = usePersistedPlatform();
  return (
    <AgentesFeed
      platform={platform}
      onChangePlatform={setPlatform}
      desktop={false}
      onReopenTour={onReopenTour}
    />
  );
}

function AgentesDesktop({ onReopenTour }: { onReopenTour: () => void }) {
  const [platform, setPlatform] = usePersistedPlatform();
  return (
    <AgentesFeed
      platform={platform}
      onChangePlatform={setPlatform}
      desktop={true}
      onReopenTour={onReopenTour}
    />
  );
}

// Steps do tour de Agentes — mesma estrutura da home (Welcome → targets → Nav → Done)
function buildAgentesSteps(desktop: boolean): TutorialStep[] {
  const navStep: TutorialStep = desktop
    ? {
        id: "nav",
        target: "desktop-nav",
        title: "Sua navegação principal",
        description:
          "Sidebar lateral com tudo: agentes, produtos, scripts, rotina, educação, ranking, news e conta. Passa o mouse pra expandir os labels.",
        padding: 8,
        radius: 32,
      }
    : {
        id: "nav",
        target: "mobile-nav",
        title: "Sua navegação principal",
        description:
          "Barra fixa com 4 atalhos rápidos. O botão Mais abre uma grade com TODOS os itens do app.",
        padding: 6,
        radius: 32,
      };

  return [
    {
      id: "welcome",
      title: "bem-vinda às especialistas!",
      description:
        "Em 20 segundos eu te mostro como funcionam os agentes. Cada um é uma expert de nicho diferente, e elas abrem no ChatGPT ou Gemini — você pode pular a qualquer hora e refazer depois pelo botão ✨ Tour.",
    },
    {
      id: "intro",
      target: "agentes-intro",
      title: "Cada nicho com sua expert",
      description:
        "São especialistas treinadas pra cada categoria: skincare, makeup, suplementos, casa, eletrônicos, eletro… cada uma sabe o que vende e o que não vende no nicho dela.",
    },
    {
      id: "tabs",
      target: "agentes-tabs",
      title: "Escolha sua plataforma",
      description:
        "ChatGPT ou Gemini — escolhe a que você já usa. Sua preferência fica salva. O contador mostra quantos agentes já tão liberados na plataforma escolhida.",
    },
    {
      id: "how",
      target: "agentes-how",
      title: "Como usar em 3 passos",
      description:
        "1) Escolhe a plataforma. 2) Desliza pra ver as especialistas. 3) Abre uma, conversa lá e cola o resultado em Produtos ou Scripts aqui no app.",
    },
    {
      id: "scroll",
      target: "agentes-scroll",
      title: "Desliza pra conhecer cada uma",
      description:
        "Cada agente vira um slide cheio com foto, descrição, como funciona e o botão pra abrir. Use o scroll vertical do mouse, trackpad ou dedinho 💕",
    },
    navStep,
    {
      id: "done",
      title: "pronto! agora é com você 💕",
      description:
        "Desliza, abre a especialista do seu nicho e volta pra cá pra cadastrar o que ela gerou. Se quiser refazer o tour, clica no botão ✨ Tour no canto.",
    },
  ];
}

function AgentesPageContent() {
  // Splash inicial — mesma vibe da home
  const [showSplash, setShowSplash] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const [desktopMode, setDesktopMode] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktopMode(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDesktopMode(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const steps = React.useMemo(
    () => buildAgentesSteps(desktopMode),
    [desktopMode],
  );

  const [tourOpen, setTourOpen] = React.useState(false);
  const reopenTour = React.useCallback(() => {
    setTourOpen(true);
  }, []);

  return (
    <>
      <SplashScreen show={showSplash} minDurationMs={1000} />
      <ResponsiveShell
        mobile={<AgentesMobile onReopenTour={reopenTour} />}
        desktop={<AgentesDesktop onReopenTour={reopenTour} />}
        active="chat"
        customSidebar
      />
      <FloatingMainNav active="chat" />
      <TutorialOverlay
        steps={steps}
        storageKey="agentes"
        autoStart={!tourOpen}
        open={tourOpen || undefined}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}

export default function AgentesPage() {
  return <AgentesPageContent />;
}

// Suprime warning de imports não usados em condicionais (mantidos pro contexto futuro)
void ExternalLink;
void Sparkles;
