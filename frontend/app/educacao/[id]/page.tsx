"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ListChecks,
  FileText,
  PlayCircle,
  Sparkles,
  Download,
  BookOpen,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/cn";

// =================================================================
// TYPES
// =================================================================

type LessonKind = "video" | "rich" | "checklist" | "ebook";

type ChecklistItem = { text: string };

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  kind: LessonKind;
  youtube_id: string | null;
  body_md: string | null;
  checklist_items: ChecklistItem[] | null;
  cover_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  module_id: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
};

type ModuleInfo = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  accent: string | null;
  order_index: number;
};

type Sibling = {
  id: string;
  slug: string;
  title: string;
  kind: LessonKind;
  order_index: number;
};

type CheckState = { item_index: number; checked: boolean };

const ACCENT_BLOBS: Record<string, { c1: "rose" | "peach" | "lilac"; c2: "rose" | "peach" | "lilac" }> = {
  rose: { c1: "rose", c2: "peach" },
  peach: { c1: "peach", c2: "rose" },
  lilac: { c1: "lilac", c2: "rose" },
};

// =================================================================
// DATA HOOKS
// =================================================================

function useLesson(idOrSlug: string) {
  const [lesson, setLesson] = React.useState<Lesson | null>(null);
  const [mod, setMod] = React.useState<ModuleInfo | null>(null);
  const [siblings, setSiblings] = React.useState<Sibling[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/educacao/${idOrSlug}`, { cache: "no-store" });
      if (cancelled) return;
      if (res.status === 404) {
        setError("Aula não encontrada");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError("Falhou ao carregar a aula");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as {
        video: Lesson;
        module: ModuleInfo | null;
        siblings: Sibling[];
      };
      setLesson(data.video);
      setMod(data.module);
      setSiblings(data.siblings ?? []);
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  return { lesson, mod, siblings, loading, error };
}

function useChecklistState(lessonId: string | null) {
  const [states, setStates] = React.useState<Map<number, boolean>>(new Map());

  React.useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/educacao/checklist?lesson_id=${lessonId}`, {
        cache: "no-store",
      });
      if (cancelled || !res.ok) return;
      const data = (await res.json()) as { states: CheckState[] };
      const map = new Map<number, boolean>();
      for (const s of data.states) map.set(s.item_index, s.checked);
      setStates(map);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const toggle = React.useCallback(
    async (itemIndex: number) => {
      if (!lessonId) return;
      const next = !states.get(itemIndex);
      setStates((prev) => {
        const m = new Map(prev);
        m.set(itemIndex, next);
        return m;
      });
      await fetch("/api/educacao/checklist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lesson_id: lessonId,
          item_index: itemIndex,
          checked: next,
        }),
      }).catch(() => {});
    },
    [lessonId, states],
  );

  return { states, toggle };
}

function markCompleted(videoId: string) {
  return fetch("/api/educacao/progress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ video_id: videoId, completed: true }),
  });
}

// =================================================================
// MARKDOWN RENDERER (editorial)
// =================================================================

