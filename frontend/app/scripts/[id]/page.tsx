"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal, Copy, RefreshCw, Sparkle, ArrowRight } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { HookCard } from "@/components/molecules/hook-card";
import { SButton } from "@/components/atoms/s-button";
import { cn } from "@/lib/cn";
import { HOOKS } from "@/lib/mock";

function ScriptHooks({ desktop = false }: { desktop?: boolean }) {
  const list = desktop ? HOOKS : HOOKS.slice(0, 3);
  return (
    <div className={cn("flex flex-col gap-2.5", desktop && "lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3.5")}>
      {list.map((h) => (
        <HookCard
          key={h.number}
          hook={{
            number: h.number,
            text: h.text,
            emotion: h.emotion,
            trigger: h.trigger,
            reason: h.reason,
            fire: h.fire,
          }}
        />
      ))}
      {!desktop && (
        <Link
          href="#"
          className="p-3.5 rounded-2xl flex items-center gap-2.5 bg-brand-grad-soft text-spark-brand-deep text-[13px] font-bold"
        >
          <Sparkle size={18} strokeWidth={1.7} />
          <div className="flex-1">+ 7 hooks abaixo. Quer outra variação?</div>
          <ArrowRight size={16} strokeWidth={1.7} />
        </Link>
      )}
    </div>
  );
}

function ScriptMobile() {
  const [tab, setTab] = React.useState<"cards" | "tabela">("cards");
  return (
    <>
      <div className="pt-14 px-3 pb-1.5 flex items-center gap-2">
        <Link
          href="/scripts"
          className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink"
        >
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="flex-1">
          <div className="text-[11px] text-spark-ink-50 font-mono uppercase tracking-[0.06em]">
            SCRIPTS · v1 · 08/05
          </div>
          <div className="text-[16px] font-extrabold">NAC Always Fit</div>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink">
          <MoreHorizontal size={18} strokeWidth={1.7} />
        </button>
      </div>

      <div className="px-4 mt-2 flex gap-1">
        {(["cards", "tabela"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-[12px] font-bold capitalize transition-colors",
              tab === t ? "bg-spark-ink text-white" : "bg-transparent text-spark-ink-50",
            )}
          >
            {t === "cards" ? "Cards" : "Tabela"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto py-3 px-4">
        <ScriptHooks />
      </div>

      <div className="px-3.5 pt-3 pb-[18px] border-t border-spark-hairline bg-white/95 backdrop-blur flex gap-2">
        <SButton size="md" variant="ghost" Icon={Copy} full>
          Copiar todos
        </SButton>
        <SButton size="md" variant="primary" Icon={RefreshCw} full>
          Gerar mais
        </SButton>
      </div>
    </>
  );
}

function ScriptDesktop() {
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <Link
        href="/scripts"
        className="inline-flex items-center gap-2 text-[13px] text-spark-ink-50 hover:text-spark-ink transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={1.7} /> Voltar pros scripts
      </Link>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <div className="text-[11px] text-spark-ink-50 font-mono uppercase tracking-[0.06em]">
            SCRIPTS · v1 · 08/05
          </div>
          <h1 className="text-[36px] font-extrabold tracking-[-0.02em] mt-1 leading-[1.1]">
            NAC Always Fit
          </h1>
          <div className="text-[13px] text-spark-ink-50 mt-1">10 hooks · gerado por @script</div>
        </div>
        <div className="flex gap-2">
          <SButton variant="ghost" Icon={Copy}>
            Copiar todos
          </SButton>
          <SButton variant="primary" Icon={RefreshCw}>
            Gerar mais
          </SButton>
        </div>
      </div>

      <div className="mt-6">
        <ScriptHooks desktop />
      </div>
    </div>
  );
}

export default function ScriptDetailPage() {
  return <ResponsiveShell mobile={<ScriptMobile />} desktop={<ScriptDesktop />} active="scripts" />;
}
