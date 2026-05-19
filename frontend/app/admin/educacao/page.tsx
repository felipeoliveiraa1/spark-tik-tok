"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";

type VideoRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  youtube_id: string;
  cover_url: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
};

export default function AdminEducacaoPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<VideoRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/educacao?all=1", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { videos: VideoRow[] };
      setItems(data.videos);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const confirm = useConfirm();
  const toast = useToast();
  const remove = async (slug: string) => {
    const ok = await confirm({
      title: "Remover essa aula?",
      description: `A aula "${slug}" some pra todas as alunas. Você pode recriar pelo painel.`,
      confirmLabel: "Remover",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/educacao/${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Aula removida 💕");
      await load();
    } else {
      toast.error("Não consegui remover agora");
    }
  };

  return (
    <div className="max-w-[960px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">Educação 🎓</h1>
          <p className="text-[13px] text-spark-ink-50 mt-1">
            {items.length} {items.length === 1 ? "aula" : "aulas"}
          </p>
        </div>
        <SButton variant="primary" Icon={Plus} onClick={() => router.push("/admin/educacao/nova")}>
          Nova aula
        </SButton>
      </div>

      {loading ? (
        <div className="text-center text-[13px] text-spark-ink-50 py-10">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-7 text-center">
          <div className="text-[28px]">🎓</div>
          <div className="mt-2 font-extrabold">Nenhuma aula ainda</div>
          <p className="text-[12.5px] text-spark-ink-50 mt-1">
            Cole o link do YouTube e a aula entra no ar pra todas as alunas.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-spark-surface border border-spark-hairline overflow-hidden">
          {items.map((v, i) => (
            <div
              key={v.id}
              className={`flex items-center gap-3 p-3.5 ${
                i > 0 ? "border-t border-spark-hairline" : ""
              }`}
            >
              {v.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.cover_url}
                  alt=""
                  className="w-20 h-14 object-cover rounded-md border border-spark-hairline"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {v.category && <SBadge tone="brand">{v.category}</SBadge>}
                  {!v.is_published && <SBadge tone="warn">rascunho</SBadge>}
                </div>
                <div className="mt-1 text-[14px] font-extrabold truncate">{v.title}</div>
                <div className="text-[11px] text-spark-ink-50 mt-0.5 font-mono truncate">
                  yt:{v.youtube_id} · /{v.slug} · ordem {v.order_index}
                </div>
              </div>
              <Link
                href={`/admin/educacao/${v.slug}`}
                className="px-3 py-1.5 rounded-lg bg-spark-surface-sunken text-[12px] font-semibold hover:bg-spark-brand-soft"
              >
                Editar
              </Link>
              <button
                onClick={() => remove(v.slug)}
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
