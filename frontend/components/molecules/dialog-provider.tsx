"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

// =================================================================
// Tipos
// =================================================================

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** True quando é ação irreversível (apagar). Botão vira vermelho. */
  destructive?: boolean;
};

type PromptOptions = {
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Validador opcional — retorna mensagem de erro ou null se ok. */
  validate?: (value: string) => string | null;
};

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  kind: ToastKind;
  message: string;
  emoji: string;
};

type DialogContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
  toast: (message: string, kind?: ToastKind) => void;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

// =================================================================
// Provider
// =================================================================

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = React.useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);
  const [promptState, setPromptState] = React.useState<{
    opts: PromptOptions;
    resolve: (v: string | null) => void;
  } | null>(null);
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const confirm = React.useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ opts, resolve });
    });
  }, []);

  const prompt = React.useCallback((opts: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptState({ opts, resolve });
    });
  }, []);

  const toast = React.useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = Math.random().toString(36).slice(2);
      const emoji = kind === "success" ? "✨" : kind === "error" ? "⚠️" : "💕";
      setToasts((prev) => [...prev, { id, kind, message, emoji }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    [],
  );

  const toastSuccess = React.useCallback((m: string) => toast(m, "success"), [toast]);
  const toastError = React.useCallback((m: string) => toast(m, "error"), [toast]);

  const value = React.useMemo<DialogContextValue>(
    () => ({ confirm, prompt, toast, toastSuccess, toastError }),
    [confirm, prompt, toast, toastSuccess, toastError],
  );

  const handleConfirm = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  const handlePrompt = (result: string | null) => {
    if (promptState) {
      promptState.resolve(result);
      setPromptState(null);
    }
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
      {/* Confirm dialog */}
      {confirmState && (
        <ConfirmDialog opts={confirmState.opts} onAnswer={handleConfirm} />
      )}
      {/* Prompt dialog */}
      {promptState && (
        <PromptDialog opts={promptState.opts} onAnswer={handlePrompt} />
      )}
      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </DialogContext.Provider>
  );
}

// =================================================================
// Hooks públicos
// =================================================================

export function useDialog(): DialogContextValue {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog: envolve o app com <DialogProvider />");
  }
  return ctx;
}

/** Atalho — só o confirm. */
export function useConfirm() {
  return useDialog().confirm;
}

/** Atalho — só o prompt (pedir texto). */
export function usePrompt() {
  return useDialog().prompt;
}

/** Atalho — só o toast. */
export function useToast() {
  const { toast, toastSuccess, toastError } = useDialog();
  return { toast, success: toastSuccess, error: toastError };
}

// =================================================================
// Confirm Dialog UI
// =================================================================

