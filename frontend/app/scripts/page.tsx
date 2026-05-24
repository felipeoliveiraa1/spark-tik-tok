"use client";

import * as React from "react";
import Link from "next/link";
import { Pen, Sparkle } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { LoadingSplash } from "@/components/atoms/loading-splash";

type ScriptItem = {
  n?: number;
  hook?: string;
  development?: string;
  trigger?: string;
  why?: string;
};

type ScriptRow = {
  id: string;
  title: string;
  hooks: ScriptItem[];
  product_id: string | null;
  model: string | null;
  created_at: string;
};

function hasFullScripts(items: ScriptItem[]): boolean {
  return items.some((i) => Boolean(i.development));
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.round(ms / 86_400_000);
  if (days < 1) return "hoje";
  if (days === 1) return "ontem";
  return `${days}d`;
}

function useScripts() {
  const [scripts, setScripts] = React.useState<ScriptRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/scripts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { scripts: [] }))
      .then((data: { scripts: ScriptRow[] }) => {
        if (!cancelled) setScripts(data.scripts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { scripts, loading };
}

function ScriptsBody({ desktop = false }: { desktop?: boolean }) {
  const { scripts, loading } = useScripts();
  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "" : "px-4 pt-4"}>
        {desktop && (
          <>
            <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
              ✨ Roteiros prontos
            </div>
            <h1 className="mt-1 font-extrabold tracking-tight leading-[1.1] text-[36px]">
              Seus scripts ✍️
            </h1>
          </>
        )}
        <p className={`text-[13.5px] text-spark-ink-50 max-w-[520px] ${desktop ? "mt-1.5" : ""}`}>
          Cada conjunto de roteiros gerado pela Scripts — gancho, desenvolvimento, benefício e CTA prontos pra gravar. 💕
        </p>
      </div>

      <div className={`mt-6 ${desktop ? "" : "px-4"}`}>
        {loading ? (
          <LoadingSplash message="Buscando seus scripts" />
        ) : scripts.length === 0 ? (
          <EmptyScripts />
        ) : (
          <div className={`grid gap-2.5 ${desktop ? "grid-cols-2 max-w-[920px]" : "grid-cols-1"}`}>
            {scripts.map((s) => (
              <Link
                key={s.id}
                href={`/scripts/${s.id}`}
                className="rounded-2xl bg-spark-surface border border-spark-hairline p-4 hover:border-spark-ink/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center">
                    <Pen size={16} strokeWidth={1.7} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold">{s.title}</div>
                    <div className="text-[11.5px] text-spark-ink-50 mt-0.5">
                      {s.hooks.length} {hasFullScripts(s.hooks) ? "roteiros" : "hooks"} · {timeAgo(s.created_at)}
                    </div>
                  </div>
                </div>
                {s.hooks[0]?.hook && (
                  <div className="mt-2.5 text-[12.5px] text-spark-ink-70 line-clamp-2 italic leading-snug">
                    &ldquo;{s.hooks[0].hook}&rdquo;
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.model && <SBadge>{s.model}</SBadge>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyScripts() {
  return (
    <div className="rounded-2xl bg-spark-surface border border-spark-hairline p-7 text-center max-w-[520px] mx-auto">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-grad-soft flex items-center justify-center text-[28px]">
        ✍️
      </div>
      <div className="mt-3 text-[16px] font-extrabold">Sem roteiros ainda 💖</div>
      <p className="text-[13px] text-spark-ink-50 mt-1.5 leading-snug">
        Abre o chat com a Scripts, menciona seu produto com @ e ela gera 5 roteiros completos no estilo da Yara — gancho, desenvolvimento, benefício e CTA. ✨
      </p>
      <div className="mt-4">
        <Link href="/chat">
          <SButton variant="primary" size="md" IconRight={Sparkle}>
            Gerar roteiros
          </SButton>
        </Link>
      </div>
    </div>
  );
}

function ScriptsMobile() {
  return (
    <>
      <MobileHeader title="Scripts ✍️" back={{ href: "/" }} />
      <ScriptsBody />
      <BottomNav active="scripts" />
    </>
  );
}

function ScriptsDesktop() {
  return <ScriptsBody desktop />;
}

export default function ScriptsPage() {
  return <ResponsiveShell mobile={<ScriptsMobile />} desktop={<ScriptsDesktop />} active="scripts" />;
}
