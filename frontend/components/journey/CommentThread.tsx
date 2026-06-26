"use client";

import * as React from "react";
import { Heart, MessageCircle, Loader2, Trash2 } from "lucide-react";
import { useToast, useConfirm } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

export type Comment = {
  id: string;
  parent_id: string | null;
  user_id: string;
  body: string;
  like_count: number;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  liked_by_me: boolean;
  is_mine: boolean;
};

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "";
  const m = Math.round(ms / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

/**
 * Renderiza comments em 1 nivel de threading.
 * Pais sao top-level, replies vem agrupadas embaixo do parent.
 */
export function CommentThread({
  comments,
  onReplyTo,
  onLike,
  onDelete,
}: {
  comments: Comment[];
  onReplyTo: (parent: Comment) => void;
  onLike: (c: Comment) => void;
  onDelete: (c: Comment) => void;
}) {
  const parents = comments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, Comment[]>();
  for (const c of comments) {
    if (c.parent_id) {
      const arr = repliesByParent.get(c.parent_id) ?? [];
      arr.push(c);
      repliesByParent.set(c.parent_id, arr);
    }
  }

  if (parents.length === 0) {
    return (
      <div className="text-center py-8 text-spark-ink-50 text-[13px]">
        Sem comentários ainda. Seja a primeira! 💬
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parents.map((c) => (
        <div key={c.id} className="space-y-2">
          <CommentItem
            comment={c}
            onReplyTo={onReplyTo}
            onLike={onLike}
            onDelete={onDelete}
          />
          {(repliesByParent.get(c.id) ?? []).map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              indented
              onReplyTo={onReplyTo}
              onLike={onLike}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  indented,
  onReplyTo,
  onLike,
  onDelete,
}: {
  comment: Comment;
  indented?: boolean;
  onReplyTo: (parent: Comment) => void;
  onLike: (c: Comment) => void;
  onDelete: (c: Comment) => void;
}) {
  const confirm = useConfirm();
  const handleDelete = async () => {
    const ok = await confirm({
      title: "Apagar este comentário?",
      description: "Não dá pra desfazer.",
      confirmLabel: "Apagar",
      destructive: true,
    });
    if (ok) onDelete(comment);
  };

  return (
    <div className={cn("flex gap-3", indented && "ml-10")}>
      <div className="shrink-0 w-9 h-9 rounded-full bg-spark-brand-soft overflow-hidden flex items-center justify-center">
        {comment.author_avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.author_avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-spark-brand-deep font-extrabold text-[14px]">
            {comment.author_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-extrabold text-spark-ink text-[13.5px]">
            {comment.author_name}
          </span>
          <span className="text-[11px] text-spark-ink-35">{fmtRelative(comment.created_at)}</span>
        </div>
        <p className="text-[13.5px] text-spark-ink leading-relaxed whitespace-pre-wrap break-words">
          {comment.body}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <button
            onClick={() => onLike(comment)}
            className={cn(
              "inline-flex items-center gap-1 text-[12px] font-extrabold transition-colors",
              comment.liked_by_me
                ? "text-spark-brand-deep"
                : "text-spark-ink-50 hover:text-spark-brand-deep",
            )}
          >
            <Heart
              size={12}
              fill={comment.liked_by_me ? "currentColor" : "none"}
              strokeWidth={2.2}
            />
            {comment.like_count > 0 ? comment.like_count : "curtir"}
          </button>
          {!indented && (
            <button
              onClick={() => onReplyTo(comment)}
              className="inline-flex items-center gap-1 text-[12px] font-extrabold text-spark-ink-50 hover:text-spark-brand-deep transition-colors"
            >
              <MessageCircle size={12} strokeWidth={2.2} />
              responder
            </button>
          )}
          {comment.is_mine && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1 text-[12px] font-extrabold text-spark-ink-35 hover:text-bad transition-colors"
            >
              <Trash2 size={11} strokeWidth={2.2} />
              apagar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentComposer({
  replyingTo,
  onCancelReply,
  onSubmit,
  pending,
}: {
  replyingTo: Comment | null;
  onCancelReply: () => void;
  onSubmit: (body: string) => Promise<void>;
  pending: boolean;
}) {
  const [text, setText] = React.useState("");
  const toast = useToast();

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await onSubmit(trimmed);
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao postar");
    }
  };

  return (
    <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface p-3">
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between gap-2 text-[11.5px] text-spark-ink-50">
          <span>
            Respondendo a <strong className="text-spark-ink">{replyingTo.author_name}</strong>
          </span>
          <button onClick={onCancelReply} className="text-spark-brand-deep hover:underline">
            cancelar
          </button>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={replyingTo ? "Sua resposta…" : "Compartilha o que achou…"}
        rows={2}
        maxLength={2000}
        className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13.5px] resize-none focus:outline-none focus:border-spark-brand/40"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-spark-ink-35">{text.length}/2000</span>
        <button
          onClick={handleSubmit}
          disabled={pending || !text.trim()}
          className="px-4 py-1.5 rounded-full bg-brand-grad text-white text-[12.5px] font-extrabold inline-flex items-center gap-1.5 shadow-lift-brand hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {pending && <Loader2 size={12} className="animate-spin" />}
          Postar
        </button>
      </div>
    </div>
  );
}
