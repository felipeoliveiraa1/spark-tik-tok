import Link from "next/link";
import { Search, Pen, Star, ChevronRight } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SChip } from "@/components/atoms/s-chip";

const items = [
  { id: "nac-always-fit", p: "NAC Always Fit", n: 10, when: "há 2h", star: 5 },
  { id: "massageador-facial", p: "Massageador facial", n: 8, when: "ontem", star: 4 },
  { id: "esmalte-gel-uv", p: "Esmalte gel UV", n: 6, when: "3 dias", star: 0 },
  { id: "babyliss-pro", p: "Babyliss profissional", n: 12, when: "4 dias", star: 3 },
  { id: "colageno-verisol", p: "Colágeno verisol", n: 10, when: "1 sem", star: 5 },
];

const filters = [
  { l: "Mais recentes", a: true },
  { l: "Marcados ⭐", a: false },
  { l: "Em produção", a: false },
];

function ScriptCard({ it }: { it: (typeof items)[number] }) {
  return (
    <Link
      href={`/scripts/${it.id}`}
      className="p-3.5 rounded-2xl bg-spark-surface border border-spark-hairline hover:border-spark-ink/30 transition-colors block"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center bg-agent-script-bg text-agent-script-fg">
          <Pen size={18} strokeWidth={1.7} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-bold">{it.p}</div>
          <div className="text-[11.5px] text-spark-ink-50 mt-0.5 font-mono">
            {it.n} hooks · {it.when}
          </div>
        </div>
        <ChevronRight size={16} strokeWidth={1.7} className="text-spark-ink-35" />
      </div>
      {it.star > 0 && (
        <div className="mt-2.5 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={12}
              strokeWidth={2}
              fill={n <= it.star ? "currentColor" : "transparent"}
              className={n <= it.star ? "text-warn" : "text-spark-ink-20"}
            />
          ))}
          <span className="text-[11px] text-spark-ink-50 ml-1">marcou {it.star}/5 como bom</span>
        </div>
      )}
    </Link>
  );
}

function ScriptsMobile() {
  return (
    <>
      <AppHeader TrailingIcon={Search} showAvatar={false} />
      <div className="px-4">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] m-0">Meus scripts</h1>
        <div className="text-[13px] text-spark-ink-50 mt-0.5">46 hooks gerados esse mês</div>
      </div>

      <div className="mt-3.5 px-4 flex gap-1.5 items-center overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <SChip key={f.l} active={f.a}>
            {f.l}
          </SChip>
        ))}
      </div>

      <div className="flex-1 overflow-auto py-3.5 px-4 flex flex-col gap-2.5">
        {items.map((it) => (
          <ScriptCard key={it.id} it={it} />
        ))}
      </div>

      <BottomNav active="home" />
    </>
  );
}

function ScriptsDesktop() {
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[13px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase">Biblioteca</div>
          <h1 className="text-[36px] font-extrabold tracking-[-0.02em] mt-1">Meus scripts</h1>
          <div className="text-[13px] text-spark-ink-50 mt-1">46 hooks gerados esse mês</div>
        </div>
        <SChip Icon={Search}>Buscar</SChip>
      </div>

      <div className="mt-6 flex gap-1.5 items-center flex-wrap">
        {filters.map((f) => (
          <SChip key={f.l} active={f.a}>
            {f.l}
          </SChip>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {items.map((it) => (
          <ScriptCard key={it.id} it={it} />
        ))}
      </div>
    </div>
  );
}

export default function ScriptsPage() {
  return <ResponsiveShell mobile={<ScriptsMobile />} desktop={<ScriptsDesktop />} active="scripts" />;
}
