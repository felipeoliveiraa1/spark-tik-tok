"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { SChip } from "@/components/atoms/s-chip";
import { cn } from "@/lib/cn";
import { NICHES, USER } from "@/lib/mock";
import { completeOnboardingAction } from "@/lib/auth";

const experiences = [
  { id: "researching", label: "Ainda não, tô pesquisando" },
  { id: "starting", label: "Tô começando agora" },
  { id: "selling", label: "Já vendo há um tempo" },
];

function ProfileContent({ desktop = false }: { desktop?: boolean }) {
  const [exp, setExp] = React.useState("starting");
  const [niche, setNiche] = React.useState("Saúde");

  return (
    <form action={completeOnboardingAction} className={cn("flex flex-col flex-1", desktop ? "max-w-[640px] mx-auto py-12 px-8" : "px-5")}>
      <div className={desktop ? "" : "pt-14"}>
        <Link
          href="/welcome"
          className="w-[38px] h-[38px] rounded-full bg-spark-surface flex items-center justify-center text-spark-ink"
        >
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
      </div>

      <div className="mt-[18px]">
        <div className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-[0.06em]">
          Passo 2 de 2
        </div>
        <h1 className={cn("font-extrabold tracking-[-0.02em] mt-1.5 leading-[1.15]", desktop ? "text-[34px]" : "text-[26px]")}>
          Pra te ajudar melhor,
          <br />
          conta um pouco
          <br />
          sobre você.
        </h1>
      </div>

      <div className="mt-[22px] flex flex-col gap-4">
        <div>
          <div className="text-[12px] font-bold text-spark-ink-50 mb-1.5 uppercase tracking-[0.04em]">
            Como te chamar
          </div>
          <SInput defaultValue={USER.name} placeholder="Seu primeiro nome" />
        </div>

        <div>
          <div className="text-[12px] font-bold text-spark-ink-50 mb-2 uppercase tracking-[0.04em]">
            Você já vende no TikTok Shop?
          </div>
          <div className="flex flex-col gap-2">
            {experiences.map((o) => {
              const sel = exp === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setExp(o.id)}
                  className={cn(
                    "px-4 py-3.5 rounded-[14px] flex items-center justify-between text-[14px] text-left transition-colors",
                    sel
                      ? "bg-spark-surface-elev border-[1.5px] border-spark-ink font-bold"
                      : "bg-spark-surface border-[1.5px] border-spark-hairline font-medium",
                  )}
                >
                  {o.label}
                  <span
                    className={cn(
                      "w-[18px] h-[18px] rounded-full border-[1.5px]",
                      sel ? "bg-spark-ink border-spark-ink" : "border-spark-ink-20",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-bold text-spark-ink-50 mb-2 uppercase tracking-[0.04em]">
            Nicho principal
          </div>
          <div className="flex flex-wrap gap-1.5">
            {NICHES.map((n) => (
              <SChip key={n} active={niche === n} onClick={() => setNiche(n)}>
                {n}
              </SChip>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1" />

      <div className={cn("pb-[30px]", desktop ? "pt-8" : "pt-4")}>
        <SButton type="submit" variant="primary" size="lg" full IconRight={ArrowRight}>
          Pronto, bora!
        </SButton>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  return (
    <ResponsiveShell
      mobile={<ProfileContent />}
      desktop={<ProfileContent desktop />}
      fullBleed
    />
  );
}
