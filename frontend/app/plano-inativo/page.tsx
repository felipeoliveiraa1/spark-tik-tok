import { Lock, MessageCircle, ChevronRight, ArrowRight } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SButton } from "@/components/atoms/s-button";

function InactiveCore({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className={`flex flex-col flex-1 justify-between px-[22px] ${desktop ? "max-w-[560px] mx-auto py-12" : ""}`}>
      {!desktop && <div className="pt-[60px]" />}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div
          className={`${desktop ? "w-24 h-24 rounded-[30px]" : "w-[86px] h-[86px] rounded-[26px]"} flex items-center justify-center mb-[22px] bg-spark-surface-sunken text-spark-ink-70`}
        >
          <Lock size={desktop ? 48 : 40} strokeWidth={1.7} />
        </div>
        <div className={`font-extrabold tracking-[-0.02em] leading-[1.15] ${desktop ? "text-[34px]" : "text-[26px]"}`}>
          Sua assinatura
          <br />
          está inativa
        </div>
        <div className="mt-2.5 text-[14px] text-spark-ink-50 max-w-[320px] leading-[1.5]">
          Pra continuar usando os 4 agentes da Spark, reativa seu plano.
        </div>
        <button className="mt-6 w-full max-w-[400px] p-3.5 rounded-[14px] bg-spark-surface border border-spark-hairline flex items-center gap-3 hover:border-spark-ink/30 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-spark-surface-sunken text-spark-ink-70 flex items-center justify-center">
            <MessageCircle size={16} strokeWidth={1.7} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[12.5px] font-bold">Dúvidas?</div>
            <div className="text-[11px] text-spark-ink-50">Fale com o suporte</div>
          </div>
          <ChevronRight size={14} strokeWidth={1.7} className="text-spark-ink-35" />
        </button>
      </div>
      <div className={`pb-[30px] ${desktop ? "max-w-[400px] mx-auto w-full" : ""}`}>
        <SButton variant="primary" size="lg" full IconRight={ArrowRight}>
          Reativar assinatura
        </SButton>
      </div>
    </div>
  );
}

export default function InactivePage() {
  return <ResponsiveShell mobile={<InactiveCore />} desktop={<InactiveCore desktop />} fullBleed />;
}
