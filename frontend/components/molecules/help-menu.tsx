"use client";

import * as React from "react";
import {
  HelpCircle,
  Sparkles,
  Bug,
  Lightbulb,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/molecules/dialog-provider";

/**
 * HelpMenu — botao "?" flutuante que abre popover com 3 acoes:
 *   - Refazer tour (se onReopenTour foi passado)
 *   - Reportar bug
 *   - Sugerir melhoria
 *
 * Bug/sugestao abrem modal com form (titulo + descricao). page_url e
 * user_agent vao automaticamente pro endpoint /api/feedback.
 *
 * Uso:
 *   <HelpMenu onReopenTour={() => setTourOpen(true)} />
 *
 * Sem tour:
 *   <HelpMenu />
 */

type FeedbackType = "bug" | "suggestion";

type Props = {
  onReopenTour?: () => void;
  /** Se passado, ajusta posicionamento do botao (default: top-right). */
  className?: string;
};

export function HelpMenu({ onReopenTour, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [feedbackType, setFeedbackType] = React.useState<FeedbackType | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fecha popover ao clicar fora
  React.useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const reopenTour = () => {
    setOpen(false);
    onReopenTour?.();
  };

  const openFeedback = (type: FeedbackType) => {
    setOpen(false);
    setFeedbackType(type);
  };

  return (
    <>
      <div ref={containerRef} className={cn("relative inline-flex", className)}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Ajuda"
          aria-expanded={open}
          className={cn(
            "group inline-flex items-center justify-center w-10 h-10 rounded-full glass border border-spark-hairline text-spark-ink-70 hover:text-spark-brand-deep hover:bg-spark-brand-soft hover:-translate-y-0.5 transition-all duration-300 ease-premium shadow-rest",
            open && "text-spark-brand-deep bg-spark-brand-soft -translate-y-0.5",
          )}
        >
          <HelpCircle size={16} strokeWidth={2.4} />
        </button>

        {/* Popover */}
        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-[260px] rounded-spark-2xl bg-spark-surface border-2 border-spark-brand/25 shadow-hero overflow-hidden z-50"
            style={{ animation: "help-pop-in 200ms cubic-bezier(0.2, 0.7, 0.2, 1) both" }}
          >
            <div className="px-4 pt-4 pb-3 border-b border-spark-hairline">
              <div className="text-eyebrow text-spark-brand">✦ ajuda</div>
              <div className="text-[13px] font-semibold text-spark-ink-70 mt-1">
                Como posso te ajudar?
              </div>
            </div>

            <div className="p-1.5">
              {onReopenTour && (
                <MenuItem
                  emoji="✨"
                  Icon={Sparkles}
                  label="Refazer tour"
                  hint="Tutorial guiado dessa tela"
                  onClick={reopenTour}
                />
              )}
              <MenuItem
                emoji="🐛"
                Icon={Bug}
                label="Reportar bug"
                hint="Algo não funciona como deveria"
                onClick={() => openFeedback("bug")}
              />
              <MenuItem
                emoji="💡"
                Icon={Lightbulb}
                label="Sugerir melhoria"
                hint="Uma ideia pra ficar ainda melhor"
                onClick={() => openFeedback("suggestion")}
              />
            </div>
          </div>
        )}
      </div>

      {feedbackType && (
        <FeedbackModal type={feedbackType} onClose={() => setFeedbackType(null)} />
      )}

      <style jsx>{`
        @keyframes help-pop-in {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

// =================================================================
// MENU ITEM
// =================================================================

function MenuItem({
  emoji,
  Icon,
  label,
  hint,
  onClick,
}: {
  emoji: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-spark-xl text-left transition-all duration-200 hover:bg-spark-brand-soft/50"
    >
      <div className="w-9 h-9 rounded-full bg-spark-surface-sunken flex items-center justify-center text-[16px] transition-transform duration-300 group-hover:scale-110">
        <span aria-hidden>{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-extrabold text-spark-ink tracking-tight">{label}</div>
        <div className="text-[11px] text-spark-ink-50 truncate">{hint}</div>
      </div>
      <Icon
        size={12}
        strokeWidth={2.5}
        className="text-spark-ink-35 group-hover:text-spark-brand-deep transition-colors"
      />
    </button>
  );
}

// =================================================================
// FEEDBACK MODAL
// =================================================================

const TYPE_LABELS: Record<FeedbackType, { title: string; emoji: string; hint: string; placeholder: string }> = {
  bug: {
    title: "Reportar bug",
    emoji: "🐛",
    hint: "Conta o que aconteceu — o time olha tudo que chega.",
    placeholder:
      "Descreve com o máximo de detalhe: o que você estava fazendo, o que esperava acontecer, o que aconteceu de errado.",
  },
  suggestion: {
    title: "Sugerir melhoria",
    emoji: "💡",
    hint: "Manda tua ideia — a gente lê tudo!",
    placeholder:
      "Explica tua ideia: o que sente falta, o que tornaria o app melhor pra você, qual problema isso resolveria.",
  },
};

function FeedbackModal({ type, onClose }: { type: FeedbackType; onClose: () => void }) {
  const meta = TYPE_LABELS[type];
  const toast = useToast();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Body scroll lock
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC fecha
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const submit = async () => {
    if (title.trim().length < 3) {
      toast.error("Coloca um título com pelo menos 3 letras");
      return;
    }
    if (description.trim().length < 5) {
      toast.error("Capricha um pouquinho mais na descrição");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          page_url: typeof window !== "undefined" ? window.location.href : null,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Não consegui enviar agora");
        return;
      }
      toast.success(
        type === "bug" ? "Bug reportado, obrigada 💕" : "Sugestão enviada, obrigada 💕",
      );
      onClose();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meta.title}
      className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(20, 20, 40, 0.5)" }}
    >
      <div
        className="w-full sm:max-w-[520px] bg-spark-surface rounded-t-spark-2xl sm:rounded-spark-2xl border-2 border-spark-brand/20 shadow-hero overflow-hidden flex flex-col max-h-[90dvh]"
        style={{ animation: "feedback-up 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-spark-hairline">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-brand-grad-soft flex items-center justify-center text-[20px]">
              <span aria-hidden>{meta.emoji}</span>
            </div>
            <div className="min-w-0">
              <div className="text-eyebrow text-spark-brand">
                ✦ {type === "bug" ? "bug" : "sugestão"}
              </div>
              <h2 className="text-[15px] font-extrabold text-spark-ink tracking-tight leading-none mt-1">
                {meta.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full text-spark-ink-50 hover:text-spark-ink hover:bg-spark-surface-sunken flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-[12.5px] text-spark-ink-70 font-semibold leading-relaxed">
            {meta.hint}
          </p>

          <div>
            <label className="block text-[12px] font-extrabold text-spark-ink uppercase tracking-wider mb-1.5">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "bug" ? "ex: avatar não atualiza após upload" : "ex: poder duplicar um roteiro"}
              maxLength={120}
              disabled={submitting}
              className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand transition-colors disabled:opacity-60"
            />
            <div className="mt-1 text-[10.5px] text-spark-ink-50 font-mono text-right">
              {title.length}/120
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-extrabold text-spark-ink uppercase tracking-wider mb-1.5">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={meta.placeholder}
              maxLength={2000}
              rows={6}
              disabled={submitting}
              className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand transition-colors disabled:opacity-60 resize-none"
            />
            <div className="mt-1 text-[10.5px] text-spark-ink-50 font-mono text-right">
              {description.length}/2000
            </div>
          </div>

          <div className="rounded-spark-xl bg-spark-surface-sunken/60 border border-spark-hairline px-3.5 py-2.5 text-[11px] text-spark-ink-50 leading-snug font-mono">
            ✦ Vou enviar junto a URL da tela onde você está pra ajudar o time a
            reproduzir.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-spark-hairline flex items-center justify-between gap-3 bg-spark-surface-sunken/40">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink px-3 py-2 rounded-full transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-extrabold transition-all duration-300 ease-premium",
              submitting
                ? "bg-spark-surface text-spark-ink-50 border border-spark-hairline cursor-not-allowed"
                : "bg-brand-grad text-white shadow-lift-brand hover:-translate-y-0.5",
            )}
          >
            {submitting ? (
              <>
                <Loader2 size={13} strokeWidth={2.5} className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send size={13} strokeWidth={2.5} />
                Enviar
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes feedback-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
