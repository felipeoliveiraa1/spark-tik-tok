"use client";

import * as React from "react";
import { ArrowRight, AlertCircle } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { completeOnboardingAction } from "@/lib/auth";

const NICHES = [
  "Beleza e skincare",
  "Suplementos e saúde",
  "Moda feminina",
  "Casa e decoração",
  "Acessórios",
  "Outro",
];

function WelcomeForm({ desktop = false }: { desktop?: boolean }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [niche, setNiche] = React.useState(NICHES[0]);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await completeOnboardingAction(formData);
    setPending(false);
    if (result && "error" in result) {
      setError(result.error);
    }
  }

  return (
    <form action={onSubmit} className={`flex flex-col flex-1 ${desktop ? "max-w-[480px] mx-auto py-14 px-8" : "px-5"}`}>
      <div className={desktop ? "" : "pt-[70px]"}>
        <SparkMark size={desktop ? 44 : 36} />
        <div className="mt-7 text-[13px] font-bold text-spark-brand uppercase tracking-[0.06em]">
          Bem-vinda
        </div>
        <h1 className={`font-extrabold tracking-[-0.025em] mt-2 leading-[1.1] ${desktop ? "text-[40px]" : "text-[28px]"}`}>
          Vamos te conhecer
          <br />
          rapidinho.
        </h1>
        <p className="text-[14px] text-spark-ink-50 mt-2.5 max-w-[400px]">
          A IA usa essas informações pra calibrar o tom dos scripts e as recomendações de virais.
        </p>
      </div>

      <div className="mt-7">
        <div className="text-[12px] font-bold text-spark-ink-50 mb-1.5 uppercase tracking-[0.04em]">
          Como podemos te chamar?
        </div>
        <SInput
          name="name"
          placeholder="Seu primeiro nome"
          autoComplete="given-name"
          required
        />
      </div>

      <div className="mt-4">
        <div className="text-[12px] font-bold text-spark-ink-50 mb-1.5 uppercase tracking-[0.04em]">
          Qual o nicho que você foca?
        </div>
        <input type="hidden" name="niche" value={niche} />
        <div className="flex flex-wrap gap-1.5">
          {NICHES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNiche(n)}
              className={`px-3 py-2 rounded-full border text-[13px] font-semibold transition-colors ${
                niche === n
                  ? "bg-spark-ink text-white border-spark-ink"
                  : "bg-spark-surface border-spark-hairline text-spark-ink-70 hover:border-spark-ink/30"
              }`}
            >
              {n}
            </button>
          ))}
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
  return (
    <ResponsiveShell
      mobile={<WelcomeForm />}
      desktop={<WelcomeForm desktop />}
      fullBleed
    />
  );
}
