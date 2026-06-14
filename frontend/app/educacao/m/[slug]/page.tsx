"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  PlayCircle,
  CheckCircle2,
  ListChecks,
  FileText,
  Sparkles,
  ArrowRight,
  BookOpen,
  Lock,
} from "lucide-react";
import {
  getModuleLockStatus,
  formatModuleDaysRemaining,
} from "@/lib/module-lock";
import type { ProfileForGate } from "@/lib/agent-lock";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { cn } from "@/lib/cn";

type LessonKind = "video" | "rich" | "checklist" | "ebook";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: LessonKind;
  youtube_id: string | null;
  body_md: string | null;
  checklist_items: { text: string }[] | null;
  cover_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  is_published: boolean;
};

type Module = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  accent: string | null;
  order_index: number;
  is_published: boolean;
};

type ProgressRow = { video_id: string; completed: boolean; progress_seconds: number };

const ACCENT_BLOBS: Record<string, { c1: "rose" | "peach" | "lilac"; c2: "rose" | "peach" | "lilac" }> = {
  rose: { c1: "rose", c2: "peach" },
  peach: { c1: "peach", c2: "rose" },
  lilac: { c1: "lilac", c2: "rose" },
};

function KindIcon({ kind, size = 16 }: { kind: LessonKind; size?: number }) {
  if (kind === "video") return <PlayCircle size={size} strokeWidth={2.2} />;
  if (kind === "checklist") return <ListChecks size={size} strokeWidth={2.2} />;
  if (kind === "ebook") return <BookOpen size={size} strokeWidth={2.2} />;
  return <FileText size={size} strokeWidth={2.2} />;
}

function kindLabel(kind: LessonKind): string {
  if (kind === "video") return "Vídeo";
  if (kind === "checklist") return "Checklist";
  if (kind === "ebook") return "Ebook";
  return "Aula";
}

/**
 * Carrega profile (mesma estrategia da /educacao). Preview admin
 * via ?preview=lock&day=N pra simular bloqueio.
 */
function useProfile(): { profile: ProfileForGate | null; previewMode: boolean } {
  const [profile, setProfile] = React.useState<ProfileForGate | null>(null);
  const [previewMode, setPreviewMode] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("preview") === "lock") {
        const dayParam = Number(sp.get("day"));
        const day =
          Number.isFinite(dayParam) && dayParam >= 1 && dayParam <= 6 ? dayParam : 1;
        const fakeCreated = new Date(Date.now() - (day - 1) * 86_400_000);
        setProfile({ created_at: fakeCreated.toISOString(), role: "user" });
        setPreviewMode(true);
        return;
      }
    }
    fetch("/api/me", {
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        setProfile((j?.profile ?? null) as ProfileForGate | null);
      })
      .catch(() => {
        // silencioso
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, previewMode };
}

