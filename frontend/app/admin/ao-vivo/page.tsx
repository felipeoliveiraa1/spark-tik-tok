"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { getLiveStatus, formatCountdown, minutesUntil } from "@/lib/live-status";

type LiveRow = {
  id: string;
  slug: string;
  title: string;
  youtube_id: string;
  starts_at: string;
  ends_at: string | null;
  duration_minutes: number | null;
  cover_url: string | null;
  is_published: boolean;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAoVivoPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<LiveRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/ao-vivo?all=1", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { events: LiveRow[] };
      setItems(data.events);
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
      title: "Cancelar essa live?",
      description: `"${slug}" some da lista das alunas. Você pode reagendar depois.`,
      confirmLabel: "Cancelar live",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/ao-vivo/${slug}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Live removida 💕");
      await load();
    } else {
      toast.error("Não consegui remover agora");
    }
  };

  return (
    <div className="max-w-[960px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">Ao vivo 🔴</h1>
          <p className="text-[13px] text-spark-ink-50 mt-1">
            {items.length} {items.length === 1 ? "live" : "lives"}
          </p>
        </div>
        <SButton variant="primary" Icon={Plus} onClick={() => router.push("/admin/ao-vivo/nova")}>
          Nova live
        </SButton>
      </div>

      {loading ? (
        <div className="text-center text-[13px] text-spark-ink-50 py-10">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-7 text-center">
          <div className="text-[28px]">🔴</div>
          <div className="mt-2 font-extrabold">Nenhuma live agendada</div>
          <p className="text-[12.5px] text-spark-ink-50 mt-1">
            Yara cria a live no YouTube, você cola a URL aqui + data/hora.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-spark-surface border border-spark-hairline overflow-hidden">
          {items.map((e, i) => {
            const status = getLiveStatus(e);
            return (
              <div
                key={e.id}
                className={`flex items-center gap-3 p-3.5 ${i > 0 ? "border-t border-spark-hairline" : ""}`}
              >
                {e.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.cover_url}
                    alt=""
                    className="w-20 h-14 object-cover rounded-md border border-spark-hairline"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {status === "live" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-bad text-white text-[10px] font-extrabold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        AO VIVO
                      </span>
                    )}
                    {status === "upcoming" && (
                      <SBadge tone="brand">{formatCountdown(minutesUntil(e.starts_at))}</SBadge>
                    )}
                    {status === "replay" && <SBadge tone="neutral">Replay</SBadge>}
                    {!e.is_published && <SBadge tone="warn">rascunho</SBadge>}
                  </div>
                  <div className="mt-1 text-[14px] font-extrabold truncate">{e.title}</div>
                  <div className="text-[11px] text-spark-ink-50 mt-0.5 font-mono truncate">
                    {fmtDate(e.starts_at)} · yt:{e.youtube_id}
                  </div>
                </div>
                <Link
                  href={`/admin/ao-vivo/${e.slug}`}
                  className="px-3 py-1.5 rounded-lg bg-spark-surface-sunken text-[12px] font-semibold hover:bg-spark-brand-soft"
                >
                  Editar
                </Link>
                <button
                  onClick={() => remove(e.slug)}
                  className="w-9 h-9 rounded-lg text-spark-ink-50 hover:text-bad hover:bg-spark-surface-sunken flex items-center justify-center"
                  title="Remover"
                >
                  <Trash2 size={15} strokeWidth={1.7} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
