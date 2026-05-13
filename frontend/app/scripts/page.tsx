"use client";

import * as React from "react";
import Link from "next/link";
import { Pen, MoreHorizontal, Sparkle } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { LoadingSplash } from "@/components/atoms/loading-splash";

type Hook = { n?: number; hook?: string; trigger?: string; why?: string };

type ScriptRow = {
  id: string;
  title: string;
  hooks: Hook[];
  product_id: string | null;
  model: string | null;
  created_at: string;
};

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
      <div className={desktop ? "" : "px-4 pt-6"}>
        <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
          Hooks salvos
        </div>
        <h1 className={`mt-1 font-extrabold tracking-[-0.025em] leading-[1.1] ${desktop ? "text-[36px]" : "text-[26px]"}`}>
          Seus scripts
        </h1>
        <p className="text-[13.5px] text-spark-ink-50 mt-1.5 max-w-[520px]">
          Cada conjunto gerado pelo agente Scripts. Copia, exporta ou pede uma variação no chat.
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
                      {s.hooks.length} hooks · {timeAgo(s.created_at)}
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
      <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-grad-soft text-spark-brand-deep flex items-center justify-center">
        <Pen size={22} strokeWidth={1.7} />
      </div>
      <div className="mt-3 text-[16px] font-extrabold">Sem scripts ainda</div>
      <p className="text-[13px] text-spark-ink-50 mt-1.5 leading-snug">
        Abre o chat com a Scripts e pede 10 hooks pro seu produto. A tabela completa fica salva aqui.
      </p>
      <div className="mt-4">
        <Link href="/chat">
          <SButton variant="primary" size="md" IconRight={Sparkle}>
            Gerar scripts
          </SButton>
        </Link>
      </div>
    </div>
  );
}

function ScriptsMobile() {
  return (
    <>
      <AppHeader TrailingIcon={MoreHorizontal} showAvatar={false} />
      <ScriptsBody />
      <BottomNav active="virais" />
    </>
  );
}

function ScriptsDesktop() {
  return <ScriptsBody desktop />;
}

export default function ScriptsPage() {
  return <ResponsiveShell mobile={<ScriptsMobile />} desktop={<ScriptsDesktop />} active="scripts" />;
}
