import Link from "next/link";
import { ArrowLeft, RefreshCw, Check, DollarSign } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SectionHead } from "@/components/atoms/section-head";
import { SBadge } from "@/components/atoms/s-badge";
import { SButton } from "@/components/atoms/s-button";

const features = [
  { l: "Buscas Vyral", v: "30 / mês" },
  { l: "Scripts gerados", v: "50 / mês" },
  { l: "Análise de produto", v: "Ilimitado" },
  { l: "Tira-dúvidas", v: "Ilimitado" },
  { l: "Histórico de virais", v: "Ilimitado" },
];

function PlanBody({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className={desktop ? "max-w-[720px]" : ""}>
      <div className="p-[18px] rounded-[22px] relative overflow-hidden text-white bg-brand-grad-hero shadow-[0_20px_40px_-20px_oklch(0.5_0.22_305/0.5)]">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[11px] font-bold opacity-85 uppercase tracking-[0.08em]">
              Plano atual
            </div>
            <div className={`font-extrabold mt-1 tracking-[-0.02em] ${desktop ? "text-[32px]" : "text-[26px]"}`}>Pro</div>
          </div>
          <SBadge tone="good">✓ Ativo</SBadge>
        </div>
        <div className={`mt-4 font-extrabold font-mono tracking-[-0.02em] ${desktop ? "text-[36px]" : "text-[30px]"}`}>
          R$ 49,90
          <span className="text-[14px] font-semibold opacity-70"> /mês</span>
        </div>
        <div className="mt-3.5 px-3.5 py-2.5 rounded-xl bg-white/20 backdrop-blur flex items-center gap-2 text-[12px] font-semibold w-fit">
          <RefreshCw size={14} strokeWidth={1.7} /> Renova em 08/06/2026
        </div>
      </div>

      <div className="mt-6">
        <SectionHead className="px-0">O que você tem</SectionHead>
      </div>
      <div className="bg-spark-surface rounded-[18px] border border-spark-hairline overflow-hidden">
        {features.map((b, i) => (
          <div
            key={b.l}
            className={`px-3.5 py-3 flex items-center gap-2.5 ${i < features.length - 1 ? "border-b border-spark-hairline" : ""}`}
          >
            <div
              className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white"
              style={{ background: "oklch(0.62 0.16 150)" }}
            >
              <Check size={12} strokeWidth={2} />
            </div>
            <div className="flex-1 text-[14px] font-semibold">{b.l}</div>
            <div className="text-[12.5px] text-spark-ink-50 font-mono">{b.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <SectionHead className="px-0">Gerenciar</SectionHead>
      </div>
      <div className={`flex flex-col gap-2 ${desktop ? "lg:flex-row" : ""}`}>
        <SButton variant="ghost" full Icon={DollarSign}>
          Atualizar pagamento
        </SButton>
        <SButton variant="quiet" full>
          Cancelar assinatura
        </SButton>
      </div>
      <div className="mt-3.5 text-[11px] text-spark-ink-50 text-center leading-[1.5]">
        Você será redirecionada pra Kiwify pra mudanças no plano.
      </div>
    </div>
  );
}

function PlanMobile() {
  return (
    <>
      <div className="pt-14 px-4 pb-2 flex items-center justify-between">
        <Link
          href="/conta"
          className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink"
        >
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold">Plano</div>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-auto py-3 px-4">
        <PlanBody />
      </div>
    </>
  );
}

function PlanDesktop() {
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <Link
        href="/conta"
        className="inline-flex items-center gap-2 text-[13px] text-spark-ink-50 hover:text-spark-ink transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={1.7} /> Voltar pra conta
      </Link>
      <div className="text-[13px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase mt-5">Conta</div>
      <h1 className="text-[36px] font-extrabold tracking-[-0.02em] mt-1 mb-7">Plano e cobrança</h1>
      <PlanBody desktop />
    </div>
  );
}

export default function PlanPage() {
  return <ResponsiveShell mobile={<PlanMobile />} desktop={<PlanDesktop />} active="conta" />;
}
