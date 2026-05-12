import Link from "next/link";
import { ArrowLeft, AlertTriangle, ArrowRight } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { ProgressBar } from "@/components/atoms/progress-bar";
import { SButton } from "@/components/atoms/s-button";

function QuotaCore({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className={`flex flex-col flex-1 justify-between px-[22px] ${desktop ? "max-w-[560px] mx-auto py-12" : ""}`}>
      {!desktop && (
        <div className="pt-[60px]">
          <Link
            href="/"
            className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink"
          >
            <ArrowLeft size={18} strokeWidth={1.7} />
          </Link>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div
          className={`${desktop ? "w-24 h-24 rounded-[30px]" : "w-[86px] h-[86px] rounded-[26px]"} flex items-center justify-center mb-[22px]`}
          style={{ background: "oklch(0.96 0.05 80)", color: "oklch(0.55 0.16 75)" }}
        >
          <AlertTriangle size={desktop ? 50 : 42} strokeWidth={1.7} />
        </div>
        <div className={`font-extrabold tracking-[-0.02em] max-w-[440px] leading-[1.15] ${desktop ? "text-[34px]" : "text-[26px]"}`}>
          Você bateu o limite
          <br />
          de buscas desse mês
        </div>
        <div className="mt-2.5 text-[14px] text-spark-ink-50 max-w-[320px] leading-[1.5]">
          Já fez <b className="text-spark-ink font-mono">30/30</b> buscas no agente Virais.
        </div>

        <div className={`mt-[18px] w-full max-w-[400px] p-3.5 rounded-2xl bg-spark-surface border border-spark-hairline`}>
          <div className="flex justify-between text-[12px] font-bold mb-2">
            <span>Buscas Vyral</span>
            <span className="font-mono text-bad">30/30</span>
          </div>
          <ProgressBar value={30} max={30} tone="warn" />
          <div className="mt-2.5 text-[12px] text-spark-ink-50 font-mono">Reseta em 08/06/2026</div>
        </div>
      </div>

      <div className={`pb-[30px] flex flex-col gap-2 ${desktop ? "max-w-[400px] mx-auto w-full" : ""}`}>
        <SButton variant="primary" size="lg" full IconRight={ArrowRight}>
          Upgrade pro Premium
        </SButton>
        <SButton variant="quiet" full>
          Esperar reset (28 dias)
        </SButton>
      </div>
    </div>
  );
}

export default function QuotaPage() {
  return (
    <ResponsiveShell mobile={<QuotaCore />} desktop={<QuotaCore desktop />} fullBleed />
  );
}
