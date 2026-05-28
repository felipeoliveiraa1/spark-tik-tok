"use client";

import * as React from "react";
import Link from "next/link";
import { Pen, Sparkles, Plus } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SButton } from "@/components/atoms/s-button";
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

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
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
    <div className={`flex-1 overflow-auto ${desktop ? "py-12 px-12" : "pb-10"}`}>
      <div className={desktop ? "" : "pt-2"}>
        {desktop && (
          <>
            <div className="text-eyebrow text-spark-brand">
              ✨ Roteiros prontos
            </div>
            <h1 className="mt-3 text-fluid-headline font-extrabold tracking-tight leading-[1.02]">
              Seus scripts ✍️
            </h1>
          </>
        )}
        <p className={`text-fluid-body text-spark-ink-50 max-w-[520px] ${desktop ? "mt-3" : "px-4 mt-2"}`}>
          Seus conjuntos de roteiros — gancho, desenvolvimento, benefício e CTA prontos pra gravar. Cadastra os que você gerou no agente Scripts do seu nicho. 💕
        </p>

        <div className={`mt-5 ${desktop ? "" : "px-4"}`}>
          <Link
            href="/scripts/novo"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand active:scale-95 transition-transform duration-300 ease-premium"
          >
            <Plus size={14} strokeWidth={2.5} />
            Adicionar roteiros
          </Link>
        </div>
      </div>

      <div className={`mt-8 ${desktop ? "" : "px-4"}`}>
        {loading ? (
          <LoadingSplash message="Buscando seus scripts" />
        ) : scripts.length === 0 ? (
          <EmptyScripts />
        ) : (
          <div className={`grid gap-3 ${desktop ? "grid-cols-2 max-w-[920px]" : "grid-cols-1"}`}>
            {scripts.map((s) => (
              <Link
                key={s.id}
                href={`/scripts/${s.id}`}
                className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-4 hover:border-spark-brand/30 hover-lift shadow-rest"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center">
                    <Pen size={16} strokeWidth={1.7} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold">{s.title}</div>
                    <div className="text-[11.5px] text-spark-ink-50 mt-0.5">
                      {s.hooks.length} {hasFullScripts(s.hooks) ? "roteiros" : "hooks"} · {formatDateTime(s.created_at)}
                    </div>
                  </div>
                </div>
                {s.hooks[0]?.hook && (
                  <div className="mt-2.5 text-[12.5px] text-spark-ink-70 line-clamp-2 italic leading-snug">
                    &ldquo;{s.hooks[0].hook}&rdquo;
                  </div>
                )}
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
        1. Vai em <strong>Agentes ✨</strong> e escolhe o agente <strong>Scripts</strong> do seu
        nicho.<br />
        2. Gera os 5 roteiros lá no Gemini/ChatGPT.<br />
        3. Volta aqui e cadastra eles em <strong>Adicionar roteiros</strong> 💕
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
        <Link href="/agentes">
          <SButton variant="ghost" size="md" IconRight={Sparkles}>
            Ver agentes
          </SButton>
        </Link>
        <Link href="/scripts/novo">
          <SButton variant="primary" size="md" IconRight={Plus}>
            Cadastrar agora
          </SButton>
        </Link>
      </div>
    </div>
  );
}

function ScriptsMobile() {
  return (
    <>
      <MobileHeader
        variant="editorial"
        eyebrow="✨ ROTEIROS"
        title="Seus scripts"
        back={{ href: "/" }}
      />
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
