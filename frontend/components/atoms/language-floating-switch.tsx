"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe, Check, Loader2 } from "lucide-react";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

/**
 * Botao flutuante de idioma pra paginas publicas (landing, login,
 * forgot-password, reset-password, formulario). Salva preferencia
 * em cookie via POST /api/locale (sem precisar de auth).
 *
 * Mostra a bandeira do idioma atual e expande pra dropdown ao clicar.
 */
export function LanguageFloatingSwitch({
  className,
  placement = "top-right",
}: {
  className?: string;
  placement?: "top-right" | "top-left" | "bottom-right";
}) {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState<Locale | null>(null);
  const meta = LOCALE_META[currentLocale] ?? LOCALE_META["pt-BR"];

  // Fecha ao clicar fora
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const change = async (next: Locale) => {
    if (next === currentLocale || saving) return;
    setSaving(next);
    try {
      const res = await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } catch {
      // Silencioso
    } finally {
      setSaving(null);
    }
  };

  const placementCls =
    placement === "top-right"
      ? "fixed top-4 right-4 z-40"
      : placement === "top-left"
        ? "fixed top-4 left-4 z-40"
        : "fixed bottom-4 right-4 z-40";

  return (
    <div ref={ref} className={cn(placementCls, className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Idioma"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full glass shadow-lift hover:-translate-y-0.5 transition-all duration-300 ease-premium text-[12.5px] font-extrabold text-spark-ink"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
      >
        <span className="text-[15px] leading-none" aria-hidden>
          {meta.flag}
        </span>
        <span className="hidden sm:inline">{meta.nativeLabel}</span>
        <Globe size={11} strokeWidth={2.5} className="opacity-70" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 min-w-[180px] rounded-spark-xl bg-spark-surface border border-spark-hairline shadow-hero overflow-hidden"
        >
          {LOCALES.map((loc) => {
            const m = LOCALE_META[loc];
            const isActive = currentLocale === loc;
            const isLoading = saving === loc;
            return (
              <button
                key={loc}
                type="button"
                role="menuitem"
                onClick={() => void change(loc)}
                disabled={isActive || saving !== null}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-[13px] font-extrabold text-left transition-colors",
                  isActive
                    ? "bg-spark-brand/8 text-spark-brand-deep"
                    : "text-spark-ink hover:bg-spark-surface-sunken",
                  saving !== null && !isActive && "opacity-60",
                )}
              >
                <span className="text-[18px] leading-none" aria-hidden>
                  {m.flag}
                </span>
                <span className="flex-1">{m.nativeLabel}</span>
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin text-spark-brand-deep" />
                ) : isActive ? (
                  <Check size={14} strokeWidth={2.5} className="text-spark-brand-deep" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
