"use client";

import * as React from "react";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  hasSeenTutorial,
  markTutorialSeen,
  type TutorialStep,
} from "@/lib/tutorial";

type Props = {
  steps: TutorialStep[];
  storageKey: string;
  autoStart?: boolean;
  open?: boolean;
  onClose?: () => void;
};

type Measure = { rect: DOMRect | null; ready: boolean };
const EMPTY_MEASURE: Measure = { rect: null, ready: true };

type TooltipSlot = "center" | "top" | "bottom";

export function TutorialOverlay({
  steps,
  storageKey,
  autoStart = true,
  open: externalOpen,
  onClose: externalOnClose,
}: Props) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [measure, setMeasure] = React.useState<Measure>(EMPTY_MEASURE);

  const open = externalOpen ?? internalOpen;

  // Auto-start (espera 2.5s pra dar tempo do splash terminar)
  React.useEffect(() => {
    if (externalOpen !== undefined) return;
    if (!autoStart) return;
    if (hasSeenTutorial(storageKey)) return;
    const t = setTimeout(() => {
      setInternalOpen(true);
      setStepIndex(0);
    }, 2500);
    return () => clearTimeout(t);
  }, [autoStart, storageKey, externalOpen]);

  React.useEffect(() => {
    if (externalOpen) setStepIndex(0);
  }, [externalOpen]);

  // Body scroll lock
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = React.useCallback(() => {
    markTutorialSeen(storageKey);
    if (externalOnClose) externalOnClose();
    else setInternalOpen(false);
  }, [storageKey, externalOnClose]);

  const next = React.useCallback(() => {
    setStepIndex((i) => {
      if (i < steps.length - 1) return i + 1;
      markTutorialSeen(storageKey);
      if (externalOnClose) externalOnClose();
      else setInternalOpen(false);
      return i;
    });
  }, [steps.length, storageKey, externalOnClose]);

  const prev = React.useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Keyboard
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  const step = steps[stepIndex];
  const isWelcome = !step?.target;

  // Encontra o ELEMENTO VISIVEL com o data-tutorial-id (ResponsiveShell
  // renderiza mobile + desktop em paralelo, um deles fica display:none).
  // Mede rect com retry se invalido.
  React.useEffect(() => {
    if (!open || !step) {
      setMeasure(EMPTY_MEASURE);
      return;
    }
    if (!step.target) {
      setMeasure(EMPTY_MEASURE);
      return;
    }

    let cancelled = false;
    setMeasure({ rect: null, ready: false });

    const findVisible = (): HTMLElement | null => {
      const candidates = document.querySelectorAll<HTMLElement>(
        `[data-tutorial-id="${step.target}"]`,
      );
      // Procura o primeiro com dimensoes nao-zero (i.e. visivel)
      for (const el of Array.from(candidates)) {
        const r = el.getBoundingClientRect();
        if (r.width > 20 && r.height > 20) return el;
      }
      // Nenhum visivel ainda — retorna o primeiro pra retry medir
      return candidates[0] ?? null;
    };

    let retries = 0;
    const MAX_RETRIES = 15;

    const measureWithRetry = (el: HTMLElement) => {
      if (cancelled) return;
      // Reverifica visibilidade — el pode ter virado display:none por resize
      const visibleEl = findVisible() ?? el;
      const r = visibleEl.getBoundingClientRect();
      const isValid = r.width > 20 && r.height > 20;
      if (isValid || retries >= MAX_RETRIES) {
        setMeasure({ rect: r, ready: true });
        return;
      }
      retries++;
      setTimeout(() => measureWithRetry(visibleEl), 120);
    };

    const positionAndMeasure = () => {
      const el = findVisible();
      if (!el) {
        if (retries < MAX_RETRIES) {
          retries++;
          setTimeout(positionAndMeasure, 150);
        }
        return;
      }
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
        el.scrollIntoView();
      }
      setTimeout(() => measureWithRetry(el), 550);
    };

    positionAndMeasure();

    const onUpdate = () => {
      const el = findVisible();
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width > 20 && r.height > 20) {
        setMeasure({ rect: r, ready: true });
      }
    };
    window.addEventListener("resize", onUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onUpdate);
    };
  }, [open, step]);

  // Decide SLOT do tooltip — antes do early return (regras dos hooks)
  const slot: TooltipSlot = React.useMemo(() => {
    if (isWelcome || !measure.rect) return "center";
    const H = typeof window !== "undefined" ? window.innerHeight : 800;
    const targetCenterY = measure.rect.top + measure.rect.height / 2;
    return targetCenterY < H / 2 ? "bottom" : "top";
  }, [isWelcome, measure.rect]);

  if (!open || !step) return null;

  const padding = step.padding ?? 10;
  const radius = step.radius ?? 16;
  const rect = measure.rect;
  const ready = measure.ready;

  // POSICIONAMENTO ABSOLUTO com transform pra centering — sem flex pra
  // evitar conflitos de containing block. Animation so com opacity.
  const positionStyle: React.CSSProperties = (() => {
    const widthStyle = "min(440px, calc(100vw - 24px))";
    if (slot === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: widthStyle,
      };
    }
    if (slot === "top") {
      return {
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        width: widthStyle,
      };
    }
    return {
      bottom: 12,
      left: "50%",
      transform: "translateX(-50%)",
      width: widthStyle,
    };
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tour guiado"
      className="fixed inset-0 z-[200]"
    >
      {/* SVG spotlight */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ animation: "tutorial-fade-in 240ms ease-out both" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id={`spotlight-${stepIndex}`}>
            <rect width="100%" height="100%" fill="white" />
            {rect && ready && !isWelcome && (
              <rect
                x={Math.max(0, rect.left - padding)}
                y={Math.max(0, rect.top - padding)}
                width={rect.width + padding * 2}
                height={rect.height + padding * 2}
                rx={radius}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(20, 20, 40, 0.78)"
          mask={`url(#spotlight-${stepIndex})`}
          style={{ transition: "all 280ms cubic-bezier(0.2, 0.7, 0.2, 1)" }}
        />
        {/* Glow ring */}
        {rect && ready && !isWelcome && (
          <rect
            x={Math.max(0, rect.left - padding)}
            y={Math.max(0, rect.top - padding)}
            width={rect.width + padding * 2}
            height={rect.height + padding * 2}
            rx={radius}
            fill="none"
            stroke="oklch(0.72 0.22 350)"
            strokeWidth={2}
            style={{
              filter: "drop-shadow(0 0 14px oklch(0.72 0.22 350 / 0.6))",
              animation: "tutorial-pulse 2s ease-in-out infinite",
              transition: "all 280ms cubic-bezier(0.2, 0.7, 0.2, 1)",
            }}
          />
        )}
      </svg>

      {/* Tooltip — fixed direto, com transform pra centrar */}
      <div
        className="fixed z-[201] pointer-events-auto"
        style={positionStyle}
      >
        {/* Layer que anima — APENAS opacity, sem transform pra nao conflitar */}
        <div
          style={{
            animation: "tutorial-card-in 280ms ease-out both",
          }}
        >
          <TooltipCard
            step={step}
            stepIndex={stepIndex}
            total={steps.length}
            onPrev={prev}
            onNext={next}
            onClose={close}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes tutorial-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes tutorial-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.55;
          }
        }
        @keyframes tutorial-card-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// =================================================================
// CARD
// =================================================================

function TooltipCard({
  step,
  stepIndex,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  step: TutorialStep;
  stepIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const isLast = stepIndex === total - 1;
  return (
    <div className="w-full p-5 lg:p-6 rounded-spark-2xl bg-spark-surface border-2 border-spark-brand/30 shadow-hero">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-eyebrow text-spark-brand flex items-center gap-1.5">
          <Sparkles size={11} strokeWidth={2.5} />
          tour · {stepIndex + 1}/{total}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar tour"
          className="w-8 h-8 rounded-full text-spark-ink-50 hover:text-spark-ink hover:bg-spark-surface-sunken flex items-center justify-center transition-colors"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      <h3
        className="font-display lowercase leading-tight text-spark-ink mb-2.5 tracking-tight"
        style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.625rem)" }}
      >
        {step.title.toLowerCase()}
      </h3>

      <p className="text-[13.5px] text-spark-ink-70 leading-relaxed font-semibold">
        {step.description}
      </p>

      <div className="mt-5 flex items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              "h-1 rounded-full transition-all duration-300 ease-premium",
              i === stepIndex
                ? "w-6 bg-brand-grad"
                : i < stepIndex
                  ? "w-2 bg-spark-brand-deep/50"
                  : "w-2 bg-spark-surface-sunken",
            )}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken text-[12px] font-extrabold transition-colors"
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            Voltar
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="text-spark-ink-50 hover:text-spark-ink text-[11px] font-extrabold uppercase tracking-wider px-2 py-2 transition-colors"
          >
            Pular tour
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-premium"
        >
          {isLast ? "Concluir tour" : "Próxima"}
          {!isLast && (
            <ChevronRight
              size={13}
              strokeWidth={2.5}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          )}
        </button>
      </div>
    </div>
  );
}
