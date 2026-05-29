"use client";

import * as React from "react";
import Link from "next/link";
import { Pen, ArrowUpRight, Plus } from "lucide-react";
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

function HeroSection({ count, desktop }: { count: number; desktop: boolean }) {
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

      <div className={`relative ${desktop ? "px-12 max-w-[1200px] mx-auto" : "px-5"}`}>
        <div className="flex items-start justify-between gap-4 mb-8">
          <SectionReveal direction="down" durationMs={600}>
            <div className="text-eyebrow text-spark-brand-deep">
              ✦ biblioteca de scripts
            </div>
            <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[30ch] font-semibold">
              Gancho, desenvolvimento, benefício e CTA. Prontos pra gravar.
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
          <div className="mt-10 flex items-center gap-5 flex-wrap">
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
                <span>Gera os 5 roteiros completos lá no ChatGPT ou Gemini.</span>
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

function ScriptsBody({ desktop = false }: { desktop?: boolean }) {
  const { scripts, loading } = useScripts();
  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 0 : "calc(env(safe-area-inset-bottom) + 88px)" }}
    >
      <HeroSection count={scripts.length} desktop={desktop} />
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
  );
}

function ScriptsMobile() {
  return <ScriptsBody />;
}

function ScriptsDesktop() {
  return <ScriptsBody desktop />;
}

export default function ScriptsPage() {
  return (
    <>
      <ResponsiveShell
        mobile={<ScriptsMobile />}
        desktop={<ScriptsDesktop />}
        active="scripts"
        customSidebar
      />
      <FloatingMainNav active="scripts" />
    </>
  );
}

void Pen;
