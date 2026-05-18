"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Flame,
  ExternalLink,
  Eye,
  ThumbsUp,
  ShoppingBag,
  DollarSign,
  Trash2,
  Play,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SBadge } from "@/components/atoms/s-badge";
import { SButton } from "@/components/atoms/s-button";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { useVideoModal } from "@/components/molecules/video-modal";

type SavedViralDetail = {
  id: string;
  source_video_id: string;
  url: string;
  thumbnail_url: string | null;
  rank: number | null;
  creator: string | null;
  creator_avatar_url: string | null;
  country: "BR" | "US" | null;
  niche: string | null;
  caption: string | null;
  hook: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  sales: number | null;
  shares: number | null;
  estimated_revenue_brl: number | null;
  transcription: string | null;
  transcription_fetched_at: string | null;
  product_name: string | null;
  product_shop_url: string | null;
  product_price_brl: number | null;
  saved_at: string;
};

function fmtBig(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
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

function useSavedViral(id: string) {
  const [data, setData] = React.useState<SavedViralDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/virais/${id}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) setError("Viral não encontrado.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError("Falhou ao carregar.");
          return;
        }
        const parsed = (await res.json()) as { video: SavedViralDetail };
        if (!cancelled) setData(parsed.video);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data, loading, error };
}

function ViralBody({ id, desktop = false }: { id: string; desktop?: boolean }) {
  const router = useRouter();
  const { data: v, loading, error } = useSavedViral(id);
  const videoModal = useVideoModal();
  const [deleting, setDeleting] = React.useState(false);

  const remove = async () => {
    if (!window.confirm("Remover este viral da sua biblioteca?")) return;
    setDeleting(true);
    const res = await fetch(`/api/virais/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.push("/virais");
  };

  if (loading) return <LoadingSplash message="Abrindo viral" />;
  if (error || !v) {
    return (
      <div className="p-6 text-center text-[13px] text-spark-ink-50">
        {error ?? "Erro."}
        <div className="mt-3">
          <Link href="/virais" className="text-spark-brand font-semibold">
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "max-w-[820px]" : "px-4 pt-4"}>
        {!desktop && (
          <Link
            href="/virais"
            className="inline-flex items-center gap-1.5 text-[13px] text-spark-ink-50"
          >
            <ArrowLeft size={14} strokeWidth={1.7} />
            Biblioteca
          </Link>
        )}

        <div className="mt-3 flex flex-col md:flex-row gap-5">
          <div className="md:w-[300px] shrink-0">
            <button
              type="button"
              onClick={() => videoModal.open(v.url)}
              className="block w-full rounded-2xl overflow-hidden bg-spark-surface-sunken aspect-9/14 relative group"
            >
              {v.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-spark-ink-35">
                  <Flame size={36} strokeWidth={1.5} />
                </div>
              )}
              {v.rank != null && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-[12px] font-extrabold font-mono">
                  #{v.rank}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <div className="w-14 h-14 rounded-full bg-white/95 text-spark-ink flex items-center justify-center">
                  <Play size={22} strokeWidth={1.7} className="ml-0.5" />
                </div>
              </div>
            </button>

            <SButton
              variant="primary"
              size="md"
              full
              IconRight={Play}
              onClick={() => videoModal.open(v.url)}
              className="mt-2"
            >
              Reproduzir
            </SButton>

            <a
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-spark-ink-50 w-full"
            >
              Abrir no TikTok
              <ExternalLink size={13} strokeWidth={1.7} />
            </a>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {v.creator_avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.creator_avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div className="text-[12.5px] text-spark-ink-70 font-mono">
                @{v.creator ?? "criador"}
              </div>
            </div>

            <h1
              className={`font-extrabold tracking-tight leading-tight mt-2 ${
                desktop ? "text-[26px]" : "text-[20px]"
              }`}
            >
              {v.product_name ?? "Sem produto identificado"}
            </h1>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {v.country && (
                <SBadge tone={v.country === "BR" ? "brand" : "good"}>{v.country}</SBadge>
              )}
              {v.niche && <SBadge>{v.niche}</SBadge>}
              {v.product_price_brl != null && (
                <SBadge>{fmtBrl(v.product_price_brl)}</SBadge>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <Metric Icon={ShoppingBag} label="Vendas" value={fmtBig(v.sales)} />
              <Metric Icon={Eye} label="Views" value={fmtBig(v.views)} />
              <Metric Icon={ThumbsUp} label="Likes" value={fmtBig(v.likes)} />
              <Metric Icon={DollarSign} label="Receita" value={fmtBrl(v.estimated_revenue_brl)} />
            </div>

            {v.hook && (
              <Section title="Hook">
                <p className="text-[15px] text-spark-ink italic leading-relaxed">
                  &ldquo;{v.hook}&rdquo;
                </p>
              </Section>
            )}

            {v.transcription && (
              <Section title="Transcrição da criadora">
                <p className="text-[14px] text-spark-ink leading-relaxed whitespace-pre-wrap">
                  {v.transcription}
                </p>
                {v.transcription_fetched_at && (
                  <div className="text-[10.5px] text-spark-ink-35 mt-1.5 font-mono">
                    capturada em{" "}
                    {new Date(v.transcription_fetched_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </Section>
            )}

            {v.caption && (
              <Section title="Legenda completa">
                <p className="text-[14px] text-spark-ink-70 leading-relaxed whitespace-pre-wrap">
                  {v.caption}
                </p>
              </Section>
            )}

            {v.product_shop_url && (
              <Section title="Produto vendido">
                <a
                  href={v.product_shop_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-spark-brand font-semibold text-[14px]"
                >
                  Abrir loja no TikTok
                  <ExternalLink size={13} strokeWidth={1.7} />
                </a>
              </Section>
            )}

            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/chat">
                <SButton variant="ghost" size="md">
                  Gerar scripts inspirados
                </SButton>
              </Link>
              <SButton
                variant="ghost"
                size="md"
                Icon={Trash2}
                onClick={remove}
                disabled={deleting}
              >
                Remover
              </SButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-[11px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase mb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function Metric({
  Icon,
  label,
  value,
}: {
  Icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-spark-surface border border-spark-hairline">
      <div className="text-[10.5px] uppercase tracking-[0.06em] text-spark-ink-50 inline-flex items-center gap-1">
        <Icon size={11} strokeWidth={1.7} /> {label}
      </div>
      <div className="text-[15px] font-extrabold font-mono mt-0.5">{value}</div>
    </div>
  );
}

function MobileWrap({ id }: { id: string }) {
  return (
    <>
      <div className="pt-12 px-4 pb-2 flex items-center gap-2">
        <Link
          href="/virais"
          className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink"
        >
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold text-spark-ink-50">Viral salvo</div>
      </div>
      <ViralBody id={id} />
      <BottomNav active="virais" />
    </>
  );
}

export default function ViralDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  return (
    <ResponsiveShell
      mobile={<MobileWrap id={id} />}
      desktop={<ViralBody id={id} desktop />}
      active="virais"
    />
  );
}
