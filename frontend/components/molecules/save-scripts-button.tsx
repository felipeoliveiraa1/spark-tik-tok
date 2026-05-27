"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Save, AlertCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/components/molecules/dialog-provider";

type Props = {
  text: string;
  productId?: string | null;
};

/**
 * Botão "Salvar roteiros" que detecta blocos `**ROTEIRO N — Estilo:**`
 * no texto da mensagem do Scripts e salva via /api/scripts/save-from-text.
 *
 * Independente de tool calling do modelo — a aluna controla o save.
 */
export function SaveScriptsButton({ text, productId }: Props) {
  const toast = useToast();
  const [state, setState] = React.useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; url: string; title: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  // Conta quantos blocos ROTEIRO existem (decide se mostra o botão)
  const blockCount = React.useMemo(() => {
    return (text.match(/\*\*\s*ROTEIRO\s+\d+\s*[—–-]\s*Estilo:/gi) ?? []).length;
  }, [text]);

  if (blockCount < 3) return null;
  if (state.kind === "saved") {
    return (
      <div className="mt-3 flex items-center gap-2 p-3 rounded-2xl bg-spark-brand-soft border border-spark-brand/20">
        <div className="w-7 h-7 rounded-full bg-good text-white flex items-center justify-center shrink-0">
          <Check size={14} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-spark-ink">Salvos! 💕</div>
          <div className="text-[11.5px] text-spark-ink-50 truncate">{state.title}</div>
        </div>
        <Link
          href={state.url}
          className="text-[12px] font-bold text-spark-brand inline-flex items-center gap-1 shrink-0"
        >
          Ver <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>
    );
  }

  const handleSave = async () => {
    setState({ kind: "saving" });
    try {
      const res = await fetch("/api/scripts/save-from-text", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, productId }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; id?: string; title?: string; url?: string; error?: string; detail?: string }
        | null;
      if (!res.ok || !data?.ok || !data.url || !data.title) {
        const msg = data?.detail ?? data?.error ?? "Não consegui salvar agora.";
        setState({ kind: "error", message: msg });
        toast.error(msg);
        return;
      }
      setState({ kind: "saved", url: data.url, title: data.title });
      toast.success("Roteiros salvos 💕");
    } catch {
      const msg = "Não consegui salvar agora.";
      setState({ kind: "error", message: msg });
      toast.error(msg);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={state.kind === "saving"}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-brand-grad text-white text-[13px] font-bold shadow-[0_6px_18px_-8px_oklch(0.55_0.24_340/0.5)] active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
      >
        {state.kind === "saving" ? (
          <>
            <Save size={14} strokeWidth={2} className="animate-pulse" />
            Salvando…
          </>
        ) : (
          <>
            <Save size={14} strokeWidth={2} />
            Salvar {blockCount} roteiros 💾
          </>
        )}
      </button>
      {state.kind === "error" && (
        <div className="text-[11.5px] text-bad inline-flex items-center gap-1.5">
          <AlertCircle size={11} strokeWidth={2} />
          {state.message}
        </div>
      )}
    </div>
  );
}
