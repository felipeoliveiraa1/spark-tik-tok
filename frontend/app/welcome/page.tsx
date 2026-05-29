"use client";

import * as React from "react";
import { ArrowRight, AlertCircle, Plus, X, Check } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { completeOnboardingAction } from "@/lib/auth";

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
      className={`flex flex-col flex-1 relative ${desktop ? "max-w-[560px] mx-auto py-14 px-8" : "px-6"}`}
    >
      <div className={desktop ? "" : "pt-[70px]"}>
        <SectionReveal direction="down" durationMs={500}>
          <SparkMark size={desktop ? 96 : 80} />
        </SectionReveal>
        <SectionReveal direction="up" delay={150}>
          <div className="mt-8 text-eyebrow text-spark-brand">✦ bem-vinda</div>
        </SectionReveal>
        <SectionReveal direction="up" delay={250} durationMs={800}>
          <h1
            className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
            style={{
              fontSize: desktop ? "clamp(2.25rem, 4vw, 3rem)" : "clamp(2rem, 8vw, 2.5rem)",
            }}
          >
            vamos te conhecer
            <br />
            <span className="text-grad-brand">rapidinho.</span>
          </h1>
        </SectionReveal>
        <SectionReveal direction="up" delay={400}>
          <p className="text-fluid-lead text-spark-ink-70 mt-4 max-w-[44ch] leading-snug font-semibold">
            A IA usa essas informações pra calibrar o tom dos scripts e adaptar o conteúdo pros
            seus nichos.
          </p>
        </SectionReveal>
      </div>

      <SectionReveal direction="up" delay={550}>
        <div className="mt-8">
          <div className="text-eyebrow text-spark-ink-50 mb-2">
            Como podemos te chamar?
          </div>
          <SInput
            name="name"
            placeholder="Seu primeiro nome"
            autoComplete="given-name"
            required
          />
        </div>
      </SectionReveal>

      <SectionReveal direction="up" delay={700}>
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-eyebrow text-spark-ink-50">
              Em quais nichos você atua?
            </div>
            <div className="text-[11px] text-spark-ink-50 font-mono">
              {selected.length > 0 &&
                `${selected.length} selecionado${selected.length > 1 ? "s" : ""}`}
            </div>
          </div>
          <p className="text-[12.5px] text-spark-ink-50 mb-4 leading-snug">
            Pode marcar quantos quiser. Não tá na lista? Toca em &ldquo;Outro&rdquo; e adiciona o
            seu. ✨
          </p>

          <div className="flex flex-wrap gap-2">
            {PRESET_NICHES.map((n) => {
              const active = selected.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggle(n)}
                  className={`px-3.5 py-2 rounded-full border text-[13px] font-extrabold transition-all duration-300 ease-premium inline-flex items-center gap-1.5 ${
                    active
                      ? "bg-brand-grad text-white border-transparent shadow-lift-brand hover:-translate-y-0.5"
                      : "bg-spark-surface border-spark-hairline text-spark-ink-70 hover:border-spark-brand/40 hover:bg-spark-brand-soft/40 hover:-translate-y-0.5"
                  }`}
                >
                  {active && <Check size={12} strokeWidth={2.5} />}
                  {n}
                </button>
              );
            })}

            {selected
              .filter((s) => !PRESET_NICHES.includes(s))
              .map((custom) => (
                <button
                  key={custom}
                  type="button"
                  onClick={() => toggle(custom)}
                  className="px-3.5 py-2 rounded-full border bg-brand-grad text-white border-transparent text-[13px] font-extrabold inline-flex items-center gap-1.5 shadow-lift-brand hover:-translate-y-0.5 transition-all duration-300 ease-premium"
                >
                  <Check size={12} strokeWidth={2.5} />
                  {custom}
                  <X size={12} strokeWidth={2.5} className="opacity-85" />
                </button>
              ))}

            {customOpen ? (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-spark-surface border border-spark-brand/40 shadow-rest">
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
                  className="bg-transparent outline-none text-[13px] font-extrabold w-[140px] px-1 placeholder:text-spark-ink-35"
                />
                <button
                  type="button"
                  onClick={addCustom}
                  aria-label="Adicionar nicho"
                  className="w-7 h-7 rounded-full bg-brand-grad text-white flex items-center justify-center active:scale-95 transition-transform shadow-lift-brand"
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
                  className="w-7 h-7 rounded-full text-spark-ink-50 hover:bg-spark-surface-sunken flex items-center justify-center"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCustomOpen(true)}
                className="px-3.5 py-2 rounded-full border-2 border-dashed border-spark-brand/40 text-spark-brand-deep text-[13px] font-extrabold hover:bg-spark-brand-soft hover:-translate-y-0.5 transition-all duration-300 ease-premium inline-flex items-center gap-1.5"
              >
                <Plus size={13} strokeWidth={2.5} />
                Outro
              </button>
            )}
          </div>
        </div>
      </SectionReveal>

      {error && (
        <div className="mt-4 px-4 py-3 rounded-spark-xl bg-bad/5 border border-bad/20 text-bad text-[13px] inline-flex items-center gap-2 font-extrabold">
          <AlertCircle size={14} strokeWidth={2.5} />
          {error}
        </div>
      )}

      <div className="flex-1" />

      <div className={`pb-[30px] ${desktop ? "pt-8" : "pt-6"}`}>
        <SectionReveal direction="up" delay={850}>
          <SButton
            type="submit"
            variant="primary"
            size="lg"
            full
            IconRight={ArrowRight}
            disabled={pending}
          >
            {pending ? "Salvando..." : "Começar a usar"}
          </SButton>
        </SectionReveal>
      </div>
    </form>
  );
}

function Wrapper({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className="flex flex-col flex-1 relative overflow-auto hero-radial">
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[520px] h-[520px]" />
      <HeroBlob color="peach" variant={2} className="top-1/4 -right-32 w-[480px] h-[480px]" />
      <SparkleField count={14} seed={789} className="opacity-50" />
      <WelcomeForm desktop={desktop} />
    </div>
  );
}

export default function WelcomePage() {
  return <ResponsiveShell mobile={<Wrapper />} desktop={<Wrapper desktop />} fullBleed />;
}
