import Link from "next/link";
import { Search, ChevronDown, Play } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SChip } from "@/components/atoms/s-chip";
import { PhotoPlaceholder } from "@/components/atoms/photo-placeholder";

const filters = [
  { l: "Todos", a: true },
  { l: "🇧🇷 BR", a: false },
  { l: "🇺🇸 USA", a: false },
  { l: "Beleza", a: false },
  { l: "Saúde", a: false },
];

const virais = [
  { id: "v1", v: "2.3M", sales: "R$ 45k", q: "isso aqui mudou minha vida em 7 dias", who: "@fitmari", country: "🇧🇷" },
  { id: "v2", v: "1.8M", sales: "R$ 78k", q: "comprei achando que era furada", who: "@beautyhacks", country: "🇺🇸" },
  { id: "v3", v: "890k", sales: "R$ 18k", q: "minha mãe não acreditou quando contei", who: "@dramaequeen", country: "🇧🇷" },
  { id: "v4", v: "1.2M", sales: "R$ 22k", q: "gastei R$ 99 e foi a melhor compra do ano", who: "@laurinhabh", country: "🇧🇷" },
  { id: "v5", v: "2.1M", sales: "R$ 62k", q: "minha cunhada toma escondida e descobri", who: "@oliviabh", country: "🇧🇷" },
  { id: "v6", v: "760k", sales: "R$ 14k", q: "passei 6 meses cansada porque ninguém me contou", who: "@ferpro", country: "🇧🇷" },
];

function ViraisMobile() {
  return (
    <>
      <AppHeader TrailingIcon={Search} showAvatar={false} />
      <div className="px-4">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] m-0">Virais salvos</h1>
        <div className="text-[13px] text-spark-ink-50 mt-0.5">247 vídeos · atualizado há 8min</div>
      </div>

      <div className="mt-3 px-4 flex gap-1.5 overflow-x-auto no-scrollbar">
        {filters.map((c) => (
          <SChip key={c.l} active={c.a}>
            {c.l}
          </SChip>
        ))}
      </div>

      <div className="mt-3 px-4 flex justify-between items-center">
        <div className="text-[12px] text-spark-ink-50 font-semibold">Ordenar por</div>
        <div className="inline-flex items-center gap-1 text-[13px] font-bold">
          Receita <ChevronDown size={14} strokeWidth={1.7} />
        </div>
      </div>

      <div className="flex-1 overflow-auto pt-3 pb-3 px-4 flex flex-col gap-2.5">
        {virais.map((it) => (
          <Link
            key={it.id}
            href={`/virais/${it.id}`}
            className="rounded-2xl overflow-hidden bg-spark-surface border border-spark-hairline flex gap-3 p-2.5"
          >
            <div className="relative w-[90px] shrink-0">
              <PhotoPlaceholder height={130} radius={10} label="" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-full bg-white/95 text-spark-ink flex items-center justify-center">
                <Play size={14} strokeWidth={1.7} fill="currentColor" />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5 text-[11px] text-spark-ink-50">
                <span>{it.country}</span>
                <span>·</span>
                <span className="font-mono">{it.who}</span>
              </div>
              <div className="text-[13px] leading-[1.35] mt-1 italic text-spark-ink-70">
                &ldquo;{it.q}…&rdquo;
              </div>
              <div className="flex-1" />
              <div className="flex gap-2.5 mt-2">
                <div>
                  <div className="text-[10px] text-spark-ink-50 font-mono">VIEWS</div>
                  <div className="text-[14px] font-extrabold font-mono">{it.v}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-good">REC</div>
                  <div className="text-[14px] font-extrabold font-mono text-good">{it.sales}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <BottomNav active="home" />
    </>
  );
}

function ViraisDesktop() {
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[13px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase">Pesquisa</div>
          <h1 className="text-[36px] font-extrabold tracking-[-0.02em] mt-1">Virais salvos</h1>
          <div className="text-[13px] text-spark-ink-50 mt-1">247 vídeos · atualizado há 8min</div>
        </div>
        <div className="flex items-center gap-2">
          <SChip Icon={Search}>Buscar</SChip>
          <SChip>
            Ordenar: Receita <ChevronDown size={12} strokeWidth={1.7} className="ml-0.5" />
          </SChip>
        </div>
      </div>

      <div className="mt-6 flex gap-1.5 items-center flex-wrap">
        {filters.map((c) => (
          <SChip key={c.l} active={c.a}>
            {c.l}
          </SChip>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {virais.map((it) => (
          <Link
            key={it.id}
            href={`/virais/${it.id}`}
            className="rounded-[18px] overflow-hidden bg-spark-surface border border-spark-hairline hover:border-spark-ink/30 transition-colors"
          >
            <div className="relative">
              <PhotoPlaceholder height={260} radius={0} label="" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 text-spark-ink flex items-center justify-center">
                <Play size={20} strokeWidth={1.7} fill="currentColor" />
              </div>
              <div className="absolute top-2 left-2 px-1.5 py-[3px] rounded-md bg-black/60 text-white text-[11px] font-bold font-mono">
                {it.v}
              </div>
              <div className="absolute bottom-2 left-2 px-1.5 py-[3px] rounded-md text-white text-[11px] font-bold" style={{ background: "oklch(0.62 0.16 150)" }}>
                {it.sales}
              </div>
              <div className="absolute top-2 right-2 text-base">{it.country}</div>
            </div>
            <div className="p-3.5">
              <div className="text-[13px] leading-[1.35] italic text-spark-ink-70 line-clamp-2">
                &ldquo;{it.q}…&rdquo;
              </div>
              <div className="mt-2 text-[11px] text-spark-ink-50 font-mono">{it.who}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ViraisPage() {
  return <ResponsiveShell mobile={<ViraisMobile />} desktop={<ViraisDesktop />} active="virais" />;
}