function useModule(slug: string) {
  const [mod, setMod] = React.useState<Module | null>(null);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [progress, setProgress] = React.useState<Record<string, ProgressRow>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [mRes, pRes] = await Promise.all([
        fetch(`/api/educacao/modules/${slug}`, { cache: "no-store" }),
        fetch("/api/educacao/progress", { cache: "no-store" }),
      ]);
      if (cancelled) return;
      if (mRes.status === 404) {
        setError("Módulo não encontrado");
        setLoading(false);
        return;
      }
      if (!mRes.ok) {
        setError("Falhou ao carregar o módulo");
        setLoading(false);
        return;
      }
      const data = (await mRes.json()) as { module: Module; lessons: Lesson[] };
      setMod(data.module);
      setLessons(data.lessons);
      if (pRes.ok) {
        const pData = (await pRes.json()) as { progress: ProgressRow[] };
        const byId: Record<string, ProgressRow> = {};
        for (const p of pData.progress) byId[p.video_id] = p;
        setProgress(byId);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { mod, lessons, progress, loading, error };
}

// =================================================================
// LESSON ROW
// =================================================================

function LessonRow({
  lesson,
  index,
  completed,
  partial,
}: {
  lesson: Lesson;
  index: number;
  completed: boolean;
  partial: number;
}) {
  return (
    <SectionReveal delay={Math.min(index * 50, 300)}>
      <Link
        href={`/educacao/${lesson.slug}`}
        className="group flex items-center gap-4 lg:gap-5 p-4 lg:p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest hover-lift transition-all duration-300 ease-premium"
      >
        {/* Number / completion ring */}
        <div className="relative shrink-0">
          {completed ? (
            <div className="w-14 h-14 rounded-full bg-good/10 border-2 border-good flex items-center justify-center shadow-rest">
              <CheckCircle2 size={22} strokeWidth={2.4} className="text-good" />
            </div>
          ) : partial > 0 ? (
            <div className="relative w-14 h-14">
              <svg width="56" height="56" viewBox="0 0 56 56" className="rotate-[-90deg]">
                <circle cx="28" cy="28" r="24" stroke="oklch(0.94 0.02 340)" strokeWidth="3" fill="none" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="oklch(0.65 0.22 350)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - partial / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-extrabold text-spark-brand-deep">
                {partial}%
              </div>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-spark-surface-sunken text-spark-ink-50 flex items-center justify-center font-display text-[18px] shadow-rest border border-spark-hairline">
              {String(index + 1).padStart(2, "0")}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[10px] font-extrabold uppercase tracking-widest">
              <KindIcon kind={lesson.kind} size={10} />
              {kindLabel(lesson.kind)}
            </span>
            {completed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-good/10 text-good text-[10px] font-extrabold uppercase tracking-widest">
                <CheckCircle2 size={10} strokeWidth={2.5} />
                Concluída
              </span>
            )}
          </div>
          <div className="text-[15px] font-extrabold text-spark-ink leading-tight group-hover:text-spark-brand-deep transition-colors line-clamp-2">
            {lesson.title}
          </div>
          {lesson.description && (
            <p className="mt-1.5 text-[12.5px] text-spark-ink-70 leading-snug line-clamp-2">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Arrow */}
        <ArrowUpRight
          size={20}
          strokeWidth={2.4}
          className="shrink-0 text-spark-ink-50 group-hover:text-spark-brand-deep group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
        />
      </Link>
    </SectionReveal>
  );
}

// =================================================================
// BODY
// =================================================================

function ModuleBody({ slug, desktop = false }: { slug: string; desktop?: boolean }) {
  const { mod, lessons, progress, loading, error } = useModule(slug);
  const { profile, previewMode } = useProfile();
  const done = lessons.filter((l) => progress[l.id]?.completed).length;
  const total = lessons.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Próxima aula = primeira não-completa (ou primeira no geral se nenhuma feita)
  const nextLesson = React.useMemo(() => {
    if (lessons.length === 0) return null;
    return lessons.find((l) => !progress[l.id]?.completed) ?? lessons[0];
  }, [lessons, progress]);

  // Bloqueio progressivo: se aluna esta gated nesse modulo, mostra tela
  // de "bloqueado" e nao deixa ver as aulas. Anti-burla: alguem digita a
  // URL direto, ainda assim bate aqui no client.
  const lock = React.useMemo(
    () => getModuleLockStatus(profile, slug, undefined, { skipCutoff: previewMode }),
    [profile, slug, previewMode],
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <LoadingSplash message="Abrindo módulo" />
      </div>
    );
  }

  if (lock.locked) {
    return (
      <div className="flex-1 overflow-auto relative hero-radial">
        {previewMode && (
          <div
            className="fixed left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-spark-ink text-white text-[11px] font-extrabold tracking-widest uppercase shadow-lift pointer-events-none"
            style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
            aria-hidden
          >
            🔍 Preview de bloqueio · admin
          </div>
        )}
        <SparkleField count={8} seed={77} className="opacity-50" />
        <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[420px] h-[420px] opacity-50" />
        <HeroBlob color="lilac" variant={2} className="bottom-0 -right-32 w-[420px] h-[420px] opacity-50" />
        <div className="px-6 py-32 text-center max-w-[520px] mx-auto relative">
          <div className="mx-auto w-20 h-20 rounded-full bg-white/95 shadow-lift flex items-center justify-center mb-6">
            <Lock size={32} strokeWidth={2.4} className="text-spark-ink" />
          </div>
          <h1 className="font-display lowercase text-fluid-headline text-spark-ink leading-tight">
            módulo bloqueado.
          </h1>
          <p className="mt-4 text-[14px] text-spark-ink-70 leading-snug max-w-[44ch] mx-auto">
            Pra você primeiro absorver o fundamento, esse módulo libera em{" "}
            <strong className="text-spark-ink">
              {lock.daysRemaining === 1 ? "1 dia" : `${lock.daysRemaining} dias`}
            </strong>
            . Por enquanto avança em <strong className="text-spark-ink">Comece Aqui</strong> e{" "}
            <strong className="text-spark-ink">Estrutura e Rotina</strong> 💕
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-spark-ink/85 backdrop-blur text-white text-[11.5px] font-extrabold tracking-tight">
            <Lock size={11} strokeWidth={2.5} />
            {formatModuleDaysRemaining(lock.daysRemaining)}
          </div>
          <div className="mt-8">
            <Link
              href="/educacao"
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar pra Educação
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mod) {
    return (
      <div className="flex-1 overflow-auto relative hero-radial">
        <SparkleField count={8} seed={42} className="opacity-50" />
        <div className="px-6 py-32 text-center max-w-[480px] mx-auto relative">
          <div className="text-[64px] mb-4">😕</div>
          <h1 className="font-display lowercase text-fluid-headline text-spark-ink leading-tight">
            opa, sumiu.
          </h1>
          <p className="mt-4 text-[14px] text-spark-ink-70 leading-snug">
            {error ?? "Esse módulo não existe."}
          </p>
          <Link
            href="/educacao"
            className="mt-8 inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pra Educação
          </Link>
        </div>
      </div>
    );
  }

  const blobs = ACCENT_BLOBS[mod.accent || "rose"] ?? ACCENT_BLOBS.rose;

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      {/* Hero específico do módulo */}
      <section
        className="relative overflow-hidden hero-radial"
        style={{
          paddingTop: desktop ? "96px" : "calc(env(safe-area-inset-top) + 80px)",
          paddingBottom: desktop ? "64px" : "48px",
        }}
      >
        <HeroBlob color={blobs.c1} variant={1} className="-top-32 -left-32 w-[500px] h-[500px]" />
        <HeroBlob color={blobs.c2} variant={2} className="top-20 -right-40 w-[480px] h-[480px]" />
        <SparkleField count={12} seed={mod.order_index + 100} className="opacity-50" />

        <div className={`relative ${desktop ? "px-12 max-w-[1100px] mx-auto" : "px-5"}`}>
          <SectionReveal direction="down" durationMs={500}>
            <Link
              href="/educacao"
              className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar pra Educação
            </Link>
          </SectionReveal>

          <div className="mt-7 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-end">
            <div>
              <SectionReveal direction="up" delay={100} durationMs={600}>
                <div className="text-eyebrow text-spark-brand">
                  <span className="font-mono">CAP. {String(mod.order_index).padStart(2, "0")}</span>
                  {mod.subtitle && (
                    <>
                      <span className="mx-2 opacity-50">·</span>
                      <span>{mod.subtitle}</span>
                    </>
                  )}
                </div>
              </SectionReveal>

              <SectionReveal direction="up" delay={200} durationMs={900}>
                <h1
                  className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.9]"
                  style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
                >
                  {mod.title.toLowerCase()}
                </h1>
              </SectionReveal>

              {mod.description && (
                <SectionReveal direction="up" delay={350}>
                  <p className="mt-5 text-fluid-lead text-spark-ink-70 max-w-[58ch] leading-snug font-semibold">
                    {mod.description}
                  </p>
                </SectionReveal>
              )}
            </div>

            {/* Progress block + CTA */}
            <SectionReveal direction="up" delay={400}>
              <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-6 shadow-rest">
                <div className="text-eyebrow text-spark-brand-deep mb-3">✦ seu progresso</div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-display lowercase tracking-tight leading-none text-spark-ink"
                    style={{ fontSize: "clamp(3rem, 5vw, 4rem)" }}
                  >
                    {pct}%
                  </span>
                  <span className="text-[13px] text-spark-ink-50 font-extrabold">
                    {done}/{total} aulas
                  </span>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-spark-surface-sunken overflow-hidden">
                  <div
                    className="h-full bg-brand-grad transition-all duration-700 ease-premium"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {nextLesson && (
                  <Link
                    href={`/educacao/${nextLesson.slug}`}
                    className="mt-5 group inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full bg-spark-ink text-white text-[13.5px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-spark-brand-deep"
                  >
                    {done > 0 ? "Continuar trilha" : "Começar agora"}
                    <ArrowRight
                      size={14}
                      strokeWidth={2.5}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </Link>
                )}
              </div>
            </SectionReveal>
          </div>
        </div>
      </section>

      {/* Lista de aulas */}
      <section className={`relative ${desktop ? "px-12 py-12" : "px-5 py-8"}`}>
        <div className={desktop ? "max-w-[900px] mx-auto" : ""}>
          <SectionReveal direction="up" durationMs={500}>
            <div className="mb-7 flex items-center gap-3">
              <Sparkles size={16} strokeWidth={2.4} className="text-spark-brand-deep" />
              <span className="text-eyebrow text-spark-brand">✦ {total} aulas no módulo</span>
            </div>
          </SectionReveal>

          <div className="space-y-3">
            {lessons.map((l, i) => {
              const p = progress[l.id];
              const completed = !!p?.completed;
              const partial =
                !completed && p && l.duration_seconds && l.duration_seconds > 0
                  ? Math.min(100, Math.round((p.progress_seconds / l.duration_seconds) * 100))
                  : 0;
              return (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  index={i}
                  completed={completed}
                  partial={partial}
                />
              );
            })}
          </div>

          {lessons.length === 0 && (
            <SectionReveal direction="up">
              <div className="text-center py-12 rounded-spark-2xl bg-spark-surface border border-spark-hairline">
                <div className="text-[48px] mb-2">📚</div>
                <h3 className="font-display lowercase text-spark-ink text-[22px] leading-tight">
                  módulo em preparação.
                </h3>
                <p className="mt-2 text-[13px] text-spark-ink-50 max-w-[40ch] mx-auto">
                  Em breve a Yara publica as primeiras aulas desse módulo.
                </p>
              </div>
            </SectionReveal>
          )}
        </div>
      </section>
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function MobileWrap({ slug }: { slug: string }) {
  return <ModuleBody slug={slug} />;
}

export default function ModulePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  return (
    <>
      <ResponsiveShell
        mobile={<MobileWrap slug={slug} />}
        desktop={<ModuleBody slug={slug} desktop />}
        active="educacao"
        customSidebar
      />
      <FloatingMainNav active="educacao" />
    </>
  );
}
