"use client";

import * as React from "react";
import { ArrowRight, AlertCircle, Plus, X, Check } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { completeOnboardingAction } from "@/lib/auth";

// Nichos baseados nos templates da Yara — alinhado com Scripts AI.
const PRESET_NICHES = [
  "Skincare",
  "Makeup",
  "Suplementos",
  "Cabelo",
  "Perfumaria",
  "Casa e decoração",
  "Moda feminina",
  "Maternidade",
  "Eletrônicos",
  "Acessórios",
  "Pet",
  "Calçados",
];

function WelcomeForm({ desktop = false }: { desktop?: boolean }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [customOpen, setCustomOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  const toggle = (n: string) => {
    setSelected((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const addCustom = () => {
    const v = customValue.trim();
    if (!v) return;
    if (selected.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setCustomValue("");
      setCustomOpen(false);
      return;
    }
    setSelected((prev) => [...prev, v]);
    setCustomValue("");
    setCustomOpen(false);
  };

  async function onSubmit(formData: FormData) {
    setError(null);
    if (selected.length === 0) {
      setError("Escolhe pelo menos um nicho.");
      return;
    }
    // Junta os nichos em CSV pra salvar na coluna niche (text).
    formData.set("niche", selected.join(", "));
    setPending(true);
    const result = await completeOnboardingAction(formData);
    setPending(false);
    if (result && "error" in result) {
      setError(result.error);
    }
  }

  return (
    <form
      action={onSubmit}
      className={`flex flex-col flex-1 ${desktop ? "max-w-[520px] mx-auto py-14 px-8" : "px-5"}`}
    >
      <div className={desktop ? "" : "pt-[70px]"}>
        <SparkMark size={desktop ? 96 : 80} />
        <div className="mt-7 text-[13px] font-bold text-spark-brand uppercase tracking-[0.06em]">
          Bem-vinda
        </div>
        <h1
          className={`font-extrabold tracking-[-0.025em] mt-2 leading-[1.1] ${desktop ? "text-[40px]" : "text-[28px]"}`}
        >
          Vamos te conhecer
          <br />
          rapidinho. 💕
        </h1>
        <p className="text-[14px] text-spark-ink-50 mt-2.5 max-w-[440px]">
          A IA usa essas informações pra calibrar o tom dos scripts e adaptar o conteúdo pros seus nichos.
        </p>
      </div>

      <div className="mt-7">
        <div className="text-[12px] font-bold text-spark-ink-50 mb-1.5 uppercase tracking-[0.04em]">
          Como podemos te chamar?
        </div>
        <SInput name="name" placeholder="Seu primeiro nome" autoComplete="given-name" required />
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-[0.04em]">
            Em quais nichos você atua?
          </div>
          <div className="text-[11px] text-spark-ink-50 font-mono">
            {selected.length > 0 && `${selected.length} selecionado${selected.length > 1 ? "s" : ""}`}
          </div>
        </div>
        <p className="text-[12px] text-spark-ink-50 mb-3 leading-snug">
          Pode marcar quantos quiser. Não tá na lista? Toca em &ldquo;Outro&rdquo; e adiciona o seu. ✨
        </p>

        <div className="flex flex-wrap gap-1.5">
          {PRESET_NICHES.map((n) => {
            const active = selected.includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggle(n)}
                className={`px-3 py-2 rounded-full border text-[13px] font-semibold transition-colors inline-flex items-center gap-1.5 ${
                  active
                    ? "bg-brand-grad text-white border-transparent shadow-[0_4px_14px_-6px_oklch(0.55_0.24_340/0.5)]"
                    : "bg-spark-surface border-spark-hairline text-spark-ink-70 hover:border-spark-ink/30"
                }`}
              >
                {active && <Check size={12} strokeWidth={2.5} />}
                {n}
              </button>
            );
          })}

          {/* Chips custom (não-preset) já selecionados */}
          {selected
            .filter((s) => !PRESET_NICHES.includes(s))
            .map((custom) => (
              <button
                key={custom}
                type="button"
                onClick={() => toggle(custom)}
                className="px-3 py-2 rounded-full border bg-brand-grad text-white border-transparent text-[13px] font-semibold inline-flex items-center gap-1.5 shadow-[0_4px_14px_-6px_oklch(0.55_0.24_340/0.5)]"
              >
                <Check size={12} strokeWidth={2.5} />
                {custom}
                <X size={12} strokeWidth={2.5} className="opacity-80" />
              </button>
            ))}

          {/* Botão Outro / input pra digitar */}
          {customOpen ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-spark-surface border border-spark-brand/40">
              <input
                autoFocus
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setCustomOpen(false);
                    setCustomValue("");
                  }
                }}
                placeholder="Digita seu nicho"
                maxLength={40}
                className="bg-transparent outline-none text-[13px] font-semibold w-[140px] px-1 placeholder:text-spark-ink-35"
              />
              <button
                type="button"
                onClick={addCustom}
                aria-label="Adicionar nicho"
                className="w-7 h-7 rounded-full bg-brand-grad text-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <Check size={12} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomOpen(false);
                  setCustomValue("");
                }}
                aria-label="Cancelar"
                className="w-7 h-7 rounded-full text-spark-ink-50 flex items-center justify-center"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              className="px-3 py-2 rounded-full border-2 border-dashed border-spark-brand/40 text-spark-brand-deep text-[13px] font-semibold hover:bg-spark-brand-soft transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={13} strokeWidth={2} />
              Outro
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] inline-flex items-center gap-2">
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </div>
      )}

      <div className="flex-1" />

      <div className={`pb-[30px] ${desktop ? "pt-8" : "pt-6"}`}>
        <SButton type="submit" variant="primary" size="lg" full IconRight={ArrowRight} disabled={pending}>
          {pending ? "Salvando…" : "Começar a usar"}
        </SButton>
      </div>
    </form>
  );
}

export default function WelcomePage() {
  return <ResponsiveShell mobile={<WelcomeForm />} desktop={<WelcomeForm desktop />} fullBleed />;
}
