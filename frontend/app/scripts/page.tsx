"use client";

import * as React from "react";
import Link from "next/link";
import { Pen, ArrowUpRight, HelpCircle, Plus } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { CharacterReveal } from "@/components/atoms/character-reveal";
import { CountUp } from "@/components/atoms/count-up";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { cn } from "@/lib/cn";
import { TutorialOverlay } from "@/components/molecules/tutorial-overlay";
import { type TutorialStep } from "@/lib/tutorial";

type ScriptItem = {
  n?: number;
  hook?: string;
  development?: string;
  trigger?: string;
  why?: string;
};

type ScriptRow = {
  id: string;
  title: string;
  hooks: ScriptItem[];
  product_id: string | null;
  model: string | null;
  created_at: string;
};

function hasFullScripts(items: ScriptItem[]): boolean {
  return items.some((i) => Boolean(i.development));
}

function formatDateBR(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function useScripts() {
  const [scripts, setScripts] = React.useState<ScriptRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/scripts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { scripts: [] }))
      .then((data: { scripts: ScriptRow[] }) => {
        if (!cancelled) setScripts(data.scripts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { scripts, loading };
}

// =================================================================
// HERO
// =================================================================

function HeroSection({
  count,
  desktop,
  onReopenTour,
}: {
  count: number;
  desktop: boolean;
  onReopenTour: () => void;
}) {
  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
        paddingBottom: desktop ? "96px" : "72px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="lilac" variant={2} className="top-20 -right-40 w-[520px] h-[520px]" />
      <HeroBlob color="peach" variant={3} className="bottom-0 left-1/3 w-[400px] h-[400px]" />
      <SparkleField count={14} seed={701} className="opacity-70" />

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
          aria-label="Refazer tour de scripts"
        >
          <HelpCircle
            size={13}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <span className="hidden sm:inline">Tour</span>
        </button>
      </div>

      <div className={`relative ${desktop ? "px-12 max-w-[1200px] mx-auto" : "px-5"}`}>
        <div className="flex items-start justify-between gap-4 mb-8">
          <SectionReveal direction="down" durationMs={600}>
            <div data-tutorial-id="scripts-intro">
              <div className="text-eyebrow text-spark-brand-deep">
                ✦ biblioteca de scripts
              </div>
              <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[30ch] font-semibold">
                Gancho, desenvolvimento, benefício e CTA. Prontos pra gravar.
              </div>
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={200}>
              <Sticker text="SCRIPTS · 2026 · " emoji="✍️" size={132} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={150} durationMs={900}>
          <h1
            className="font-display lowercase leading-[0.9] tracking-tight max-w-[18ch]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            <CharacterReveal as="span" immediate staggerMs={28} className="block text-spark-ink">
              cada roteiro
            </CharacterReveal>
            <CharacterReveal
              as="span"
              immediate
              staggerMs={28}
              delayMs={500}
              className="block"
              charClassName="text-grad-brand"
            >
              uma venda.
            </CharacterReveal>
          </h1>
        </SectionReveal>

        <SectionReveal direction="up" delay={900}>
          <div data-tutorial-id="scripts-action" className="mt-10 flex items-center gap-5 flex-wrap">
            <Link
              href="/scripts/novo"
              className="group inline-flex items-center gap-2 px-7 py-4 rounded-full bg-spark-ink text-white text-[14px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-1 hover:bg-spark-brand-deep active:translate-y-0"
            >
              <Plus
                size={16}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:rotate-90"
              />
              Adicionar roteiros
            </Link>

            <div className="inline-flex items-center gap-2 text-[13px] text-spark-ink-70 font-semibold">
              <span className="font-extrabold text-fluid-title text-spark-ink leading-none">
                <CountUp value={count} durationMs={1100} />
              </span>
              {count === 1 ? "conjunto salvo" : "conjuntos salvos"}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// SCRIPT CARD
// =================================================================

function ScriptCard({ s, index }: { s: ScriptRow; index: number }) {
  const isFull = hasFullScripts(s.hooks);
  const firstHook = s.hooks.find((h) => h.hook)?.hook;
  return (
    <SectionReveal delay={Math.min(index * 70, 360)}>
      <Link
        href={`/scripts/${s.id}`}
        className="group block rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden hover-lift shadow-rest"
      >
        {/* Hero strip — gradient peach/rose com ícone grande */}
        <div className="relative h-[160px] bg-gradient-to-br from-rose-100 via-amber-50 to-purple-100 overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.6) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 40%)",
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <span
              aria-hidden
              className="text-[78px] drop-shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-transform duration-700 ease-premium group-hover:scale-110 group-hover:rotate-6"
            >
              ✍️
            </span>
          </div>

          {/* Chips no topo */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass text-[10.5px] font-extrabold text-spark-ink tracking-tight">
              {s.hooks.length} {isFull ? "roteiros" : "hooks"}
            </span>
            <div className="w-9 h-9 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowUpRight size={14} strokeWidth={2.5} className="text-spark-ink" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <h3 className="text-[15px] font-extrabold tracking-tight leading-tight text-spark-ink line-clamp-2">
            {s.title}
          </h3>
          {firstHook && (
            <p className="mt-3 text-[12.5px] text-spark-ink-70 italic leading-snug line-clamp-2 relative pl-3">
              <span aria-hidden className="absolute left-0 top-0 text-spark-brand text-[16px] leading-none">
                &ldquo;
              </span>
              {firstHook}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-spark-hairline">
            <span className="text-[10.5px] text-spark-ink-50 font-mono">
              {formatDateBR(s.created_at)}
            </span>
            <span className="text-[10.5px] text-spark-brand-deep font-extrabold tracking-tight">
              ✦ abrir
            </span>
          </div>
        </div>
      </Link>
    </SectionReveal>
  );
}

function AddScriptCard({ delay }: { delay: number }) {
  return (
    <SectionReveal delay={delay}>
      <Link
        href="/scripts/novo"
        className="group flex flex-col items-center justify-center text-center rounded-spark-2xl border-2 border-dashed border-spark-brand/30 bg-spark-brand-soft/30 hover-lift shadow-rest p-8 min-h-full transition-colors duration-300 hover:border-spark-brand/60 hover:bg-spark-brand-soft/50"
      >
        <div className="w-16 h-16 rounded-full bg-brand-grad text-white flex items-center justify-center shadow-lift-brand transition-transform duration-300 ease-premium group-hover:rotate-90">
          <Plus size={28} strokeWidth={2.5} />
        </div>
        <div className="mt-5 text-[14px] font-extrabold text-spark-brand-deep tracking-tight">
          Adicionar roteiros
        </div>
        <div className="mt-1.5 text-[12px] text-spark-ink-50">
          Cola o que gerou no agente Scripts
        </div>
      </Link>
    </SectionReveal>
  );
}

// =================================================================
// GRID
// =================================================================

function ScriptsGrid({ scripts, desktop }: { scripts: ScriptRow[]; desktop: boolean }) {
  return (
    <section className={`relative ${desktop ? "py-16 px-12" : "py-12 px-5"}`}>
      <div className={desktop ? "max-w-[1200px] mx-auto" : ""}>
        <SectionReveal>
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-eyebrow text-spark-brand mb-3">
                ✦ {scripts.length} {scripts.length === 1 ? "conjunto" : "conjuntos"}
              </div>
              <h2 className="text-fluid-display font-display lowercase text-spark-ink leading-[0.9] tracking-tight max-w-[14ch]">
                seu acervo
              </h2>
            </div>
          </div>
        </SectionReveal>

        <div className={`grid gap-4 ${desktop ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
          {scripts.map((s, i) => (
            <ScriptCard key={s.id} s={s} index={i} />
          ))}
          <AddScriptCard delay={Math.min(scripts.length * 70, 360)} />
        </div>
      </div>
    </section>
  );
}

// =================================================================
// EMPTY
// =================================================================

function EmptyScripts({ desktop }: { desktop: boolean }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        desktop ? "py-24 px-12" : "py-16 px-5",
      )}
    >
      <HeroBlob color="rose" variant={2} className="-top-10 -left-20 w-[400px] h-[400px]" />
      <HeroBlob color="lilac" variant={3} className="bottom-0 -right-20 w-[360px] h-[360px]" />
      <SparkleField count={10} seed={555} className="opacity-50" />

      <div className={cn("relative text-center", desktop ? "max-w-[680px] mx-auto" : "")}>
        <SectionReveal direction="scale">
          <div className="mx-auto w-24 h-24 rounded-full bg-brand-grad-soft flex items-center justify-center mb-7 shadow-lift animate-float">
            <span className="text-[48px]">✍️</span>
          </div>
        </SectionReveal>

        <SectionReveal direction="up" delay={150}>
          <h2
            className="font-display lowercase leading-[0.95] tracking-tight text-spark-ink"
            style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}
          >
            sem roteiros<br />
            <span className="text-grad-brand">por aqui ainda.</span>
          </h2>
        </SectionReveal>

        <SectionReveal direction="up" delay={350}>
          <div className="mt-8 rounded-spark-2xl glass border border-spark-hairline p-6 text-left max-w-[520px] mx-auto">
            <ol className="space-y-3 text-[14px] text-spark-ink-70 leading-snug">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-grad text-white text-[12px] font-extrabold flex items-center justify-center shadow-lift-brand">
                  1
                </span>
                <span>
                  Vai em{" "}
                  <Link href="/agentes" className="text-spark-brand-deep font-extrabold hover:underline">
                    Agentes ✨
                  </Link>{" "}
                  e abre o agente <strong className="text-spark-ink">Scripts</strong> do seu nicho.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-grad text-white text-[12px] font-extrabold flex items-center justify-center shadow-lift-brand">
                  2
                </span>
                <span>Gera os roteiros completos lá no ChatGPT ou Gemini.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-grad text-white text-[12px] font-extrabold flex items-center justify-center shadow-lift-brand">
                  3
                </span>
                <span>
                  Volta aqui e cadastra em <strong className="text-spark-ink">+ adicionar roteiros</strong> 💕
                </span>
              </li>
            </ol>
          </div>
        </SectionReveal>

        <SectionReveal direction="up" delay={550}>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/agentes"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full glass border border-spark-hairline text-spark-ink text-[14px] font-extrabold shadow-rest transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift"
            >
              Ver agentes
              <ArrowUpRight size={15} strokeWidth={2.5} />
            </Link>
            <Link
              href="/scripts/novo"
              className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-spark-ink text-white text-[14px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-1 hover:bg-spark-brand-deep"
            >
              <Plus
                size={16}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:rotate-90"
              />
              Cadastrar agora
            </Link>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// BODY + PAGE
// =================================================================

function ScriptsBody({
  desktop = false,
  onReopenTour,
}: {
  desktop?: boolean;
  onReopenTour: () => void;
}) {
  const { scripts, loading } = useScripts();
  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 0 : "calc(env(safe-area-inset-bottom) + 88px)" }}
    >
      <HeroSection count={scripts.length} desktop={desktop} onReopenTour={onReopenTour} />
      <div data-tutorial-id="scripts-vitrine">
        {loading ? (
          <section className="py-24 flex justify-center">
            <LoadingSplash message="Buscando seus scripts" />
          </section>
        ) : scripts.length === 0 ? (
          <EmptyScripts desktop={desktop} />
        ) : (
          <ScriptsGrid scripts={scripts} desktop={desktop} />
        )}
      </div>
    </div>
  );
}

function ScriptsMobile({ onReopenTour }: { onReopenTour: () => void }) {
  return <ScriptsBody onReopenTour={onReopenTour} />;
}

function ScriptsDesktop({ onReopenTour }: { onReopenTour: () => void }) {
  return <ScriptsBody desktop onReopenTour={onReopenTour} />;
}

// Steps do tour de Scripts (6 steps com variantes mobile/desktop pro nav)
function buildScriptsSteps(desktop: boolean): TutorialStep[] {
  const navStep: TutorialStep = desktop
    ? {
        id: "nav",
        target: "desktop-nav",
        title: "Sua navegação principal",
        description:
          "Sidebar lateral com tudo: agentes, produtos, scripts, rotina, educação, ranking, news e conta.",
        padding: 8,
        radius: 32,
      }
    : {
        id: "nav",
        target: "mobile-nav",
        title: "Sua navegação principal",
        description:
          "Barra fixa com 4 atalhos rápidos. O botão Mais abre a grade completa.",
        padding: 6,
        radius: 32,
      };

  return [
    {
      id: "welcome",
      title: "bem-vinda aos scripts!",
      description:
        "Aqui ficam os roteiros prontos pra gravar — várias versões por conjunto, cada uma com gancho, desenvolvimento, benefício e CTA. Em 20s te mostro tudo.",
    },
    {
      id: "intro",
      target: "scripts-intro",
      title: "Como os roteiros funcionam",
      description:
        "Cada conjunto vem com 5 variações: gancho que prende, desenvolvimento que vende, benefício que convence e CTA que converte. Você só grava.",
    },
    {
      id: "action",
      target: "scripts-action",
      title: "Adicionar e acompanhar",
      description:
        "Botão Adicionar roteiros cola o que o agente Scripts gerou. O contador do lado mostra quantos conjuntos você já tem salvos.",
    },
    {
      id: "vitrine",
      target: "scripts-vitrine",
      title: "Seu acervo",
      description:
        "Cards com título, número de roteiros e prévia do primeiro gancho. Clica num pra ver os roteiros completos, editar ou apagar. Vazio mostra o passo a passo.",
    },
    navStep,
    {
      id: "done",
      title: "pronto! agora é gravar 💕",
      description:
        "Quanto mais roteiros prontos, menos você fica travada na hora de gravar. Pra refazer o tour, clica no ✨ Tour no canto.",
    },
  ];
}

function ScriptsPageContent() {
  const [desktopMode, setDesktopMode] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktopMode(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDesktopMode(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const steps = React.useMemo(() => buildScriptsSteps(desktopMode), [desktopMode]);

  const [tourOpen, setTourOpen] = React.useState(false);
  const reopenTour = React.useCallback(() => setTourOpen(true), []);

  return (
    <>
      <ResponsiveShell
        mobile={<ScriptsMobile onReopenTour={reopenTour} />}
        desktop={<ScriptsDesktop onReopenTour={reopenTour} />}
        active="scripts"
        customSidebar
      />
      <FloatingMainNav active="scripts" />
      <TutorialOverlay
        steps={steps}
        storageKey="scripts"
        autoStart={!tourOpen}
        open={tourOpen || undefined}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}

export default function ScriptsPage() {
  return <ScriptsPageContent />;
}

void Pen;
