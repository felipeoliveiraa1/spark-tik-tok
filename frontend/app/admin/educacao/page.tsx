"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Layers,
  Pencil,
  PlayCircle,
  FileText,
  ListChecks,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type LessonKind = "video" | "rich" | "checklist" | "ebook";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  kind: LessonKind;
  cover_url: string | null;
  order_index: number;
  is_published: boolean;
  module_id: string | null;
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
  lessons: Lesson[];
};

const ACCENT_CLASSES: Record<string, { gradFrom: string; gradTo: string }> = {
  rose: { gradFrom: "from-rose-300/60", gradTo: "to-pink-200/40" },
  peach: { gradFrom: "from-orange-200/60", gradTo: "to-rose-200/40" },
  lilac: { gradFrom: "from-purple-200/60", gradTo: "to-pink-200/40" },
};
function accentClasses(accent: string | null) {
  return ACCENT_CLASSES[accent || "rose"] ?? ACCENT_CLASSES.rose;
}

function KindIcon({ kind, size = 10 }: { kind: LessonKind; size?: number }) {
  if (kind === "video") return <PlayCircle size={size} strokeWidth={2.5} />;
  if (kind === "checklist") return <ListChecks size={size} strokeWidth={2.5} />;
  if (kind === "ebook") return <BookOpen size={size} strokeWidth={2.5} />;
  return <FileText size={size} strokeWidth={2.5} />;
}

