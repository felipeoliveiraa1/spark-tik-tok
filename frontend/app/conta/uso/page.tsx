import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AgentTile } from "@/components/atoms/agent-tile";
import { ProgressBar } from "@/components/atoms/progress-bar";
import { type AgentId } from "@/lib/agents";

const usages: { agent: AgentId; l: string; v: number; max: number; tone: "brand" | "warn" }[] = [
  { agent: "viral", l: "Buscas de virais", v: 18, max: 30, tone: "brand" },
  { agent: "script", l: "Scripts gerados", v: 32, max: 50, tone: "warn" },
];

const unlimited = ["Análises de produto", "Tira-dúvidas", "Salvar virais"];

function UsageBody({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className={desktop ? "max-w-[720px]" : ""}>
      <h1 className={`font-extrabold tracking-[-0.02em] m-0 ${desktop ? "text-[36px]" : "text-[26px]"}`}>
        Uso desse mês
      </h1>
      <div className="text-[13px] text-spark-ink-50 mt-0.5 font-mono">Mai/2026 · reseta em 08/06</div>

      <div className={`mt-[22px] flex flex-col gap-3.5 ${desktop ? "lg:grid lg:grid-cols-2 lg:gap-4" : ""}`}>
        {usages.map((u) => (
          <div key={u.agent} className="p-3.5 rounded-[18px] bg-spark-surface border border-spark-hairline">
            <div className="flex items-center gap-2.5">
              <AgentTile agent={u.agent} size={32} />
              <div className="flex-1">
                <div className="text-[13px] font-bold">{u.l}</div>
                <div className="text-[11px] text-spark-ink-50 font-mono">restam {u.max - u.v}</div>
              </div>
              <div className="text-[22px] font-extrabold font-mono tracking-[-0.01em]">
                {u.v}
                <span className="text-[14px] text-spark-ink-50">/{u.max}</span>
              </div>
            </div>
            <div className="mt-2.5">
              <ProgressBar value={u.v} max={u.max} tone={u.tone} />
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-3.5 p-3.5 rounded-[18px] bg-brand-grad-soft text-spark-brand-deep ${desktop ? "max-w-[480px]" : ""}`}>
        <div className="text-[12px] font-extrabold uppercase tracking-[0.06em]">Sem limite</div>
        <div className="mt-1.5 flex flex-col gap-1">
          {unlimited.map((l) => (
            <div key={l} className="flex items-center gap-2 text-[13.5px] font-semibold">
              <Check size={14} strokeWidth={2} /> {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsageMobile() {
  return (
    <>
      <div className="pt-14 px-4 pb-2 flex items-center justify-between">
        <Link
          href="/conta"
          className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink"
        >
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold">Uso</div>
        <div className="w-9" />
      </div>
      <div className="flex-1 overflow-auto pt-1 px-4">
        <UsageBody />
      </div>
    </>
  );
}

function UsageDesktop() {
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <Link
        href="/conta"
        className="inline-flex items-center gap-2 text-[13px] text-spark-ink-50 hover:text-spark-ink transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={1.7} /> Voltar pra conta
      </Link>
      <div className="text-[13px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase mt-5">Conta</div>
      <div className="mt-1">
        <UsageBody desktop />
      </div>
    </div>
  );
}

export default function UsoPage() {
  return <ResponsiveShell mobile={<UsageMobile />} desktop={<UsageDesktop />} active="conta" />;
}