function EditorialMarkdown({ source }: { source: string }) {
  return (
    <div className="lesson-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              className="font-display lowercase tracking-tight leading-[0.95] text-spark-ink mt-12 mb-5"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              {String(children).toLowerCase()}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="font-display lowercase tracking-tight leading-[0.95] text-spark-ink mt-12 mb-4"
              style={{ fontSize: "clamp(1.625rem, 3vw, 2.25rem)" }}
            >
              {String(children).toLowerCase()}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display lowercase tracking-tight leading-tight text-spark-brand-deep mt-8 mb-3 text-[18px] lg:text-[20px]">
              {String(children).toLowerCase()}
            </h3>
          ),
          p: ({ children }) => (
            <p
              className="text-spark-ink-70 leading-relaxed mb-4 first-of-type:first-letter:font-display first-of-type:first-letter:text-spark-brand-deep first-of-type:first-letter:text-[3.5rem] first-of-type:first-letter:float-left first-of-type:first-letter:leading-[0.85] first-of-type:first-letter:mr-2 first-of-type:first-letter:mt-1"
              style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)" }}
            >
              {children}
            </p>
          ),
          ul: ({ children }) => <ul className="my-5 space-y-2.5">{children}</ul>,
          ol: ({ children }) => (
            <ol className="my-5 space-y-2.5 list-decimal pl-5 marker:text-spark-brand marker:font-extrabold">
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => {
            const ordered = "value" in (props as Record<string, unknown>);
            if (ordered) {
              return (
                <li
                  className="text-spark-ink-70 leading-relaxed pl-2"
                  style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)" }}
                >
                  {children}
                </li>
              );
            }
            return (
              <li
                className="flex items-start gap-3 text-spark-ink-70 leading-relaxed"
                style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)" }}
              >
                <span
                  aria-hidden
                  className="shrink-0 mt-2.5 w-1.5 h-1.5 rounded-full bg-spark-brand"
                />
                <span>{children}</span>
              </li>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-8 p-5 lg:p-6 rounded-spark-2xl bg-brand-grad-soft border-l-4 border-spark-brand text-spark-ink-70 leading-relaxed font-semibold italic shadow-rest">
              {children}
            </blockquote>
          ),
          code: (props) => {
            const { inline, children } = props as {
              inline?: boolean;
              children?: React.ReactNode;
            };
            if (inline) {
              return (
                <code className="font-mono text-[12.5px] px-1.5 py-0.5 rounded bg-spark-surface-sunken text-spark-brand-deep border border-spark-hairline">
                  {children}
                </code>
              );
            }
            return (
              <code className="block font-mono text-[12.5px] text-spark-bg leading-relaxed">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-6 p-5 rounded-spark-2xl bg-spark-ink overflow-x-auto shadow-rest border border-spark-ink">
              {children}
            </pre>
          ),
          hr: () => (
            <div className="my-10 flex items-center gap-3 text-spark-ink-50">
              <div className="flex-1 h-px bg-spark-hairline" />
              <span className="text-spark-brand text-[14px]">✦</span>
              <div className="flex-1 h-px bg-spark-hairline" />
            </div>
          ),
          strong: ({ children }) => (
            <strong className="font-extrabold text-spark-ink">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-spark-ink">{children}</em>,
          a: ({ children, href }) => (
            <Link
              href={href || "#"}
              className="text-spark-brand-deep font-extrabold underline decoration-spark-brand/30 underline-offset-2 hover:decoration-spark-brand transition-colors"
            >
              {children}
            </Link>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

// =================================================================
// VIDEO PLAYER (overlay sutil pra disfarçar logo YT)
// =================================================================

function VideoPlayer({ youtubeId, title }: { youtubeId: string; title: string }) {
  return (
    <div className="relative aspect-video rounded-spark-3xl overflow-hidden bg-black shadow-hero">
      <iframe
        src={youtubeEmbedUrl(youtubeId)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
      <div
        aria-hidden
        className="absolute bottom-0 right-0 w-14 h-7 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, transparent 0%, transparent 30%, oklch(0.18 0.02 340 / 0.5) 100%)",
        }}
      />
    </div>
  );
}

// =================================================================
// EBOOK CARD
// =================================================================

function fmtFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function EbookCard({
  fileUrl,
  fileName,
  fileSize,
  lessonId,
  title,
}: {
  fileUrl: string | null;
  fileName: string;
  fileSize: number;
  lessonId: string;
  title: string;
}) {
  const handleDownload = () => {
    // Fire-and-forget: registra que essa aluna baixou esse ebook
    void fetch("/api/track/ebook-download", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lesson_id: lessonId, file_name: fileName }),
    }).catch(() => {});
  };

  if (!fileUrl) {
    return (
      <div className="p-10 rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-rest text-center">
        <BookOpen size={32} strokeWidth={2.2} className="mx-auto text-spark-brand-deep mb-3" />
        <h3 className="font-display lowercase text-spark-ink text-[22px] leading-tight">
          ebook em preparação.
        </h3>
        <p className="mt-2 text-[13.5px] text-spark-ink-70">
          O PDF ainda não foi anexado. Volta em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-spark-3xl bg-brand-grad text-white shadow-hero p-8 lg:p-10">
      <div className="absolute -top-12 -right-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
        {/* Capa simbolica do PDF */}
        <div className="shrink-0 w-32 h-40 lg:w-36 lg:h-48 rounded-spark-xl bg-white/15 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center shadow-lift">
          <BookOpen size={42} strokeWidth={2} className="text-white/90 mb-2" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/80">
            PDF
          </span>
        </div>

        <div className="flex-1 min-w-0 text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.18em] text-white/80 mb-2">
            <BookOpen size={11} strokeWidth={2.5} />
            ebook
          </span>
          <h3 className="font-display lowercase text-[28px] lg:text-[34px] leading-tight">
            {title}
          </h3>
          <p className="mt-2 text-[13.5px] text-white/85 font-semibold">
            {fileName}
            {fileSize > 0 && (
              <>
                <span className="mx-1.5 opacity-60">·</span>
                <span className="font-mono">{fmtFileSize(fileSize)}</span>
              </>
            )}
          </p>

          <div className="mt-5 flex flex-wrap justify-center lg:justify-start gap-2.5">
            <a
              href={fileUrl}
              download={fileName}
              onClick={handleDownload}
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-spark-brand-deep text-[14px] font-extrabold shadow-lift hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-premium"
            >
              <Download size={15} strokeWidth={2.5} />
              Baixar PDF
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-[13.5px] font-extrabold hover:bg-white/25 transition-all duration-300"
            >
              <ArrowUpRight size={14} strokeWidth={2.5} />
              Abrir em nova aba
            </a>
          </div>

          <p className="mt-4 text-[11.5px] text-white/70 font-semibold">
            No celular o ebook abre no seu leitor de PDF padrão (Files, Drive, Adobe).
          </p>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// CHECKLIST
// =================================================================

function ChecklistView({
  lessonId,
  items,
  bodyMd,
}: {
  lessonId: string;
  items: ChecklistItem[];
  bodyMd: string | null;
}) {
  const { states, toggle } = useChecklistState(lessonId);
  const total = items.length;
  const done = Array.from(states.values()).filter(Boolean).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {bodyMd && <EditorialMarkdown source={bodyMd} />}

      <div className="p-5 lg:p-6 rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 shadow-rest">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-eyebrow text-spark-brand-deep">✦ seu checklist</div>
            <div
              className="mt-1 font-display lowercase tracking-tight text-spark-ink leading-none"
              style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)" }}
            >
              {done} <span className="text-grad-brand">/ {total}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-spark-ink-50 font-extrabold uppercase tracking-wider">
              progresso
            </div>
            <div className="text-[26px] font-mono font-extrabold text-spark-brand-deep leading-none">
              {pct}%
            </div>
          </div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-spark-surface overflow-hidden">
          <div
            className="h-full bg-brand-grad transition-all duration-700 ease-premium"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="space-y-3">
        {items.map((it, i) => {
          const checked = !!states.get(i);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={checked}
                className={cn(
                  "group flex w-full items-start gap-4 p-5 rounded-spark-2xl border text-left transition-all duration-300 ease-premium",
                  checked
                    ? "bg-good/5 border-good/25 shadow-rest"
                    : "bg-spark-surface border-spark-hairline hover:border-spark-brand/30 hover:shadow-lift hover:-translate-y-0.5 shadow-rest",
                )}
              >
                <div
                  className={cn(
                    "shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ease-premium",
                    checked
                      ? "bg-good text-white shadow-lift"
                      : "bg-spark-surface border-2 border-spark-hairline group-hover:border-spark-brand/40",
                  )}
                >
                  {checked && <Check size={16} strokeWidth={3} />}
                </div>
                <span
                  className={cn(
                    "flex-1 leading-snug font-semibold transition-all duration-300",
                    checked
                      ? "text-spark-ink-50 line-through decoration-good/50"
                      : "text-spark-ink",
                  )}
                  style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.05rem)" }}
                >
                  {it.text}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {done === total && total > 0 && (
        <div className="p-6 rounded-spark-2xl bg-good/5 border border-good/20 text-center shadow-rest">
          <div className="text-[40px] mb-2">🎉</div>
          <div
            className="font-display lowercase tracking-tight text-spark-ink leading-tight"
            style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)" }}
          >
            checklist <span className="text-grad-brand">completo!</span>
          </div>
          <div className="mt-2 text-[13px] text-spark-ink-70 font-semibold">
            Você bateu todos os itens. Agora é executar.
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// BODY
// =================================================================

function LessonBody({ idOrSlug, desktop = false }: { idOrSlug: string; desktop?: boolean }) {
  const { lesson, mod, siblings, loading, error } = useLesson(idOrSlug);
  const [marking, setMarking] = React.useState(false);
  const [marked, setMarked] = React.useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] hero-radial">
        <LoadingSplash message="Abrindo aula" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex-1 overflow-auto relative hero-radial">
        <SparkleField count={8} seed={42} className="opacity-50" />
        <div className="px-6 py-32 text-center max-w-[480px] mx-auto relative">
          <div className="text-[64px] mb-4">😕</div>
          <h1 className="font-display lowercase text-fluid-headline text-spark-ink leading-tight">
            opa, sumiu.
          </h1>
          <p className="mt-4 text-[14px] text-spark-ink-70 leading-snug">
            {error ?? "Essa aula não existe."}
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

  const blobs = ACCENT_BLOBS[mod?.accent || "rose"] ?? ACCENT_BLOBS.rose;
  const lessonIndex = siblings.findIndex((s) => s.id === lesson.id);
  const prev = lessonIndex > 0 ? siblings[lessonIndex - 1] : null;
  const next =
    lessonIndex >= 0 && lessonIndex < siblings.length - 1 ? siblings[lessonIndex + 1] : null;
  const positionLabel =
    lessonIndex >= 0 && siblings.length > 0
      ? `aula ${lessonIndex + 1} / ${siblings.length}`
      : null;

  const handleComplete = async () => {
    setMarking(true);
    try {
      const res = await markCompleted(lesson.id);
      if (res.ok) setMarked(true);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      {/* Hero compact */}
      <section
        className="relative overflow-hidden hero-radial"
        style={{
          paddingTop: desktop ? "72px" : "calc(env(safe-area-inset-top) + 64px)",
          paddingBottom: desktop ? "24px" : "20px",
        }}
      >
        <HeroBlob color={blobs.c1} variant={1} className="-top-24 -left-24 w-[420px] h-[420px]" />
        <HeroBlob color={blobs.c2} variant={2} className="top-10 -right-32 w-[460px] h-[460px]" />
        <SparkleField count={10} seed={mod?.order_index ?? 0} className="opacity-50" />

        <div className={`relative ${desktop ? "px-12 max-w-[1100px] mx-auto" : "px-5"}`}>
          <SectionReveal direction="down" durationMs={500}>
            <Link
              href={mod ? `/educacao/m/${mod.slug}` : "/educacao"}
              className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              {mod ? "Voltar pro módulo" : "Voltar pra Educação"}
            </Link>
          </SectionReveal>

          <SectionReveal direction="up" delay={100}>
            <div className="mt-6 flex items-center gap-2 flex-wrap text-[11px] font-extrabold uppercase tracking-widest text-spark-brand-deep">
              {mod && (
                <span className="font-mono">CAP. {String(mod.order_index).padStart(2, "0")}</span>
              )}
              {mod && <span className="opacity-50">·</span>}
              {mod && <span>{mod.title.toLowerCase()}</span>}
              {positionLabel && (
                <>
                  <span className="opacity-50">·</span>
                  <span className="font-mono">{positionLabel}</span>
                </>
              )}
            </div>
          </SectionReveal>

          <SectionReveal direction="up" delay={200} durationMs={800}>
            <h1
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            >
              {lesson.title.toLowerCase()}
            </h1>
          </SectionReveal>

          {lesson.description && (
            <SectionReveal direction="up" delay={350}>
              <p className="mt-4 text-fluid-lead text-spark-ink-70 leading-snug max-w-[60ch] font-semibold">
                {lesson.description}
              </p>
            </SectionReveal>
          )}
        </div>
      </section>

      {/* Body */}
      <section className={`relative ${desktop ? "px-12 py-8" : "px-5 py-6"}`}>
        <div
          className={
            desktop ? "max-w-[1100px] mx-auto grid grid-cols-[1fr_280px] gap-10" : ""
          }
        >
          <div className="min-w-0">
            <SectionReveal direction="up">
              {lesson.kind === "video" && lesson.youtube_id && (
                <div className="space-y-8">
                  <VideoPlayer youtubeId={lesson.youtube_id} title={lesson.title} />
                  {lesson.body_md && (
                    <div className="p-6 lg:p-8 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
                      <EditorialMarkdown source={lesson.body_md} />
                    </div>
                  )}
                </div>
              )}

              {lesson.kind === "rich" && lesson.body_md && (
                <article className="p-6 lg:p-10 rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-rest">
                  <EditorialMarkdown source={lesson.body_md} />
                </article>
              )}

              {lesson.kind === "checklist" && lesson.checklist_items && (
                <article className="p-6 lg:p-8 rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-rest">
                  <ChecklistView
                    lessonId={lesson.id}
                    items={lesson.checklist_items}
                    bodyMd={lesson.body_md}
                  />
                </article>
              )}

              {lesson.kind === "ebook" && (
                <div className="space-y-8">
                  <EbookCard
                    fileUrl={lesson.file_url}
                    fileName={lesson.file_name ?? `${lesson.slug}.pdf`}
                    fileSize={lesson.file_size_bytes ?? 0}
                    lessonId={lesson.id}
                    title={lesson.title}
                  />
                  {lesson.body_md && (
                    <div className="p-6 lg:p-8 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
                      <EditorialMarkdown source={lesson.body_md} />
                    </div>
                  )}
                </div>
              )}

              {lesson.kind === "rich" && !lesson.body_md && (
                <div className="p-10 rounded-spark-3xl bg-spark-surface border border-spark-hairline shadow-rest text-center">
                  <Sparkles
                    size={32}
                    strokeWidth={2.2}
                    className="mx-auto text-spark-brand-deep mb-3"
                  />
                  <h3 className="font-display lowercase text-spark-ink text-[22px] leading-tight">
                    conteúdo em preparação.
                  </h3>
                  <p className="mt-2 text-[13.5px] text-spark-ink-70">
                    A Yara tá organizando essa aula. Logo logo aparece aqui.
                  </p>
                </div>
              )}
            </SectionReveal>

            {/* Actions */}
            <SectionReveal direction="up" delay={150}>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={marking || marked}
                  className={cn(
                    "group inline-flex items-center gap-2 px-7 py-4 rounded-full text-[14px] font-extrabold shadow-lift transition-all duration-300 ease-premium",
                    "hover:-translate-y-0.5 active:translate-y-0",
                    "disabled:opacity-70 disabled:hover:translate-y-0",
                    marked
                      ? "bg-good text-white"
                      : "bg-spark-ink text-white hover:bg-spark-brand-deep",
                  )}
                >
                  <CheckCircle2
                    size={15}
                    strokeWidth={2.5}
                    className={cn(
                      "transition-transform duration-300",
                      marked ? "scale-110" : "group-hover:scale-110",
                    )}
                  />
                  {marking
                    ? "Marcando..."
                    : marked
                      ? "Aula concluída"
                      : "Marcar como concluída"}
                </button>

                {next && (
                  <Link
                    href={`/educacao/${next.slug}`}
                    className="group inline-flex items-center gap-2 px-7 py-4 rounded-full glass border border-spark-hairline text-spark-ink text-[14px] font-extrabold shadow-rest transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    Próxima aula
                    <ArrowRight
                      size={15}
                      strokeWidth={2.5}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </Link>
                )}
              </div>
            </SectionReveal>

            {(prev || next) && (
              <SectionReveal direction="up" delay={250}>
                <div className="mt-10 grid grid-cols-2 gap-3">
                  {prev ? (
                    <Link
                      href={`/educacao/${prev.slug}`}
                      className="group p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline hover:border-spark-brand/30 transition-all duration-300 ease-premium hover:-translate-y-0.5 shadow-rest"
                    >
                      <div className="text-eyebrow text-spark-ink-50 mb-1.5 flex items-center gap-1.5">
                        <ArrowLeft size={11} strokeWidth={2.5} />
                        anterior
                      </div>
                      <div className="text-[13.5px] font-extrabold text-spark-ink leading-tight line-clamp-2 group-hover:text-spark-brand-deep transition-colors">
                        {prev.title}
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}
                  {next ? (
                    <Link
                      href={`/educacao/${next.slug}`}
                      className="group p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline hover:border-spark-brand/30 transition-all duration-300 ease-premium hover:-translate-y-0.5 shadow-rest text-right"
                    >
                      <div className="text-eyebrow text-spark-ink-50 mb-1.5 flex items-center justify-end gap-1.5">
                        próxima
                        <ArrowRight size={11} strokeWidth={2.5} />
                      </div>
                      <div className="text-[13.5px] font-extrabold text-spark-ink leading-tight line-clamp-2 group-hover:text-spark-brand-deep transition-colors">
                        {next.title}
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </SectionReveal>
            )}
          </div>

          {/* Sidebar com lista do módulo (desktop) */}
          {desktop && siblings.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 shadow-rest">
                <div className="text-eyebrow text-spark-brand mb-4">✦ aulas do módulo</div>
                <ul className="space-y-1.5">
                  {siblings.map((s, i) => {
                    const isCurrent = s.id === lesson.id;
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/educacao/${s.slug}`}
                          className={cn(
                            "group flex items-start gap-2.5 px-2.5 py-2 rounded-spark-xl transition-all duration-300 ease-premium",
                            isCurrent
                              ? "bg-brand-grad-soft"
                              : "hover:bg-spark-surface-sunken/60",
                          )}
                        >
                          <span
                            className={cn(
                              "w-6 h-6 shrink-0 rounded-full flex items-center justify-center font-mono text-[10px] font-extrabold mt-0.5 transition-colors",
                              isCurrent
                                ? "bg-brand-grad text-white shadow-lift-brand"
                                : "bg-spark-surface-sunken text-spark-ink-50 group-hover:text-spark-ink",
                            )}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span
                              className={cn(
                                "block text-[12.5px] leading-tight font-extrabold",
                                isCurrent ? "text-spark-brand-deep" : "text-spark-ink",
                              )}
                            >
                              {s.title}
                            </span>
                            <span
                              className={cn(
                                "mt-0.5 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider",
                                isCurrent ? "text-spark-brand-deep/70" : "text-spark-ink-50",
                              )}
                            >
                              {s.kind === "video" ? (
                                <PlayCircle size={9} strokeWidth={2.5} />
                              ) : s.kind === "checklist" ? (
                                <ListChecks size={9} strokeWidth={2.5} />
                              ) : (
                                <FileText size={9} strokeWidth={2.5} />
                              )}
                              {s.kind === "video"
                                ? "vídeo"
                                : s.kind === "checklist"
                                  ? "checklist"
                                  : "aula"}
                            </span>
                          </span>
                          {isCurrent && (
                            <ArrowUpRight
                              size={12}
                              strokeWidth={2.5}
                              className="text-spark-brand-deep mt-0.5 shrink-0"
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function LessonMobile({ idOrSlug }: { idOrSlug: string }) {
  return <LessonBody idOrSlug={idOrSlug} />;
}

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const idOrSlug = params?.id ?? "";
  return (
    <>
      <ResponsiveShell
        mobile={<LessonMobile idOrSlug={idOrSlug} />}
        desktop={<LessonBody idOrSlug={idOrSlug} desktop />}
        active="educacao"
        customSidebar
      />
      <FloatingMainNav active="educacao" />
    </>
  );
}
