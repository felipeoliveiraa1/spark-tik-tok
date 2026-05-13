"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Trash2, Pen } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { LoadingSplash } from "@/components/atoms/loading-splash";

type Hook = { n?: number; hook?: string; trigger?: string; why?: string; fire?: string };

type ScriptDetail = {
  id: string;
  title: string;
  hooks: Hook[];
  product_id: string | null;
  raw_output: string | null;
  model: string | null;
  created_at: string;
};

function useScript(id: string) {
  const [script, setScript] = React.useState<ScriptDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/scripts/${id}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) setError("Script não encontrado.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError("Falhou ao carregar.");
          return;
        }
        const data = (await res.json()) as ScriptDetail;
        if (!cancelled) setScript(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { script, loading, error };
}

function ScriptBody({ id, desktop = false }: { id: string; desktop?: boolean }) {
  const router = useRouter();
  const { script, loading, error } = useScript(id);
  const [deleting, setDeleting] = React.useState(false);

  const copyAll = async () => {
    if (!script) return;
    const text = script.hooks
      .map((h, i) => `${(h.n ?? i + 1).toString().padStart(2, "0")}. ${h.hook ?? ""}${h.trigger ? ` [${h.trigger}]` : ""}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const remove = async () => {
    if (!window.confirm("Apagar este conjunto de scripts?")) return;
    setDeleting(true);
    const res = await fetch(`/api/scripts/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.push("/scripts");
  };

  if (loading) return <LoadingSplash message="Abrindo o script" />;
  if (error || !script) {
    return (
      <div className="p-6 text-center text-[13px] text-spark-ink-50">
        {error ?? "Erro."}
        <div className="mt-3">
          <Link href="/scripts" className="text-spark-brand font-semibold">
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-10"}`}>
      <div className={desktop ? "max-w-[760px]" : "px-4 pt-4"}>
        {!desktop && (
          <Link href="/scripts" className="inline-flex items-center gap-1.5 text-[13px] text-spark-ink-50">
            <ArrowLeft size={14} strokeWidth={1.7} />
            Scripts
          </Link>
        )}

        <div className="mt-3 flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center">
            <Pen size={20} strokeWidth={1.7} />
          </div>
          <div className="flex-1">
            <h1 className={`font-extrabold tracking-[-0.02em] leading-tight ${desktop ? "text-[28px]" : "text-[22px]"}`}>
              {script.title}
            </h1>
            <div className="mt-1.5 text-[12px] text-spark-ink-50 font-mono">
              {script.hooks.length} hooks · {script.model ?? "Gemini"} · {new Date(script.created_at).toLocaleDateString("pt-BR")}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-spark-hairline overflow-hidden bg-spark-surface">
          {script.hooks.length === 0 ? (
            <div className="p-5 text-center text-[13px] text-spark-ink-50">Sem hooks salvos.</div>
          ) : (
            script.hooks.map((h, i) => (
              <div
                key={i}
                className={`p-3.5 flex gap-3 ${i < script.hooks.length - 1 ? "border-b border-spark-hairline" : ""}`}
              >
                <div className="w-7 h-7 rounded-md bg-spark-surface-sunken text-spark-ink-70 flex items-center justify-center text-[12px] font-bold font-mono shrink-0">
                  {h.n ?? i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] leading-snug">{h.hook ?? "—"}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {h.trigger && <SBadge tone="brand">{h.trigger}</SBadge>}
                    {h.fire && <SBadge tone="good">🔥 {h.fire}</SBadge>}
                  </div>
                  {h.why && (
                    <div className="mt-1.5 text-[12px] text-spark-ink-50 italic leading-snug">{h.why}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <SButton variant="primary" size="md" Icon={Copy} onClick={copyAll}>
            Copiar tudo
          </SButton>
          <SButton variant="ghost" size="md" Icon={Trash2} onClick={remove} disabled={deleting}>
            Apagar
          </SButton>
        </div>
      </div>
    </div>
  );
}

function MobileWrap({ id }: { id: string }) {
  return (
    <>
      <div className="pt-12 px-4 pb-2 flex items-center gap-2">
        <Link href="/scripts" className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink">
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold text-spark-ink-50">Script</div>
      </div>
      <ScriptBody id={id} />
      <BottomNav active="virais" />
    </>
  );
}

export default function ScriptDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  return (
    <ResponsiveShell
      mobile={<MobileWrap id={id} />}
      desktop={<ScriptBody id={id} desktop />}
      active="scripts"
    />
  );
}
