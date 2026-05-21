"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { youtubeEmbedUrl } from "@/lib/youtube";

type VideoDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  youtube_id: string;
  cover_url: string | null;
  duration_seconds: number | null;
};

function useVideo(idOrSlug: string) {
  const [video, setVideo] = React.useState<VideoDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/educacao/${idOrSlug}`, { cache: "no-store" });
      if (cancelled) return;
      if (res.status === 404) {
        setError("Aula não encontrada.");
      } else if (!res.ok) {
        setError("Não consegui carregar a aula.");
      } else {
        const data = (await res.json()) as { video: VideoDetail };
        setVideo(data.video);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  return { video, loading, error };
}

function markCompleted(videoId: string) {
  return fetch("/api/educacao/progress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ video_id: videoId, completed: true }),
  });
}

function VideoBody({ idOrSlug, desktop = false }: { idOrSlug: string; desktop?: boolean }) {
  const { video, loading, error } = useVideo(idOrSlug);
  const [marking, setMarking] = React.useState(false);
  const [marked, setMarked] = React.useState(false);

  if (loading) return <LoadingSplash message="Abrindo aula" />;
  if (error || !video) {
    return (
      <div className="p-6 text-center text-[13px] text-spark-ink-50">
        {error ?? "Erro."}
        <div className="mt-3">
          <Link href="/educacao" className="text-spark-brand font-semibold">
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    setMarking(true);
    try {
      const res = await markCompleted(video.id);
      if (res.ok) setMarked(true);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "max-w-[920px]" : "px-4 pt-2"}>
        <div className="aspect-video rounded-2xl overflow-hidden bg-black">
          <iframe
            src={youtubeEmbedUrl(video.youtube_id, { autoplay: false })}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        <div className="mt-5">
          {video.category && (
            <SBadge tone="brand">
              <span>📚</span>
              <span className="ml-1">{video.category}</span>
            </SBadge>
          )}
          <h1
            className={`mt-2 font-extrabold tracking-tight leading-tight ${desktop ? "text-[28px]" : "text-[22px]"}`}
          >
            {video.title}
          </h1>
          {video.description && (
            <p className="mt-3 text-[14.5px] text-spark-ink-70 leading-relaxed whitespace-pre-wrap">
              {video.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <SButton
              variant={marked ? "soft" : "primary"}
              size="md"
              Icon={Check}
              onClick={handleComplete}
              disabled={marking || marked}
            >
              {marked ? "Marcada como assistida ✓" : "Marcar como assistida"}
            </SButton>
            <Link href="/chat">
              <SButton variant="ghost" size="md">
                Aplicar com a Spark
              </SButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoMobile({ idOrSlug }: { idOrSlug: string }) {
  return (
    <>
      <MobileHeader title="Aula" back={{ href: "/educacao" }} />
      <VideoBody idOrSlug={idOrSlug} />
      <BottomNav active="educacao" />
    </>
  );
}

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const idOrSlug = params?.id ?? "";
  return (
    <ResponsiveShell
      mobile={<VideoMobile idOrSlug={idOrSlug} />}
      desktop={<VideoBody idOrSlug={idOrSlug} desktop />}
      active="educacao"
    />
  );
}
