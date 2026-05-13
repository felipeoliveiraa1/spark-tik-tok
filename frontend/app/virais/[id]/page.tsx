"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Flame, ExternalLink, Eye, ThumbsUp, MessageSquare, Share2 } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SBadge } from "@/components/atoms/s-badge";
import { LoadingSplash } from "@/components/atoms/loading-splash";

type ViralDetail = {
  id: string;
  url: string;
  creator: string;
  thumbnail_url: string | null;
  country: "BR" | "US";
  niche: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number | null;
  estimated_revenue_brl: number | null;
  product_name: string | null;
  product_shop_url: string | null;
  product_price_brl: number | null;
  hook_preview: string | null;
  posted_at: string | null;
  raw: Record<string, unknown>;
};

type Transcription = {
  language: string;
  full_text: string;
  hook_text: string | null;
  problem_text: string | null;
  solution_text: string | null;
  cta_text: string | null;
  insights: Record<string, unknown> | null;
} | null;

function fmtBig(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtBrl(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
}

function useViral(id: string) {
  const [data, setData] = React.useState<{ video: ViralDetail; transcription: Transcription } | null>(null);
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
        const parsed = (await res.json()) as { video: ViralDetail; transcription: Transcription };
        if (!cancelled) setData(parsed);
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
  const { data, loading, error } = useViral(id);

  if (loading) return <LoadingSplash message="Abrindo viral" />;
  if (error || !data) {
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

  const { video, transcription } = data;

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "max-w-[760px]" : "px-4 pt-4"}>
        {!desktop && (
          <Link href="/virais" className="inline-flex items-center gap-1.5 text-[13px] text-spark-ink-50">
            <ArrowLeft size={14} strokeWidth={1.7} />
            Virais
          </Link>
        )}

        <div className="mt-3 flex flex-col md:flex-row gap-5">
          <div className="md:w-[280px] shrink-0">
            <div className="rounded-2xl overflow-hidden bg-spark-surface-sunken aspect-[9/14] relative">
              {video.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-spark-ink-35">
                  <Flame size={36} strokeWidth={1.5} />
                </div>
              )}
            </div>
            <a
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-spark-brand"
            >
              Abrir no TikTok
              <ExternalLink size={13} strokeWidth={1.7} />
            </a>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-spark-ink-50 font-mono">@{video.creator}</div>
            <h1 className={`font-extrabold tracking-[-0.02em] leading-tight mt-1 ${desktop ? "text-[26px]" : "text-[20px]"}`}>
              {video.product_name ?? "Sem produto identificado"}
            </h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <SBadge tone={video.country === "BR" ? "brand" : "good"}>{video.country}</SBadge>
              {video.niche && <SBadge>{video.niche}</SBadge>}
              {video.product_price_brl != null && <SBadge>{fmtBrl(video.product_price_brl)}</SBadge>}
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <Metric Icon={Eye} label="Views" value={fmtBig(video.views)} />
              <Metric Icon={ThumbsUp} label="Likes" value={fmtBig(video.likes)} />
              <Metric Icon={MessageSquare} label="Comments" value={fmtBig(video.comments)} />
              <Metric Icon={Share2} label="Receita" value={fmtBrl(video.estimated_revenue_brl)} />
            </div>

            {video.hook_preview && (
              <Section title="Hook">
                <p className="text-[14.5px] text-spark-ink italic leading-relaxed">
                  &ldquo;{video.hook_preview}&rdquo;
                </p>
              </Section>
            )}

            {transcription?.problem_text && (
              <Section title="Problema apresentado">
                <p className="text-[14px] text-spark-ink-70 leading-relaxed">{transcription.problem_text}</p>
              </Section>
            )}

            {transcription?.solution_text && (
              <Section title="Solução">
                <p className="text-[14px] text-spark-ink-70 leading-relaxed">{transcription.solution_text}</p>
              </Section>
            )}

            {transcription?.cta_text && (
              <Section title="CTA">
                <p className="text-[14px] text-spark-ink-70 leading-relaxed">{transcription.cta_text}</p>
              </Section>
            )}

            {transcription?.full_text && !transcription.hook_text && (
              <Section title="Transcrição">
                <p className="text-[13.5px] text-spark-ink-70 leading-relaxed whitespace-pre-wrap">
                  {transcription.full_text}
                </p>
              </Section>
            )}
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

function Metric({ Icon, label, value }: { Icon: typeof Eye; label: string; value: string }) {
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
        <Link href="/virais" className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink">
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold text-spark-ink-50">Viral</div>
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
