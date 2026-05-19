"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, PlayCircle, GraduationCap } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { SBadge } from "@/components/atoms/s-badge";

type EducationVideo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  youtube_id: string;
  cover_url: string | null;
  duration_seconds: number | null;
};

type ProgressRow = { video_id: string; completed: boolean; progress_seconds: number };

function fmtDuration(s: number | null): string | null {
  if (!s || s <= 0) return null;
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function useEducacao() {
  const [videos, setVideos] = React.useState<EducationVideo[]>([]);
  const [progress, setProgress] = React.useState<Record<string, ProgressRow>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [vRes, pRes] = await Promise.all([
        fetch("/api/educacao", { cache: "no-store" }),
        fetch("/api/educacao/progress", { cache: "no-store" }),
      ]);
      if (cancelled) return;
      if (vRes.ok) {
        const data = (await vRes.json()) as { videos: EducationVideo[] };
        setVideos(data.videos);
      }
      if (pRes.ok) {
        const data = (await pRes.json()) as { progress: ProgressRow[] };
        const byId: Record<string, ProgressRow> = {};
        for (const p of data.progress) byId[p.video_id] = p;
        setProgress(byId);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = React.useMemo(() => {
    const byCat = new Map<string, EducationVideo[]>();
    for (const v of videos) {
      const cat = v.category?.trim() || "Outras aulas";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(v);
    }
    return Array.from(byCat.entries());
  }, [videos]);

  return { videos, grouped, progress, loading };
}

function EducacaoBody({ desktop = false }: { desktop?: boolean }) {
  const { videos, grouped, progress, loading } = useEducacao();

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "" : "px-4 pt-6"}>
        <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
          🎓 Aulas da expert
        </div>
        <h1
          className={`mt-1 font-extrabold tracking-[-0.025em] leading-[1.1] ${desktop ? "text-[36px]" : "text-[26px]"}`}
        >
          Educação ✨
        </h1>
        <p className="text-[13.5px] text-spark-ink-50 mt-1.5 max-w-[520px]">
          Videoaulas da Yara pra você dominar o TikTok Shop do zero ao avançado. 💕
        </p>
      </div>

      <div className={`mt-6 ${desktop ? "" : "px-4"}`}>
        {loading ? (
          <LoadingSplash message="Carregando aulas" />
        ) : videos.length === 0 ? (
          <EmptyEducation />
        ) : (
          <div className="flex flex-col gap-7">
            {grouped.map(([cat, items]) => (
              <section key={cat}>
                <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase mb-3">
                  {cat}
                </div>
                <div
                  className={`grid gap-3 ${desktop ? "grid-cols-3 max-w-[920px]" : "grid-cols-1"}`}
                >
                  {items.map((v) => {
                    const prog = progress[v.id];
                    return (
                      <Link
                        key={v.id}
                        href={`/educacao/${v.slug}`}
                        className="group rounded-2xl bg-spark-surface border border-spark-hairline overflow-hidden hover:border-spark-ink/30 transition-colors flex flex-col"
                      >
                        <div className="relative aspect-video bg-spark-surface-sunken overflow-hidden">
                          {v.cover_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={v.cover_url}
                              alt=""
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/15 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-white/95 text-spark-ink flex items-center justify-center">
                              <PlayCircle size={26} strokeWidth={1.5} />
                            </div>
                          </div>
                          {fmtDuration(v.duration_seconds) && (
                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-mono">
                              {fmtDuration(v.duration_seconds)}
                            </div>
                          )}
                          {prog?.completed && (
                            <div className="absolute top-2 left-2">
                              <SBadge tone="good">✓ assistida</SBadge>
                            </div>
                          )}
                        </div>
                        <div className="p-3.5 flex-1 flex flex-col gap-1">
                          <div className="text-[14px] font-extrabold tracking-[-0.01em] line-clamp-2">
                            {v.title}
                          </div>
                          {v.description && (
                            <p className="text-[12px] text-spark-ink-50 line-clamp-2 leading-snug">
                              {v.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyEducation() {
  return (
    <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-7 text-center max-w-[520px] mx-auto">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-grad-soft flex items-center justify-center text-[28px]">
        🎓
      </div>
      <div className="mt-3 text-[16px] font-extrabold">Sem aulas ainda 💖</div>
      <p className="text-[13px] text-spark-ink-50 mt-1.5 leading-snug">
        A Yara está preparando o conteúdo. Em breve você terá videoaulas exclusivas aqui. ✨
      </p>
    </div>
  );
}

function EducacaoMobile() {
  return (
    <>
      <AppHeader TrailingIcon={MoreHorizontal} showAvatar={false} />
      <EducacaoBody />
      <BottomNav active="educacao" />
    </>
  );
}

function EducacaoDesktop() {
  return <EducacaoBody desktop />;
}

export default function EducacaoPage() {
  return (
    <ResponsiveShell
      mobile={<EducacaoMobile />}
      desktop={<EducacaoDesktop />}
      active="educacao"
    />
  );
}

// Suppress unused-icon warning when grid is empty
void GraduationCap;
