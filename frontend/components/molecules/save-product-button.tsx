"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Save, AlertCircle, ArrowRight, Package } from "lucide-react";
import { useToast } from "@/components/molecules/dialog-provider";

type Props = {
  text: string;
  /** Foto anexada pela aluna no chat antes dessa ficha — vai junto pro save. */
  imageUrl?: string;
};

/**
 * Botão "Salvar ficha" que aparece abaixo da mensagem da Info quando
 * detecta pattern de ficha gerada. Aluna clica → backend extrai os 14
 * campos via Gemini Flash com schema Zod estrito e salva o produto.
 *
 * Independe de tool calling do modelo no chat. Funciona sempre.
 */
export function SaveProductButton({ text, imageUrl }: Props) {
  const toast = useToast();
  const [state, setState] = React.useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; url: string; name: string; alreadyExisted?: boolean }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  if (state.kind === "saved") {
    return (
      <div className="mt-3 flex items-center gap-2 p-3 rounded-2xl bg-spark-brand-soft border border-spark-brand/20">
        <div className="w-7 h-7 rounded-full bg-good text-white flex items-center justify-center shrink-0">
          <Check size={14} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-spark-ink">
            {state.alreadyExisted ? "Já tava salvo 💕" : "Salvo! 💕"}
          </div>
          <div className="text-[11.5px] text-spark-ink-50 truncate">{state.name}</div>
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
      const res = await fetch("/api/products/save-from-text", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, imageUrl }),
      });
      const data = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            id?: string;
            name?: string;
            url?: string;
            already_existed?: boolean;
            error?: string;
            detail?: string;
          }
        | null;
      if (!res.ok || !data?.ok || !data.url || !data.name) {
        const msg = data?.detail ?? data?.error ?? "Não consegui salvar agora.";
        setState({ kind: "error", message: msg });
        toast.error(msg);
        return;
      }
      setState({
        kind: "saved",
        url: data.url,
        name: data.name,
        alreadyExisted: data.already_existed,
      });
      toast.success(data.already_existed ? "Produto já estava salvo 💕" : "Produto salvo 💕");
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
            Salvando ficha…
          </>
        ) : (
          <>
            <Package size={14} strokeWidth={2} />
            Salvar essa ficha no catálogo 💾
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
