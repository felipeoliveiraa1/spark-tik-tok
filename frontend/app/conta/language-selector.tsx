"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages, Loader2, Check } from "lucide-react";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";
import { useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

/**
 * Seletor de idioma da interface. Aparece no /conta.
 * Mudanca eh aplicada imediatamente (PATCH /api/me + router.refresh).
 */
export function LanguageSelector() {
  const currentLocale = useLocale() as Locale;
  const [saving, setSaving] = React.useState<Locale | null>(null);
  const router = useRouter();
  const t = useTranslations("common.language");
  const toast = useToast();

  const change = async (next: Locale) => {
    if (next === currentLocale || saving) return;
    setSaving(next);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: next }),
      });
      if (!res.ok) {
        toast.error("");
        return;
      }
      router.refresh();
    } catch {
      toast.error("");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 text-eyebrow text-spark-brand-deep">
          <Languages size={11} strokeWidth={2.5} />
          {t("label")}
        </div>
        <p className="mt-1.5 text-[12px] text-spark-ink-70 leading-snug max-w-[44ch]">
          {t("description")}
        </p>
      </div>
      <div className="px-5 pb-5 grid grid-cols-3 gap-2">
        {LOCALES.map((loc) => {
          const meta = LOCALE_META[loc];
          const isActive = currentLocale === loc;
          const isLoading = saving === loc;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => void change(loc)}
              disabled={isActive || saving !== null}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 py-3 rounded-spark-xl text-[12px] font-extrabold transition-all duration-300 ease-premium",
                isActive
                  ? "bg-brand-grad text-white shadow-lift-brand"
                  : "bg-spark-surface-sunken text-spark-ink hover:bg-spark-brand-soft hover:text-spark-brand-deep",
                saving !== null && !isActive && "opacity-60",
                isActive && "cursor-default",
              )}
            >
              <span className="text-[20px] leading-none" aria-hidden>
                {meta.flag}
              </span>
              <span className="leading-none">{meta.nativeLabel}</span>
              {isActive && !isLoading && (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-spark-brand-deep"
                >
                  <Check size={9} strokeWidth={3} />
                </span>
              )}
              {isLoading && (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-spark-brand-deep"
                >
                  <Loader2 size={9} strokeWidth={3} className="animate-spin" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
