"use client";

import * as React from "react";
import {
  Clipboard,
  ClipboardCheck,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { parseColaRapida, type ParseResult } from "@/lib/cola-rapida";

/**
 * Botao + Modal "Cola Rápida do agente". Aluna copia tudo que o GPT
 * gerou (texto natural + bloco JSON delimitado) e cola aqui.
 *
 * O parser extrai blocos `===FICHA TTS PRODUTO===` e/ou
 * `===ROTEIROS TTS===` do texto e devolve via onParsed. O componente
 * pai decide o que fazer com os dados (auto-preencher campos do form).
 *
 * Modo "produto" mostra ambos os blocos no resultado.
 * Modo "scripts" mostra só roteiros (mas ainda parseia se a aluna
 * colar o texto completo do agente).
 */

type Props = {
  /** Modo determina qual bloco eh prioridade no preview do resultado. */
  mode: "produto" | "scripts";
  /** Chamado quando aluna confirma a aplicacao do parse. */
  onParsed: (result: ParseResult) => void;
  /** Custom className pro botao. */
  className?: string;
};

export function ColaRapidaButton({ mode, onParsed, className }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group inline-flex items-center gap-2 px-5 py-3 rounded-full bg-brand-grad text-white text-[13.5px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all duration-300 ease-premium",
          className,
        )}
      >
        <Clipboard size={15} strokeWidth={2.5} />
        Colar do agente
        <Sparkles
          size={13}
          strokeWidth={2.5}
          className="opacity-80 transition-transform duration-300 group-hover:rotate-12"
        />
      </button>

      {open && (
        <ColaRapidaModal
          mode={mode}
          onClose={() => setOpen(false)}
          onParsed={(r) => {
            onParsed(r);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

// =================================================================
// MODAL
// =================================================================

function ColaRapidaModal({
  mode,
  onClose,
  onParsed,
}: {
  mode: "produto" | "scripts";
  onClose: () => void;
  onParsed: (result: ParseResult) => void;
}) {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<ParseResult | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // Body scroll lock + ESC
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Autofocus na textarea
    setTimeout(() => taRef.current?.focus(), 100);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Atalho: Cmd/Ctrl + V cola E auto-parseia
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted) {
      e.preventDefault();
      setText(pasted);
      // Parseia automaticamente após colar
      setTimeout(() => doParse(pasted), 50);
    }
  };

  const doParse = (input?: string) => {
    setParsing(true);
    const r = parseColaRapida(input ?? text);
    setResult(r);
    setParsing(false);
  };

  const handleApply = () => {
    if (result) onParsed(result);
  };

  const hasAnything = result && (result.product || result.scripts);
  const hasErrors = result && (result.productError || result.scriptsError);
  const nothingFound =
    result && !result.product && !result.scripts && !result.productError && !result.scriptsError;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cola rápida do agente"
      className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(20, 20, 40, 0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-[640px] bg-spark-surface rounded-t-spark-2xl sm:rounded-spark-2xl border-2 border-spark-brand/20 shadow-hero overflow-hidden flex flex-col max-h-[92dvh]"
        style={{ animation: "cola-up 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-spark-hairline">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-brand-grad-soft flex items-center justify-center text-spark-brand-deep">
              <Clipboard size={18} strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="text-eyebrow text-spark-brand">✦ cola rápida</div>
              <h2 className="text-[15px] font-extrabold text-spark-ink tracking-tight leading-none mt-1">
                Colar resposta do agente
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full text-spark-ink-50 hover:text-spark-ink hover:bg-spark-surface-sunken flex items-center justify-center transition-colors"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-[12.5px] text-spark-ink-70 font-semibold leading-relaxed">
            Copia <strong>tudo</strong> que o agente ({mode === "produto" ? "do nicho" : "Scripts"})
            te respondeu e cola abaixo. O app extrai os blocos automaticamente e preenche os
            campos do form 💕
          </p>

          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setResult(null);
            }}
            onPaste={handlePaste}
            placeholder={`Cola aqui tudo do agente — incluindo o bloco:\n\n===FICHA TTS PRODUTO===\n\`\`\`json\n{ ... }\n\`\`\`\n===FIM===`}
            rows={10}
            className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[13px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand transition-colors resize-y font-mono"
          />

          {!result && text.length > 0 && (
            <button
              type="button"
              onClick={() => doParse()}
              disabled={parsing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full glass border-2 border-spark-brand/30 text-spark-brand-deep text-[13px] font-extrabold hover:bg-spark-brand-soft hover:-translate-y-0.5 transition-all duration-300"
            >
              {parsing ? (
                <>
                  <Loader2 size={13} strokeWidth={2.5} className="animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles size={13} strokeWidth={2.5} />
                  Analisar texto colado
                </>
              )}
            </button>
          )}

          {/* Resultado */}
          {result && (
            <div className="space-y-3">
              {result.product && (
                <ResultRow
                  emoji="📦"
                  label="Ficha de produto detectada"
                  detail={`${result.product.name}${
                    result.product.category ? ` · ${result.product.category}` : ""
                  }`}
                />
              )}
              {result.scripts && (
                <ResultRow
                  emoji="✍️"
                  label={`${result.scripts.scripts.length} roteiro${
                    result.scripts.scripts.length === 1 ? "" : "s"
                  } detectado${result.scripts.scripts.length === 1 ? "" : "s"}`}
                  detail={result.scripts.title || "Sem título"}
                />
              )}

              {result.productError && (
                <ErrorRow label="Erro no bloco de produto" detail={result.productError} />
              )}
              {result.scriptsError && (
                <ErrorRow label="Erro no bloco de roteiros" detail={result.scriptsError} />
              )}

              {nothingFound && (
                <div className="rounded-spark-xl bg-warn/5 border border-warn/20 px-4 py-3 text-[12.5px] text-warn font-extrabold leading-snug inline-flex items-start gap-2">
                  <AlertCircle size={14} strokeWidth={2.5} className="shrink-0 mt-0.5" />
                  <div>
                    Nenhum bloco encontrado. Confere se o agente terminou a resposta com{" "}
                    <code className="font-mono">===FICHA TTS PRODUTO===</code> ou{" "}
                    <code className="font-mono">===ROTEIROS TTS===</code>. Se sim, copia toda a
                    resposta de novo e cola.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-spark-hairline flex items-center justify-between gap-3 bg-spark-surface-sunken/40">
          <button
            type="button"
            onClick={onClose}
            className="text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink px-3 py-2 rounded-full transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!hasAnything}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-extrabold transition-all duration-300 ease-premium",
              hasAnything
                ? "bg-brand-grad text-white shadow-lift-brand hover:-translate-y-0.5"
                : "bg-spark-surface text-spark-ink-50 border border-spark-hairline cursor-not-allowed",
            )}
          >
            <ClipboardCheck size={13} strokeWidth={2.5} />
            {hasAnything ? "Auto-preencher" : "Cola texto válido"}
            {hasErrors && hasAnything && (
              <span className="opacity-75 text-[11px]">(com avisos)</span>
            )}
          </button>
        </div>

        <style jsx>{`
          @keyframes cola-up {
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
    </div>
  );
}

function ResultRow({ emoji, label, detail }: { emoji: string; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-spark-xl bg-good/5 border border-good/20">
      <span className="text-[18px] shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-extrabold text-good leading-tight inline-flex items-center gap-1.5">
          <Check size={12} strokeWidth={2.5} />
          {label}
        </div>
        <div className="mt-0.5 text-[12px] text-spark-ink-70 font-semibold truncate">{detail}</div>
      </div>
    </div>
  );
}

function ErrorRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-spark-xl bg-bad/5 border border-bad/20">
      <AlertCircle size={16} strokeWidth={2.5} className="text-bad shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-extrabold text-bad leading-tight">{label}</div>
        <div className="mt-0.5 text-[12px] text-spark-ink-70 leading-snug">{detail}</div>
      </div>
    </div>
  );
}
