import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { AgentTile } from "@/components/atoms/agent-tile";
import { SButton } from "@/components/atoms/s-button";
import { type AgentId } from "@/lib/agents";
import { USER } from "@/lib/mock";

const items: { agent: AgentId; t: string; d: string }[] = [
  { agent: "info", t: "Análise de produto", d: "Sobe a foto, ele extrai público, dor, preço e concorrentes." },
  { agent: "viral", t: "Virais da semana", d: "Acha o que tá bombando no TikTok Shop com receita estimada." },
  { agent: "script", t: "Scripts com hook", d: "Gera hooks usando neuromarketing e gatilhos cerebrais." },
  { agent: "help", t: "Tira-dúvidas", d: "Suporte sobre TikTok Shop, regras, conta de criador, frete." },
];

function WelcomeContent({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className={`flex flex-col flex-1 ${desktop ? "max-w-[640px] mx-auto py-16 px-8" : "px-5"}`}>
      <div className={desktop ? "" : "pt-[70px]"}>
        <SparkMark size={desktop ? 44 : 36} />
        <div className="mt-7 text-[13px] font-bold text-spark-brand uppercase tracking-[0.06em]">
          Boa, {USER.name} 👋
        </div>
        <h1 className={`font-extrabold tracking-[-0.025em] mt-2 leading-[1.1] ${desktop ? "text-[44px]" : "text-[30px]"}`}>
          Bora vender
          <br />
          no TikTok Shop?
        </h1>
        <p className="text-[14px] text-spark-ink-50 mt-2.5">Você tem 4 agentes de IA prontos:</p>
      </div>

      <div className={`mt-[18px] grid gap-2.5 ${desktop ? "grid-cols-2" : "grid-cols-1"}`}>
        {items.map((it) => (
          <div key={it.agent} className="flex gap-3 p-3.5 rounded-2xl bg-spark-surface border border-spark-hairline">
            <AgentTile agent={it.agent} size={42} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold">{it.t}</div>
              <div className="text-[12.5px] text-spark-ink-50 leading-[1.4] mt-0.5">{it.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <div className={`pb-[30px] ${desktop ? "pt-8" : "pt-[18px]"}`}>
        <Link href="/onboarding/perfil" className="block">
          <SButton variant="primary" size="lg" full IconRight={ArrowRight}>
            Continuar
          </SButton>
        </Link>
        <div className="h-2" />
        <div className="flex justify-center gap-1.5">
          <div className="h-1.5 w-[18px] rounded-full bg-spark-ink" />
          <div className="h-1.5 w-1.5 rounded-full bg-spark-ink-20" />
          <div className="h-1.5 w-1.5 rounded-full bg-spark-ink-20" />
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <ResponsiveShell
      mobile={<WelcomeContent />}
      desktop={<WelcomeContent desktop />}
      fullBleed
    />
  );
}
