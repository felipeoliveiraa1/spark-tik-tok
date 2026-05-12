import Link from "next/link";
import { Search, Plus, Pen, Flame, Package } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SChip } from "@/components/atoms/s-chip";
import { SButton } from "@/components/atoms/s-button";
import { PRODUCTS } from "@/lib/mock";

const filters = ["Todos", "Beleza", "Saúde", "Suplemento", "Casa"];
const desktopFilters = ["Todos", "Beleza", "Saúde", "Suplemento", "Casa", "Acessórios"];

const colors = [
  "oklch(0.85 0.05 30)",
  "oklch(0.85 0.05 200)",
  "oklch(0.85 0.05 320)",
  "oklch(0.86 0.05 80)",
  "oklch(0.85 0.05 150)",
  "oklch(0.86 0.05 350)",
  "oklch(0.86 0.05 290)",
  "oklch(0.85 0.05 220)",
];

function ProductsMobile() {
  return (
    <>
      <AppHeader TrailingIcon={Search} showAvatar={false} />
      <div className="px-4">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] m-0">Meus produtos</h1>
        <div className="text-[13px] text-spark-ink-50 mt-0.5">
          {PRODUCTS.length} analisados · 41 scripts gerados
        </div>
      </div>

      <div className="mt-3.5 px-4 flex gap-1.5 overflow-x-auto no-scrollbar">
        {filters.map((c, i) => (
          <SChip key={c} active={i === 0}>
            {c}
          </SChip>
        ))}
      </div>

      <div className="flex-1 overflow-auto pt-3.5 pb-3 px-4 grid grid-cols-2 gap-2.5 content-start relative">
        {PRODUCTS.map((p, i) => (
          <Link
            key={p.id}
            href={`/produtos/${p.id}`}
            className="p-2.5 rounded-2xl bg-spark-surface border border-spark-hairline"
          >
            <div
              className="w-full aspect-square rounded-xl mb-2.5 flex items-center justify-center"
              style={{ background: colors[i % colors.length] }}
            >
              <Package size={32} strokeWidth={1.7} className="text-spark-ink-70" />
            </div>
            <div className="text-[13.5px] font-bold leading-[1.2]">{p.name}</div>
            <div className="text-[11px] text-spark-ink-50 mt-0.5">{p.category}</div>
            <div className="mt-2 flex gap-2 text-[11px] text-spark-ink-70">
              <span className="inline-flex items-center gap-1">
                <Pen size={11} strokeWidth={2} /> {p.scripts}
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame size={11} strokeWidth={2} /> {p.virais}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/chat?agent=info"
        className="absolute bottom-[100px] right-[18px] z-10 w-14 h-14 rounded-full bg-brand-grad text-white flex items-center justify-center shadow-[0_14px_30px_-10px_oklch(0.5_0.22_305/0.5)] active:scale-95 transition-transform"
      >
        <Plus size={24} strokeWidth={1.7} />
      </Link>

      <BottomNav active="produtos" />
    </>
  );
}

function ProductsDesktop() {
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[13px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase">Biblioteca</div>
          <h1 className="text-[36px] font-extrabold tracking-[-0.02em] mt-1">Meus produtos</h1>
          <div className="text-[13px] text-spark-ink-50 mt-1">
            {PRODUCTS.length} analisados · 49 scripts gerados · 49 virais salvos
          </div>
        </div>
        <Link href="/chat?agent=info">
          <SButton variant="primary" Icon={Plus}>
            Analisar novo
          </SButton>
        </Link>
      </div>

      <div className="mt-6 flex gap-1.5 items-center flex-wrap">
        {desktopFilters.map((c, i) => (
          <SChip key={c} active={i === 0}>
            {c}
          </SChip>
        ))}
        <div className="flex-1" />
        <SChip Icon={Search}>Buscar</SChip>
        <SChip>Ordenar: Mais scripts</SChip>
      </div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {PRODUCTS.map((p, i) => (
          <Link
            key={p.id}
            href={`/produtos/${p.id}`}
            className="rounded-[18px] bg-spark-surface border border-spark-hairline overflow-hidden hover:border-spark-ink/30 transition-colors"
          >
            <div
              className="aspect-square flex items-center justify-center"
              style={{ background: colors[i % colors.length] }}
            >
              <Package size={36} strokeWidth={1.7} className="text-spark-ink-70" />
            </div>
            <div className="p-3.5">
              <div className="text-[14px] font-bold">{p.name}</div>
              <div className="text-[11.5px] text-spark-ink-50 mt-0.5">{p.category}</div>
              <div className="mt-2.5 flex gap-2.5 items-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-agent-script-fg">
                  <Pen size={11} strokeWidth={2} /> {p.scripts} scripts
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-agent-viral-fg">
                  <Flame size={11} strokeWidth={2} /> {p.virais}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ProdutosPage() {
  return <ResponsiveShell mobile={<ProductsMobile />} desktop={<ProductsDesktop />} active="produtos" />;
}