export default function AdminEducacaoPage() {
  const router = useRouter();
  const [modules, setModules] = React.useState<Module[]>([]);
  const [orphans, setOrphans] = React.useState<Lesson[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/educacao?all=1", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as {
        modules: Module[];
        orphan_lessons: Lesson[];
      };
      setModules(data.modules ?? []);
      setOrphans(data.orphan_lessons ?? []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const confirm = useConfirm();
  const toast = useToast();

  const removeModule = async (slug: string) => {
    const ok = await confirm({
      title: "Remover esse módulo?",
      description:
        "As aulas dele NÃO serão deletadas — ficam órfãs (sem módulo). Você pode reanexar depois.",
      confirmLabel: "Remover módulo",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/educacao/modules/${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Módulo removido 💕");
      await load();
    } else {
      toast.error("Não consegui remover");
    }
  };

  const removeLesson = async (slug: string) => {
    const ok = await confirm({
      title: "Remover essa aula?",
      description: `A aula "${slug}" some pra todas as alunas. Você pode recriar pelo painel.`,
      confirmLabel: "Remover",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/educacao/${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Aula removida 💕");
      await load();
    } else {
      toast.error("Não consegui remover");
    }
  };

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0) + orphans.length;
  const publishedModules = modules.filter((m) => m.is_published).length;

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial -mx-4 lg:-mx-10 px-4 lg:px-10 pt-6 lg:pt-10 pb-12 rounded-spark-3xl">
        <HeroBlob color="rose" variant={1} className="-top-24 -left-32 w-[500px] h-[500px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-24 w-[460px] h-[460px]" />
        <SparkleField count={14} seed={2025} className="opacity-50" />

        <div className="relative max-w-[1200px] mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pro painel
          </Link>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-eyebrow text-spark-brand">
                <Layers size={13} strokeWidth={2.5} />
                ✦ trilha de educação
              </div>
              <h1
                className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
                style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
              >
                módulos do <span className="text-grad-brand">método.</span>
              </h1>
              <p className="mt-4 text-[14px] text-spark-ink-70 font-semibold">
                {modules.length} {modules.length === 1 ? "módulo" : "módulos"} ·{" "}
                {publishedModules} publicado{publishedModules === 1 ? "" : "s"} ·{" "}
                {totalLessons} aulas no total
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SButton
                variant="primary"
                Icon={Plus}
                onClick={() => router.push("/admin/educacao/m/novo")}
              >
                Novo módulo
              </SButton>
              <SButton
                variant="ghost"
                Icon={Plus}
                onClick={() => router.push("/admin/educacao/nova")}
              >
                Nova aula avulsa
              </SButton>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <div className="max-w-[1200px] mx-auto mt-10">
        {loading ? (
          <div className="text-center text-[13px] text-spark-ink-50 py-16 italic">
            Carregando...
          </div>
        ) : modules.length === 0 && orphans.length === 0 ? (
          <SectionReveal direction="up">
            <div className="rounded-spark-3xl bg-spark-surface border border-spark-hairline p-12 text-center">
              <div className="text-[48px] mb-3">📚</div>
              <div className="font-display lowercase text-[22px] text-spark-ink leading-tight">
                trilha vazia.
              </div>
              <p className="text-[13px] text-spark-ink-50 mt-3 max-w-[40ch] mx-auto">
                Cria seu primeiro módulo pra organizar as aulas.
              </p>
              <div className="mt-6">
                <Link href="/admin/educacao/m/novo">
                  <SButton variant="primary" Icon={Plus}>
                    Criar primeiro módulo
                  </SButton>
                </Link>
              </div>
            </div>
          </SectionReveal>
        ) : (
          <div className="space-y-10">
            {/* Grid de módulos */}
            {modules.length > 0 && (
              <section>
                <SectionReveal direction="up" durationMs={500}>
                  <div className="mb-6 flex items-center gap-2">
                    <Sparkles size={13} strokeWidth={2.5} className="text-spark-brand-deep" />
                    <span className="text-eyebrow text-spark-brand">✦ os módulos</span>
                  </div>
                </SectionReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {modules.map((m, i) => (
                    <ModuleCard
                      key={m.id}
                      mod={m}
                      index={i}
                      onDelete={removeModule}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Aulas órfãs (sem módulo) */}
            {orphans.length > 0 && (
              <section>
                <SectionReveal direction="up" durationMs={500}>
                  <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-eyebrow text-warn flex items-center gap-2">
                        <AlertCircle size={13} strokeWidth={2.5} />
                        ✦ aulas sem módulo
                      </div>
                      <h2
                        className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
                        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
                      >
                        {orphans.length} {orphans.length === 1 ? "órfã" : "órfãs"}
                      </h2>
                    </div>
                    <p className="text-[12px] text-spark-ink-50 max-w-[42ch] font-semibold">
                      Aulas que ainda não foram anexadas a um módulo. Edite e escolha o módulo.
                    </p>
                  </div>
                </SectionReveal>

                <SectionReveal direction="up">
                  <div className="rounded-spark-3xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
                    {orphans.map((l, i) => (
                      <LessonRow
                        key={l.id}
                        lesson={l}
                        showBorder={i > 0}
                        onDelete={removeLesson}
                      />
                    ))}
                  </div>
                </SectionReveal>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =================================================================
// MODULE CARD
// =================================================================

function ModuleCard({
  mod,
  index,
  onDelete,
}: {
  mod: Module;
  index: number;
  onDelete: (slug: string) => void;
}) {
  const acc = accentClasses(mod.accent);
  const kindCounts = mod.lessons.reduce(
    (acc, l) => {
      acc[l.kind] = (acc[l.kind] ?? 0) + 1;
      return acc;
    },
    {} as Record<LessonKind, number>,
  );

  return (
    <SectionReveal delay={Math.min(index * 60, 320)}>
      <div className="group h-full rounded-spark-3xl bg-spark-surface border border-spark-hairline overflow-hidden hover-lift shadow-rest hover:shadow-hero transition-all duration-500 ease-premium">
        <Link href={`/admin/educacao/m/${mod.slug}`} className="block">
          {/* Cover */}
          <div className={cn("relative aspect-[16/10] overflow-hidden bg-gradient-to-br", acc.gradFrom, acc.gradTo)}>
            {mod.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mod.cover_url}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-display lowercase leading-none tracking-tight text-spark-ink/15 select-none"
                  style={{ fontSize: "clamp(5rem, 10vw, 10rem)" }}
                >
                  {String(mod.order_index).padStart(2, "0")}
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full glass border border-white/30 text-spark-ink text-[10.5px] font-extrabold uppercase tracking-widest shadow-rest font-mono">
                cap. {String(mod.order_index).padStart(2, "0")}
              </span>
              {!mod.is_published && <SBadge tone="warn">rascunho</SBadge>}
            </div>

            <div className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowUpRight size={16} strokeWidth={2.5} className="text-spark-ink" />
            </div>

            <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 text-[11px] text-white font-extrabold uppercase tracking-wider">
              {kindCounts.video > 0 && (
                <span className="inline-flex items-center gap-1">
                  <KindIcon kind="video" size={11} />
                  {kindCounts.video}
                </span>
              )}
              {kindCounts.rich > 0 && (
                <span className="inline-flex items-center gap-1">
                  <KindIcon kind="rich" size={11} />
                  {kindCounts.rich}
                </span>
              )}
              {kindCounts.checklist > 0 && (
                <span className="inline-flex items-center gap-1">
                  <KindIcon kind="checklist" size={11} />
                  {kindCounts.checklist}
                </span>
              )}
              {kindCounts.ebook > 0 && (
                <span className="inline-flex items-center gap-1">
                  <KindIcon kind="ebook" size={11} />
                  {kindCounts.ebook}
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-5 lg:p-6">
            {mod.subtitle && (
              <div className="text-eyebrow text-spark-brand mb-1.5">{mod.subtitle}</div>
            )}
            <h3
              className="font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
              style={{ fontSize: "clamp(1.25rem, 2vw, 1.625rem)" }}
            >
              {mod.title.toLowerCase()}
            </h3>
            {mod.description && (
              <p className="mt-2 text-[12.5px] text-spark-ink-70 leading-relaxed line-clamp-2">
                {mod.description}
              </p>
            )}
            <div className="mt-3 text-[11px] text-spark-ink-50 font-mono font-extrabold uppercase tracking-widest">
              {mod.lessons.length} {mod.lessons.length === 1 ? "aula" : "aulas"}
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5 -mt-1">
          <Link
            href={`/admin/educacao/m/${mod.slug}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface-sunken text-[11.5px] font-extrabold text-spark-ink hover:bg-spark-brand-soft hover:text-spark-brand-deep transition-all duration-300"
          >
            <Pencil size={11} strokeWidth={2.5} />
            Editar
          </Link>
          <button
            onClick={() => onDelete(mod.slug)}
            className="w-8 h-8 rounded-full text-spark-ink-50 hover:text-bad hover:bg-bad/10 flex items-center justify-center transition-colors duration-300"
            title="Remover módulo"
            aria-label="Remover módulo"
          >
            <Trash2 size={13} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// LESSON ROW (pra órfãs)
// =================================================================

function LessonRow({
  lesson,
  showBorder,
  onDelete,
}: {
  lesson: Lesson;
  showBorder: boolean;
  onDelete: (slug: string) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-5 transition-colors duration-200 hover:bg-spark-brand-soft/30",
        showBorder ? "border-t border-spark-hairline" : "",
      )}
    >
      <div className="w-10 h-10 rounded-full bg-spark-surface-sunken flex items-center justify-center shrink-0 text-spark-ink-70">
        <KindIcon kind={lesson.kind} size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <SBadge tone="brand">{lesson.kind}</SBadge>
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
        onClick={() => onDelete(lesson.slug)}
        className="w-10 h-10 rounded-full text-spark-ink-50 hover:text-bad hover:bg-bad/10 flex items-center justify-center transition-colors duration-300"
        title="Remover aula"
        aria-label="Remover aula"
      >
        <Trash2 size={15} strokeWidth={2.2} />
      </button>
    </div>
  );
}
