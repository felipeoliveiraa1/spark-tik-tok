import { Search } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SChip } from "@/components/atoms/s-chip";
import { NewsCard } from "@/components/molecules/news-card";
import { NEWS, NEWS_CATEGORIES, type NewsCategory } from "@/lib/mock";

const filters: { id: NewsCategory | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "atualizacao", label: "📣 Atualizações" },
  { id: "tendencia", label: "🔥 Tendências" },
  { id: "estrategia", label: "🎯 Estratégia" },
  { id: "tutorial", label: "🛠 Tutoriais" },
  { id: "evento", label: "🗓 Eventos" },
  { id: "alerta", label: "⚠️ Alertas" },
];

function PageHeader() {
  const newCount = NEWS.filter((n) => n.isNew).length;
  return (
    <>
      <div className="text-[13px] font-bold text-spark-brand tracking-[0.06em] uppercase">News da Aline</div>
      <h1 className="mt-1 text-[28px] lg:text-[36px] font-extrabold tracking-[-0.02em] leading-[1.1]">
        Jornal da expert
      </h1>
      <div className="text-[13px] text-spark-ink-50 mt-1">
        {NEWS.length} posts ·{" "}
        {newCount > 0 ? (
          <span className="text-spark-brand font-semibold">{newCount} novos pra você</span>
        ) : (
          "todos lidos"
        )}
      </div>
    </>
  );
}

function NewsMobile() {
  const [hero, ...rest] = NEWS;
  return (
    <>
      <AppHeader TrailingIcon={Search} showAvatar={false} />
      <div className="px-4">
        <PageHeader />
      </div>

      <div className="mt-3.5 px-4 flex gap-1.5 overflow-x-auto no-scrollbar">
        {filters.map((c, i) => (
          <SChip key={c.id} active={i === 0}>
            {c.label}
          </SChip>
        ))}
      </div>

      <div className="flex-1 overflow-auto pt-3.5 pb-3 px-4 flex flex-col gap-3">
        <NewsCard post={hero} variant="card" />
        <div className="text-[11px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase mt-1">
          Anteriores
        </div>
        {rest.map((p) => (
          <NewsCard key={p.slug} post={p} variant="row" />
        ))}
      </div>

      <BottomNav active="news" />
    </>
  );
}

function NewsDesktop() {
  const [hero, ...rest] = NEWS;
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <PageHeader />

      <div className="mt-6 flex gap-1.5 items-center flex-wrap">
        {filters.map((c, i) => (
          <SChip key={c.id} active={i === 0}>
            {c.label}
          </SChip>
        ))}
        <div className="flex-1" />
        <SChip Icon={Search}>Buscar</SChip>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <NewsCard post={hero} variant="card" />
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase">
            Em alta esta semana
          </div>
          {rest.slice(0, 3).map((p) => (
            <NewsCard key={p.slug} post={p} variant="row" />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase mb-3">
          Anteriores
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {rest.map((p) => (
            <NewsCard key={p.slug} post={p} variant="card" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  return <ResponsiveShell mobile={<NewsMobile />} desktop={<NewsDesktop />} active="news" />;
}
