"use client";

import * as React from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";

export function EmailCallout({
  email,
  headline,
  subtitle,
  copyLabel,
  copiedLabel,
}: {
  email: string;
  headline: string;
  subtitle: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback antigo (iOS Safari sem clipboard API em http)
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        // sem-copy: ignora silenciosamente, aluna pode selecionar manual
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="rounded-spark-2xl border-2 border-amber-300 bg-amber-50/90 backdrop-blur p-4 shadow-lift">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center">
          <AlertTriangle size={16} strokeWidth={2.6} className="text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-800">
            {headline}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copyLabel}
            className="mt-2 w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-spark-xl bg-white border border-amber-300 hover:border-amber-400 active:scale-[0.99] transition-all"
          >
            <span className="font-mono text-[13.5px] text-spark-ink truncate text-left">
              {email}
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 text-[10.5px] font-extrabold uppercase tracking-wider text-amber-700">
              {copied ? (
                <>
                  <Check size={12} strokeWidth={3} />
                  {copiedLabel}
                </>
              ) : (
                <>
                  <Copy size={12} strokeWidth={2.6} />
                  {copyLabel}
                </>
              )}
            </span>
          </button>
          <p className="mt-2.5 text-[12.5px] text-amber-900/90 leading-snug">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
