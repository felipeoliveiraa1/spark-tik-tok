"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { useToast } from "@/components/molecules/dialog-provider";
import { BadgeUnlockModal, type AwardedBadge } from "@/components/journey/BadgeUnlockModal";
import { XPDelta } from "@/components/journey/XPDelta";
import { cn } from "@/lib/cn";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: "video" | "rich" | "checklist" | "ebook";
  youtube_id: string | null;
  body_md: string | null;
  file_url: string | null;
  file_name: string | null;
  xp_reward: number;
  requires_proof: boolean;
  completed: boolean;
  locked: boolean;
};

type ApiResp = {
  journey: { id: string; slug: string; title: string };
  lessons: Lesson[];
};

export default function AulaJornadaPage() {
  const params = useParams<{ slug: string; lessonSlug: string }>();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = React.useState<ApiResp | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [completing, setCompleting] = React.useState(false);
  const [xpDelta, setXpDelta] = React.useState<number | null>(null);
  const [awardedBadges, setAwardedBadges] = React.useState<AwardedBadge[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/jornadas/${params.slug}`, { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as ApiResp;
        setData(j);
      }
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-spark-ink-50">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 text-center">
        <p className="text-spark-ink-70">Jornada não encontrada.</p>
      </div>
    );
  }

  const lesson = data.lessons.find((l) => l.slug === params.lessonSlug);
  if (!lesson) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-spark-ink-70">Aula não encontrada.</p>
        <Link href={`/jornadas/${params.slug}`} className="mt-4 text-spark-brand-deep underline">
          Voltar
        </Link>
      </div>
    );
  }

  if (lesson.locked) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <Lock size={32} className="text-spark-ink-35 mb-3" />
        <h2 className="font-display text-[20px] text-spark-ink">Aula bloqueada</h2>
        <p className="text-spark-ink-70 mt-2 max-w-[40ch] text-[13.5px]">
          Complete a aula anterior pra desbloquear essa.
        </p>
        <Link
          href={`/jornadas/${params.slug}`}
          className="mt-5 px-5 py-2 rounded-full bg-brand-grad text-white text-[12.5px] font-extrabold inline-flex items-center gap-2 shadow-lift-brand"
        >
          <ArrowLeft size={12} /> Voltar
        </Link>
      </div>
    );
  }

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch(
        `/api/jornadas/${params.slug}/lesson/${lesson.id}/complete`,
        { method: "POST" },
      );
      if (res.ok) {
        const j = (await res.json()) as {
          xp_earned?: number;
          xp_total?: number;
          already_completed?: boolean;
          badges_awarded?: AwardedBadge[];
        };
        if (j.already_completed) {
          toast.toast("Já estava marcada como concluída");
          router.push(`/jornadas/${params.slug}`);
        } else {
          // 1) Anima XP
          setXpDelta(j.xp_earned ?? 0);
          // 2) Se houver badges, abre modal logo apos o XP delta (1.5s)
          if (j.badges_awarded && j.badges_awarded.length > 0) {
            setTimeout(() => setAwardedBadges(j.badges_awarded ?? []), 1500);
          } else {
            // Sem badge: volta pra jornada apos 1.7s
            setTimeout(() => router.push(`/jornadas/${params.slug}`), 1700);
          }
        }
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Erro ao marcar");
      }
    } finally {
      setCompleting(false);
    }
  };

  const handleBadgesClose = () => {
    setAwardedBadges([]);
    router.push(`/jornadas/${params.slug}`);
  };

  return (
    <div className="min-h-dvh hero-radial pb-20">
      <header className="px-6 pt-6 max-w-[860px] mx-auto">
        <Link
          href={`/jornadas/${params.slug}`}
          className="text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} /> {data.journey.title}
        </Link>
      </header>

      <div className="px-6 max-w-[860px] mx-auto mt-6">
        <h1 className="font-display text-[26px] md:text-[34px] text-spark-ink leading-tight">
          {lesson.title}
        </h1>
        {lesson.description && (
          <p className="text-spark-ink-70 mt-2">{lesson.description}</p>
        )}

        {/* Conteúdo conforme kind */}
        <div className="mt-6 rounded-spark-xl border border-spark-hairline bg-spark-surface overflow-hidden">
          {lesson.kind === "video" && lesson.youtube_id && (
            <div className="aspect-video bg-spark-ink/5">
              <iframe
                src={`https://www.youtube.com/embed/${lesson.youtube_id}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          )}

          {lesson.body_md && (
            <div className="px-5 py-5">
              <div className="prose prose-sm max-w-none text-spark-ink-70 whitespace-pre-wrap text-[14px] leading-relaxed">
                {lesson.body_md}
              </div>
            </div>
          )}

          {lesson.kind === "ebook" && lesson.file_url && (
            <div className="px-5 py-5">
              <a
                href={lesson.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand"
              >
                📄 Baixar {lesson.file_name ?? "eBook"}
              </a>
            </div>
          )}
        </div>

        {/* Botão completar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {lesson.completed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-extrabold">
              <CheckCircle2 size={14} />
              Concluída
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing}
              className={cn(
                "px-5 py-2.5 rounded-full bg-brand-grad text-white text-[13px] font-extrabold inline-flex items-center gap-2 shadow-lift-brand hover:-translate-y-0.5 transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {completing && <Loader2 size={13} className="animate-spin" />}
              Marcar como concluída · +{lesson.xp_reward} XP
            </button>
          )}
        </div>

        {/* Comentários: placeholder pra Semana 3 */}
        <div className="mt-10 rounded-spark-xl border border-dashed border-spark-hairline bg-spark-surface-sunken/30 p-6 text-center">
          <div className="text-eyebrow text-spark-ink-50">Em breve</div>
          <div className="text-[13px] text-spark-ink-70 mt-1">
            Comentários das alunas chegam na próxima atualização 💬
          </div>
        </div>
      </div>

      {/* XP delta float */}
      {xpDelta !== null && (
        <XPDelta amount={xpDelta} onDone={() => setXpDelta(null)} />
      )}

      {/* Badge unlock modal */}
      {awardedBadges.length > 0 && (
        <BadgeUnlockModal badges={awardedBadges} onClose={handleBadgesClose} />
      )}
    </div>
  );
}
