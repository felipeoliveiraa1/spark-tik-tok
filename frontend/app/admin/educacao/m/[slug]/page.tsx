"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Pencil,
  PlayCircle,
  FileText,
  ListChecks,
  Layers,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type LessonKind = "video" | "rich" | "checklist";

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

const ACCENT_BLOBS: Record<string, { c1: "rose" | "peach" | "lilac"; c2: "rose" | "peach" | "lilac" }> = {
  rose: { c1: "rose", c2: "peach" },
  peach: { c1: "peach", c2: "rose" },
  lilac: { c1: "lilac", c2: "rose" },
};

function KindIcon({ kind, size = 16 }: { kind: LessonKind; size?: number }) {
  if (kind === "video") return <PlayCircle size={size} strokeWidth={2.2} />;
  if (kind === "checklist") return <ListChecks size={size} strokeWidth={2.2} />;
  return <FileText size={size} strokeWidth={2.2} />;
}

function kindLabel(k: LessonKind): string {
  if (k === "video") return "Vídeo";
  if (k === "checklist") return "Checklist";
  return "Rich";
}

export default function AdminModuleDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const router = useRouter();

  const [mod, setMod] = React.useState<Module | null>(null);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const res = await fetch(`/api/educacao/modules/${slug}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { module: Module; lessons: Lesson[] };
      setMod(data.module);
      setLessons(data.lessons);
    }
    setLoading(false);
  }, [slug]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const confirm = useConfirm();
  const toast = useToast();

  const removeLesson = async (lessonSlug: string, title: string) => {
    const ok = await confirm({
      title: "Remover essa aula?",
      description: `"${title}" some pra todas as alunas.`,
      confirmLabel: "Remover",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/educacao/${lessonSlug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Aula removida 💕");
      await load();
    } else {
      toast.error("Não consegui remover");
    }
  };

  const moveLesson = async (lessonId: string, direction: -1 | 1) => {
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= lessons.length) return;

    const current = lessons[idx];
    const target = lessons[targetIdx];

    // Otimistic swap dos order_index
    const newLessons = [...lessons];
    newLessons[idx] = { ...current, order_index: target.order_index };
    newLessons[targetIdx] = { ...target, order_index: current.order_index };
    newLessons.sort((a, b) => a.order_index - b.order_index);
    setLessons(newLessons);

    // Persiste
    await Promise.all([
      fetch(`/api/educacao/${current.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_index: target.order_index }),
      }),
      fetch(`/api/educacao/${target.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_index: current.order_index }),
      }),
    ]);
  };

  if (loading) {
    return (
      <div className="text-center text-[13px] text-spark-ink-50 py-16 italic">
        Carregando módulo...
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="text-center py-16">
        <div className="text-[48px] mb-3">😕</div>
        <h2 className="font-display lowercase text-spark-ink text-[24px]">
          módulo não encontrado.
        </h2>
        <div className="mt-6">
          <Link href="/admin/educacao">
            <SButton variant="primary" Icon={ArrowLeft}>
              Voltar pra trilha
            </SButton>
          </Link>
        </div>
      </div>
    );
  }

  const blobs = ACCENT_BLOBS[mod.accent || "rose"] ?? ACCENT_BLOBS.rose;
  const kindCounts = lessons.reduce(
    (acc, l) => {
      acc[l.kind] = (acc[l.kind] ?? 0) + 1;
      return acc;
    },
    {} as Record<LessonKind, number>,
  );

  return (
    <div className="relative">
      {/* Hero do módulo */}
      <section className="relative overflow-hidden hero-radial -mx-4 lg:-mx-10 px-4 lg:px-10 pt-6 lg:pt-10 pb-12 rounded-spark-3xl">
        <HeroBlob color={blobs.c1} variant={1} className="-top-24 -left-32 w-[500px] h-[500px]" />
        <HeroBlob color={blobs.c2} variant={2} className="top-10 -right-24 w-[460px] h-[460px]" />
        <SparkleField count={12} seed={mod.order_index + 500} className="opacity-50" />

        <div className="relative max-w-[1100px] mx-auto">
          <Link
            href="/admin/educacao"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pra trilha
          </Link>

          <div className="mt-6 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-end">
            <div>
              <div className="text-eyebrow text-spark-brand">
                <span className="font-mono">CAP. {String(mod.order_index).padStart(2, "0")}</span>
                {mod.subtitle && (
                  <>
                    <span className="mx-2 opacity-50">·</span>
                    <span>{mod.subtitle}</span>
                  </>
                )}
                {!mod.is_published && (
                  <>
                    <span className="mx-2 opacity-50">·</span>
                    <span className="text-warn">rascunho</span>
                  </>
                )}
              </div>
              <h1
                className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
                style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
              >
                {mod.title.toLowerCase()}
              </h1>
              {mod.description && (
                <p className="mt-4 text-fluid-lead text-spark-ink-70 max-w-[58ch] leading-snug font-semibold">
                  {mod.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 lg:items-end">
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/educacao/m/${mod.slug}/edit`}>
                  <SButton variant="ghost" Icon={Pencil}>
                    Editar módulo
                  </SButton>
                </Link>
                <SButton
                  variant="primary"
                  Icon={Plus}
                  onClick={() =>
                    router.push(`/admin/educacao/nova?module=${mod.slug}`)
                  }
                >
                  Nova aula
                </SButton>
              </div>
              <div className="text-[11.5px] text-spark-ink-50 font-mono font-extrabold uppercase tracking-widest">
                {lessons.length} {lessons.length === 1 ? "aula" : "aulas"}
                {kindCounts.video > 0 && ` · ${kindCounts.video} vídeo${kindCounts.video > 1 ? "s" : ""}`}
                {kindCounts.rich > 0 && ` · ${kindCounts.rich} rich`}
                {kindCounts.checklist > 0 && ` · ${kindCounts.checklist} checklist`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de aulas */}
      <div className="max-w-[1100px] mx-auto mt-8">
        <SectionReveal direction="up" durationMs={500}>
          <div className="mb-5 flex items-center gap-2">
            <Sparkles size={13} strokeWidth={2.5} className="text-spark-brand-deep" />
            <span className="text-eyebrow text-spark-brand">✦ aulas do módulo</span>
          </div>
        </SectionReveal>

        {lessons.length === 0 ? (
          <SectionReveal direction="up">
            <div className="rounded-spark-3xl bg-spark-surface border border-spark-hairline p-12 text-center">
              <Layers size={40} strokeWidth={1.8} className="mx-auto text-spark-ink-50 mb-3" />
              <div className="font-display lowercase text-[22px] text-spark-ink leading-tight">
                módulo vazio.
              </div>
              <p className="text-[13px] text-spark-ink-50 mt-3 max-w-[40ch] mx-auto">
                Adiciona a primeira aula desse módulo — pode ser vídeo, conteúdo rich em markdown
                ou checklist interativo.
              </p>
              <div className="mt-6">
                <Link href={`/admin/educacao/nova?module=${mod.slug}`}>
                  <SButton variant="primary" Icon={Plus}>
                    Adicionar primeira aula
                  </SButton>
                </Link>
              </div>
            </div>
          </SectionReveal>
        ) : (
          <SectionReveal direction="up">
            <div className="rounded-spark-3xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
              {lessons.map((l, i) => (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  index={i}
                  showBorder={i > 0}
                  onDelete={() => removeLesson(l.slug, l.title)}
                  onMoveUp={i > 0 ? () => moveLesson(l.id, -1) : undefined}
                  onMoveDown={i < lessons.length - 1 ? () => moveLesson(l.id, 1) : undefined}
                />
              ))}
            </div>
          </SectionReveal>
        )}
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  index,
  showBorder,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  lesson: Lesson;
  index: number;
  showBorder: boolean;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-5 transition-colors duration-200 hover:bg-spark-brand-soft/30",
        showBorder ? "border-t border-spark-hairline" : "",
      )}
    >
      {/* Reorder grips */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!onMoveUp}
          className="w-6 h-5 flex items-center justify-center text-spark-ink-50 hover:text-spark-ink disabled:opacity-25 disabled:hover:text-spark-ink-50 transition-colors"
          aria-label="Subir"
        >
          <GripVertical size={11} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!onMoveDown}
          className="w-6 h-5 flex items-center justify-center text-spark-ink-50 hover:text-spark-ink disabled:opacity-25 disabled:hover:text-spark-ink-50 transition-colors"
          aria-label="Descer"
        >
          <GripVertical size={11} strokeWidth={2.5} />
        </button>
      </div>

      {/* Number */}
      <div className="w-12 h-12 rounded-full bg-spark-surface-sunken text-spark-ink-50 flex items-center justify-center font-display text-[16px] shrink-0 border border-spark-hairline">
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[10px] font-extrabold uppercase tracking-widest">
            <KindIcon kind={lesson.kind} size={10} />
            {kindLabel(lesson.kind)}
          </span>
          {!lesson.is_published && <SBadge tone="warn">rascunho</SBadge>}
        </div>
        <div className="text-[15px] font-extrabold text-spark-ink truncate group-hover:text-spark-brand-deep transition-colors">
          {lesson.title}
        </div>
        <div className="text-[11px] text-spark-ink-50 mt-1 font-mono truncate">
          /{lesson.slug}
        </div>
      </div>

      <Link
        href={`/admin/educacao/${lesson.slug}`}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-spark-surface-sunken text-[12.5px] font-extrabold text-spark-ink hover:bg-spark-brand-soft hover:text-spark-brand-deep transition-all duration-300"
      >
        <Pencil size={12} strokeWidth={2.5} />
        Editar
      </Link>
      <button
        onClick={onDelete}
        className="w-10 h-10 rounded-full text-spark-ink-50 hover:text-bad hover:bg-bad/10 flex items-center justify-center transition-colors duration-300"
        title="Remover aula"
        aria-label="Remover aula"
      >
        <Trash2 size={15} strokeWidth={2.2} />
      </button>
    </div>
  );
}
