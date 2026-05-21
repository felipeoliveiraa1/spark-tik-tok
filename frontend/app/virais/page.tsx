"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, MoreHorizontal, Sparkle } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { LoadingSplash } from "@/components/atoms/loading-splash";

type SavedViralRow = {
  id: string;
  url: string;
  thumbnail_url: string | null;
  rank: number | null;
  creator: string | null;
  country: "BR" | "US" | null;
  niche: string | null;
  hook: string | null;
  caption: string | null;
  views: number | null;
  likes: number | null;
  estimated_revenue_brl: number | null;
  product_name: string | null;
  saved_at: string;
};

function fmtViews(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function fmtBrl(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

function useSavedVirais(filter: { country: string | null }) {
  const [list, setList] = React.useState<SavedViralRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (filter.country) params.set("country", filter.country);
    fetch(`/api/virais${params.toString() ? `?${params.toString()}` : ""}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : { virais: [] }))
      .then((data: { virais: SavedViralRow[] }) => {
        if (!cancelled) setList(data.virais);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter.country]);

  return { list, loading };
}

function ViraisBody({ desktop = false }: { desktop?: boolean }) {
  const [country, setCountry] = React.useState<"BR" | "US" | null>(null);
  const { list, loading } = useSavedVirais({ country });

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "" : "px-4 pt-6"}>
        <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
          💕 Sua biblioteca
        </div>
        <h1
          className={`mt-1 font-extrabold tracking-tight leading-[1.1] ${
            desktop ? "text-[36px]" : "text-[26px]"
          }`}
        >
          Virais salvos 🔥
        </h1>
        <p className="text-[13.5px] text-spark-ink-50 mt-1.5 max-w-[520px]">
          Os vídeos que você escolheu guardar pra estudar e adaptar. Salva mais pelo chat com a Virais. ✨
        </p>

        <div className="mt-4 inline-flex p-1 rounded-full bg-spark-surface-sunken">
          {[
            { id: null, label: "Todos" },
            { id: "BR" as const, label: "🇧🇷 Brasil" },
            { id: "US" as const, label: "🇺🇸 USA" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => setCountry(opt.id)}
              className={`px-3 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors ${
                country === opt.id
                  ? "bg-spark-surface text-spark-ink shadow-sm"
                  : "text-spark-ink-50 hover:text-spark-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-5 ${desktop ? "" : "px-4"}`}>
        {loading ? (
          <LoadingSplash message="Carregando biblioteca" />
        ) : list.length === 0 ? (
          <EmptyVirais />
        ) : (
          <div
            className={`grid gap-3 ${
              desktop ? "grid-cols-3 max-w-[1080px]" : "grid-cols-2"
            }`}
          >
            {list.map((v) => (
              <Link
                key={v.id}
                href={`/virais/${v.id}`}
                className="rounded-2xl overflow-hidden bg-spark-surface border border-spark-hairline hover:border-spark-ink/30 transition-colors"
              >
                <div className="relative aspect-9/14 bg-spark-surface-sunken">
                  {v.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-spark-ink-35">
                      <Flame size={28} strokeWidth={1.5} />
                    </div>
                  )}
                  {v.rank != null && (
                    <div className="absolute top-2 left-2 px-2 py-[3px] rounded-full bg-black/70 text-white text-[10.5px] font-extrabold font-mono">
                      #{v.rank}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-1.5 py-[3px] rounded-md bg-black/60 text-white text-[10px] font-bold font-mono">
                    {fmtViews(v.views)}
                  </div>
                  <div
                    className="absolute bottom-2 left-2 px-1.5 py-[3px] rounded-md text-white text-[10px] font-bold"
                    style={{ background: "oklch(0.62 0.16 150)" }}
                  >
                    {fmtBrl(v.estimated_revenue_brl)}
                  </div>
                </div>
                <div className="p-3">
                  {v.product_name && (
                    <div className="text-[12.5px] font-bold line-clamp-2 leading-snug">
                      {v.product_name}
                    </div>
                  )}
                  <div className="mt-1 text-[11px] text-spark-ink-50 font-mono truncate">
                    @{v.creator ?? "criador"}
                  </div>
                  {v.hook && (
                    <div className="mt-1.5 text-[12px] text-spark-ink-70 line-clamp-2 leading-snug italic">
                      &ldquo;{v.hook}&rdquo;
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-1.5">
                    {v.country && (
                      <SBadge tone={v.country === "BR" ? "brand" : "good"}>{v.country}</SBadge>
                    )}
                    {v.niche && <SBadge>{v.niche}</SBadge>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyVirais() {
  return (
    <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-7 text-center max-w-[520px] mx-auto">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-grad-soft flex items-center justify-center text-[28px]">
        🔥
      </div>
      <div className="mt-3 text-[16px] font-extrabold">Biblioteca vazia 💖</div>
      <p className="text-[13px] text-spark-ink-50 mt-1.5 leading-snug">
        Abre o chat com a Virais, vê o que tá bombando e fala &quot;salva esse&quot; — ela vai pra
        cá com todas as métricas. ✨
      </p>
      <div className="mt-4">
        <Link href="/chat">
          <SButton variant="primary" size="md" IconRight={Sparkle}>
            Buscar virais no chat
          </SButton>
        </Link>
      </div>
    </div>
  );
}

function ViraisMobile() {
  return (
    <>
      <AppHeader TrailingIcon={MoreHorizontal} showAvatar={false} />
      <ViraisBody />
      <BottomNav active="produtos" />
    </>
  );
}

function ViraisDesktop() {
  return <ViraisBody desktop />;
}

export default function ViraisPage() {
  return <ResponsiveShell mobile={<ViraisMobile />} desktop={<ViraisDesktop />} active="virais" />;
}