function ConfirmDialog({
  opts,
  onAnswer,
}: {
  opts: ConfirmOptions;
  onAnswer: (v: boolean) => void;
}) {
  const t = useTranslations("common.actions");
  // Esc pra cancelar
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAnswer(false);
      if (e.key === "Enter") onAnswer(true);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onAnswer]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <button
        type="button"
        aria-label={t("close")}
        onClick={() => onAnswer(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
      />
      <div className="relative w-full max-w-[400px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-spark-surface border border-spark-hairline shadow-[0_30px_80px_-30px_rgba(20,20,40,0.4)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        <div
          className={
            opts.destructive
              ? "h-1.5 bg-gradient-to-r from-bad via-bad to-bad/70"
              : "h-1.5 bg-brand-grad"
          }
        />
        <div className="px-6 pt-6 pb-5">
          <div className="text-[28px] mb-2">{opts.destructive ? "🗑️" : "💭"}</div>
          <h2 className="text-[20px] font-extrabold tracking-[-0.015em] leading-tight text-spark-ink">
            {opts.title}
          </h2>
          {opts.description && (
            <p className="mt-2 text-[13.5px] text-spark-ink-70 leading-relaxed">
              {opts.description}
            </p>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-2 flex-row-reverse">
          <button
            type="button"
            onClick={() => onAnswer(true)}
            className={
              opts.destructive
                ? "flex-1 h-[46px] rounded-full font-semibold text-[14px] bg-bad text-white shadow-[0_6px_18px_-8px_oklch(0.6_0.22_25/0.5)] hover:opacity-90 active:scale-[0.98] transition"
                : "flex-1 h-[46px] rounded-full font-semibold text-[14px] text-white bg-brand-grad shadow-[0_6px_18px_-8px_oklch(0.55_0.24_340/0.5)] hover:opacity-90 active:scale-[0.98] transition"
            }
            autoFocus
          >
            {opts.confirmLabel ?? t("confirm")}
          </button>
          <button
            type="button"
            onClick={() => onAnswer(false)}
            className="flex-1 h-[46px] rounded-full font-semibold text-[14px] text-spark-ink-70 bg-spark-surface-sunken hover:bg-spark-surface-sunken/80 hover:text-spark-ink transition"
          >
            {opts.cancelLabel ?? t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Prompt Dialog UI
// =================================================================

function PromptDialog({
  opts,
  onAnswer,
}: {
  opts: PromptOptions;
  onAnswer: (v: string | null) => void;
}) {
  const t = useTranslations("common.actions");
  const tErrors = useTranslations("errors.validation");
  const [value, setValue] = React.useState(opts.defaultValue ?? "");
  const [err, setErr] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Auto-focus + select all
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAnswer(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onAnswer]);

  const submit = () => {
    const trimmed = value.trim();
    if (opts.validate) {
      const msg = opts.validate(trimmed);
      if (msg) {
        setErr(msg);
        return;
      }
    }
    if (!trimmed) {
      setErr(tErrors("required"));
      return;
    }
    onAnswer(trimmed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <button
        type="button"
        aria-label={t("close")}
        onClick={() => onAnswer(null)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
      />
      <div className="relative w-full max-w-[440px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-spark-surface border border-spark-hairline shadow-[0_30px_80px_-30px_rgba(20,20,40,0.4)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        <div className="h-1.5 bg-brand-grad" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="px-6 pt-6 pb-5"
        >
          <div className="text-[28px] mb-2">📁</div>
          <h2 className="text-[20px] font-extrabold tracking-[-0.015em] leading-tight text-spark-ink">
            {opts.title}
          </h2>
          {opts.description && (
            <p className="mt-2 text-[13.5px] text-spark-ink-70 leading-relaxed">
              {opts.description}
            </p>
          )}
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (err) setErr(null);
            }}
            placeholder={opts.placeholder}
            className="mt-4 w-full px-4 h-[46px] rounded-[14px] bg-spark-surface-sunken border border-spark-border focus:border-spark-brand outline-none text-[15px] text-spark-ink placeholder:text-spark-ink-35"
          />
          {err && (
            <div className="mt-1.5 text-[12px] text-bad font-semibold">{err}</div>
          )}
          <div className="mt-5 flex gap-2 flex-row-reverse">
            <button
              type="submit"
              className="flex-1 h-[46px] rounded-full font-semibold text-[14px] text-white bg-brand-grad shadow-[0_6px_18px_-8px_oklch(0.55_0.24_340/0.5)] hover:opacity-90 active:scale-[0.98] transition"
            >
              {opts.confirmLabel ?? t("save")}
            </button>
            <button
              type="button"
              onClick={() => onAnswer(null)}
              className="flex-1 h-[46px] rounded-full font-semibold text-[14px] text-spark-ink-70 bg-spark-surface-sunken hover:bg-spark-surface-sunken/80 hover:text-spark-ink transition"
            >
              {opts.cancelLabel ?? t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =================================================================
// Toast Stack UI
// =================================================================

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  // bottom em mobile precisa subir pra não cobrir o BottomNav (~84px +
  // safe-area). Em lg+ (desktop tem sidebar lateral, não bottom nav) volta pro
  // bottom-4 padrão.
  return (
    <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] lg:bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 px-3 max-w-[420px] w-full pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onDismiss(t.id)}
          className={`pointer-events-auto rounded-2xl px-4 py-3 flex items-center gap-2.5 text-[13.5px] font-semibold shadow-[0_18px_40px_-22px_rgba(20,20,40,0.35)] border animate-in slide-in-from-bottom-4 fade-in duration-200 text-left ${
            t.kind === "success"
              ? "bg-good/95 text-white border-good"
              : t.kind === "error"
                ? "bg-bad/95 text-white border-bad"
                : "bg-spark-surface text-spark-ink border-spark-hairline"
          }`}
        >
          <span className="text-[18px] leading-none shrink-0">{t.emoji}</span>
          <span className="flex-1 leading-snug">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
