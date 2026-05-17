"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";

type NewsRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string | null;
  reading_minutes: number;
  is_new: boolean;
  published_at: string;
};

export default function AdminNewsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<NewsRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/news?all=1", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { news: NewsRow[] };
      setItems(data.news);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const remove = async (slug: string) => {
    if (!confirm(`Remover "${slug}"?`)) return;
    const res = await fetch(`/api/news/${slug}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  return (
    <div className="max-w-[960px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">News 📰</h1>
          <p className="text-[13px] text-spark-ink-50 mt-1">
            {items.length} {items.length === 1 ? "artigo" : "artigos"}
          </p>
        </div>
        <SButton variant="primary" Icon={Plus} onClick={() => router.push("/admin/news/novo")}>
          Novo artigo
        </SButton>
      </div>

      {loading ? (
        <div className="text-center text-[13px] text-spark-ink-50 py-10">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-7 text-center">
          <div className="text-[28px]">📰</div>
          <div className="mt-2 font-extrabold">Nenhum artigo ainda</div>
          <p className="text-[12.5px] text-spark-ink-50 mt-1">
            Clique em &quot;Novo artigo&quot; pra criar o primeiro.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-spark-surface border border-spark-hairline overflow-hidden">
          {items.map((n, i) => (
            <div
              key={n.id}
              className={`flex items-center gap-3 p-3.5 ${
                i > 0 ? "border-t border-spark-hairline" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <SBadge tone="brand">{n.category}</SBadge>
                  {n.is_new && <SBadge tone="good">novo</SBadge>}
                </div>
                <div className="mt-1 text-[14px] font-extrabold truncate">{n.title}</div>
                <div className="text-[11px] text-spark-ink-50 mt-0.5 font-mono truncate">
                  /{n.slug} · {new Date(n.published_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <Link
                href={`/admin/news/${n.slug}`}
                className="px-3 py-1.5 rounded-lg bg-spark-surface-sunken text-[12px] font-semibold hover:bg-spark-brand-soft"
              >
                Editar
              </Link>
              <button
                onClick={() => remove(n.slug)}
                className="w-9 h-9 rounded-lg text-spark-ink-50 hover:text-bad hover:bg-spark-surface-sunken flex items-center justify-center"
                title="Remover"
              >
                <Trash2 size={15} strokeWidth={1.7} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
