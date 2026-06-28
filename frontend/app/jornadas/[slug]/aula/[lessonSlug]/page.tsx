"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { useToast } from "@/components/molecules/dialog-provider";
import { BadgeUnlockModal, type AwardedBadge } from "@/components/journey/BadgeUnlockModal";
import { XPDelta } from "@/components/journey/XPDelta";
import {
  CommentComposer,
  CommentThread,
  type Comment,
} from "@/components/journey/CommentThread";
import { JourneyImmersiveBG } from "@/components/journey/JourneyImmersiveBG";
import { JourneyLoadingScreen } from "@/components/journey/JourneyLoadingScreen";
import type { CharacterStage } from "@/lib/journey/character-stage";
import { trackJourneyEvent } from "@/lib/journey/track";
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
  module_id?: string | null;
  module_slug?: string | null;
  module_title?: string | null;
};

type ApiResp = {
  journey: {
    id: string;
    slug: string;
    title: string;
    character_stage: CharacterStage;
  };
  lessons: Lesson[];
};

export default function AulaJornadaPage() {
  // ========= TODOS OS HOOKS NO TOPO (Rules of Hooks) =========
  const params = useParams<{ slug: string; lessonSlug: string }>();
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = React.useState<ApiResp | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [completing, setCompleting] = React.useState(false);
  const [xpDelta, setXpDelta] = React.useState<number | null>(null);
  const [awardedBadges, setAwardedBadges] = React.useState<AwardedBadge[]>([]);

  // Comments state
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(true);
  const [postingComment, setPostingComment] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<Comment | null>(null);

  // Carrega dados da jornada
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

  // Derived: aula atual (pode ser null se data ainda nao carregou ou slug invalido)
  const lesson = React.useMemo(
    () => data?.lessons.find((l) => l.slug === params.lessonSlug) ?? null,
    [data, params.lessonSlug],
  );
  const lessonId = lesson?.id ?? null;

  // Destino de "voltar" + redirect pos-complete: se aula tem modulo, vai
  // pro deck do modulo; senao (legacy), vai pro hub da jornada.
  const backHref = lesson?.module_slug
    ? `/jornadas/${params.slug}/modulo/${lesson.module_slug}`
    : `/jornadas/${params.slug}`;

  // Carrega comentarios quando lesson resolve
  const loadComments = React.useCallback(async () => {
    if (!lessonId) return;
    setCommentsLoading(true);
    try {
      const r = await fetch(
        `/api/jornadas/comments/by-lesson/${lessonId}`,
        { cache: "no-store" },
      );
      if (r.ok) {
        const j = (await r.json()) as { comments: Comment[] };
        setComments(j.comments);
      }
    } finally {
      setCommentsLoading(false);
    }
  }, [lessonId]);

  React.useEffect(() => {
    void loadComments();
  }, [loadComments]);

  // ========= HANDLERS (nao sao hooks, podem ficar antes ou depois) =========

  const handleComplete = async () => {
    if (!lesson) return;
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
          router.push(backHref);
        } else {
          trackJourneyEvent("lesson_completed", {
            journey_slug: params.slug as string,
            lesson_slug: params.lessonSlug as string,
            xp_earned: j.xp_earned ?? 0,
          });
          (j.badges_awarded ?? []).forEach((b) =>
            trackJourneyEvent("badge_earned", {
              badge_slug: b.slug,
              rarity: b.rarity,
            }),
          );
          setXpDelta(j.xp_earned ?? 0);
          if (j.badges_awarded && j.badges_awarded.length > 0) {
            setTimeout(() => setAwardedBadges(j.badges_awarded ?? []), 1500);
          } else {
            setTimeout(() => router.push(backHref), 1700);
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
    router.push(backHref);
  };

  const handlePostComment = async (body: string) => {
    if (!lessonId) return;
    setPostingComment(true);
    try {
      const res = await fetch(
        `/api/jornadas/comments/by-lesson/${lessonId}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            body,
            parent_id: replyingTo?.id ?? null,
          }),
        },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          reason?: string;
        };
        if (j.reason === "banned_word") {
          throw new Error("Conteúdo não permitido");
        }
        if (j.reason === "spam_pattern") {
          throw new Error("Comentário parece spam — tira links externos ou números");
        }
        throw new Error(j.error ?? "Erro ao postar");
      }
      const j = (await res.json()) as {
        xp_earned?: number;
        badges_awarded?: AwardedBadge[];
      };
      trackJourneyEvent("comment_posted", {
        journey_slug: params.slug as string,
        lesson_slug: params.lessonSlug as string,
        is_reply: !!replyingTo,
      });
      setReplyingTo(null);
      void loadComments();
      if (j.xp_earned) {
        setXpDelta(j.xp_earned);
      }
      if (j.badges_awarded && j.badges_awarded.length > 0) {
        setTimeout(() => setAwardedBadges(j.badges_awarded ?? []), 1500);
      }
    } finally {
      setPostingComment(false);
    }
  };

  const handleLikeComment = async (c: Comment) => {
    setComments((prev) =>
      prev.map((x) =>
        x.id === c.id
          ? {
              ...x,
              liked_by_me: !x.liked_by_me,
              like_count: x.like_count + (x.liked_by_me ? -1 : 1),
            }
          : x,
      ),
    );
    const method = c.liked_by_me ? "DELETE" : "POST";
    await fetch(`/api/jornadas/comments/${c.id}/like`, { method });
    void loadComments();
  };

  const handleDeleteComment = async (c: Comment) => {
    const res = await fetch(`/api/jornadas/comments/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      void loadComments();
      toast.success("Apagado");
    }
  };

  // ========= EARLY RETURNS (apos todos os hooks) =========

  if (loading) {
    return <JourneyLoadingScreen />;
  }

  if (!data) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-spark-ink-70">Jornada não encontrada.</p>
        <Link href="/jornadas" className="mt-4 text-spark-brand-deep underline">
          Voltar
        </Link>
      </div>
    );
  }

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

  // ========= JSX PRINCIPAL =========

  return (
    <div className="min-h-dvh pb-20 relative">
      <JourneyImmersiveBG
        stage={data.journey.character_stage}
        intensity="subtle"
        sparkles={false}
        fixed
      />

      {/* Back link sobre o BG (sem sheet, integrado ao ambiente) */}
      <header className="px-6 pt-6 max-w-[720px] mx-auto relative z-10">
        <Link
          href={backHref}
          className="text-[12.5px] font-extrabold text-white/85 hover:text-white inline-flex items-center gap-1.5"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
        >
          <ArrowLeft size={13} />{" "}
          {lesson.module_title ?? data.journey.title}
        </Link>
      </header>

      {/* Sheet branco — conteudo da aula respira aqui */}
      <article className="relative z-10 mx-4 md:mx-auto max-w-[720px] my-4 md:my-6 bg-white/92 backdrop-blur-md rounded-spark-2xl shadow-lift p-5 md:p-10 border border-white/40">
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

        {/* Comentários */}
        <div className="mt-10">
          <div className="text-eyebrow text-spark-brand-deep mb-3">
            💬 Comentários ({comments.length})
          </div>
          <CommentComposer
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onSubmit={handlePostComment}
            pending={postingComment}
          />
          <div className="mt-5">
            {commentsLoading ? (
              <div className="py-8 flex items-center justify-center text-spark-ink-50">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : (
              <CommentThread
                comments={comments}
                onReplyTo={setReplyingTo}
                onLike={handleLikeComment}
                onDelete={handleDeleteComment}
              />
            )}
          </div>
        </div>
      </article>

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
