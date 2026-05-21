"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Copy, Trash2, Pen } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SButton } from "@/components/atoms/s-button";
import { SBadge } from "@/components/atoms/s-badge";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";

// Item pode ser ROTEIRO COMPLETO (com development/benefit/cta/style) ou
// HOOK SIMPLES (formato antigo). Detecta-se pela presença de `development`.
type ScriptItem = {
  n?: number;
  // Roteiro completo (formato Yara)
  style?: string;
  hook?: string;
  development?: string;
  benefit?: string;
  cta?: string;
  duration_sec?: number;
  // Legado (hooks soltos)
  trigger?: string;
  why?: string;
  fire?: string;
};

function isFullScript(item: ScriptItem): boolean {
  return Boolean(item.development || item.benefit || item.cta);
}

const STYLE_EMOJI: Record<string, string> = {
  fofoca: "💬",
  polemico: "🔥",
  "polêmico": "🔥",
  engracado: "😄",
  "engraçado": "😄",
  educativo: "📚",
  storytelling: "📖",
  comparacao: "⚖️",
  "comparação": "⚖️",
  transformacao: "✨",
  "transformação": "✨",
};

type ScriptDetail = {
  id: string;
  title: string;
  hooks: ScriptItem[];
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
  const confirm = useConfirm();
  const toast = useToast();

  const copyAll = async () => {
    if (!script) return;
    const text = script.hooks
      .map((h, i) => {
        const n = h.n ?? i + 1;
        if (isFullScript(h)) {
          // Roteiro completo
          const lines = [
            `═══ ROTEIRO ${n}${h.style ? ` — ${h.style.toUpperCase()}` : ""} ═══`,
          ];
          if (h.hook) lines.push(`\n🎣 GANCHO (3s)\n${h.hook}`);
          if (h.development) lines.push(`\n💡 DESENVOLVIMENTO\n${h.development}`);
          if (h.benefit) lines.push(`\n✨ BENEFÍCIO\n${h.benefit}`);
          if (h.cta) lines.push(`\n💕 CTA\n${h.cta}`);
          return lines.join("\n");
        }
        return `${n.toString().padStart(2, "0")}. ${h.hook ?? ""}${h.trigger ? ` [${h.trigger}]` : ""}`;
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Roteiros copiados 💕");
    } catch {
      toast.error("Não consegui copiar");
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: "Apagar esses scripts?",
      description: "Os hooks somem da sua biblioteca. Você pode pedir pra Scripts gerar de novo. ✨",
      confirmLabel: "Apagar",
      destructive: true,
    });
    if (!ok) return;
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
      <div className={desktop ? "max-w-[760px]" : "px-4 pt-2"}>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center">
            <Pen size={20} strokeWidth={1.7} />
          </div>
          <div className="flex-1">
            <h1 className={`font-extrabold tracking-[-0.02em] leading-tight ${desktop ? "text-[28px]" : "text-[22px]"}`}>
              {script.title}
            </h1>
            <div className="mt-1.5 text-[12px] text-spark-ink-50 font-mono">
              {script.hooks.length} {script.hooks.some(isFullScript) ? "roteiros" : "hooks"} · {script.model ?? "Gemini"} · {new Date(script.created_at).toLocaleDateString("pt-BR")}
            </div>
          </div>
        </div>

        {script.hooks.length === 0 ? (
          <div className="mt-5 p-5 rounded-2xl border border-spark-hairline bg-spark-surface text-center text-[13px] text-spark-ink-50">
            Sem conteúdo salvo.
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {script.hooks.map((h, i) => {
              const n = h.n ?? i + 1;
              if (isFullScript(h)) {
                const styleKey = (h.style ?? "").toLowerCase();
                const emoji = STYLE_EMOJI[styleKey] ?? "🎬";
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-spark-hairline bg-spark-surface overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-spark-brand-soft/40 border-b border-spark-hairline flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white text-spark-brand-deep flex items-center justify-center text-[13px] font-extrabold font-mono shrink-0">
                        {n}
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-spark-brand-deep/70">
                          Roteiro {h.duration_sec ? `· ${h.duration_sec}s` : ""}
                        </div>
                        <div className="text-[14px] font-extrabold tracking-tight flex items-center gap-1.5">
                          {emoji} {h.style ?? "completo"}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3.5">
                      {h.hook && (
                        <Block label="Gancho (3s)" emoji="🎣" highlight>
                          {h.hook}
                        </Block>
                      )}
                      {h.development && (
                        <Block label="Desenvolvimento" emoji="💡">
                          {h.development}
                        </Block>
                      )}
                      {h.benefit && (
                        <Block label="Benefício" emoji="✨">
                          {h.benefit}
                        </Block>
                      )}
                      {h.cta && (
                        <Block label="CTA" emoji="💕">
                          {h.cta}
                        </Block>
                      )}
                    </div>
                  </div>
                );
              }
              // Legado — hook simples
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-spark-hairline bg-spark-surface flex gap-3"
                >
                  <div className="w-7 h-7 rounded-md bg-spark-surface-sunken text-spark-ink-70 flex items-center justify-center text-[12px] font-bold font-mono shrink-0">
                    {n}
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
              );
            })}
          </div>
        )}

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

function Block({
  label,
  emoji,
  highlight,
  children,
}: {
  label: string;
  emoji: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.08em] font-bold text-spark-ink-50 mb-1 flex items-center gap-1">
        <span>{emoji}</span> {label}
      </div>
      <div
        className={`text-[14px] leading-relaxed ${
          highlight
            ? "p-3 rounded-xl bg-spark-brand-soft/60 border border-spark-brand/15 font-semibold text-spark-ink"
            : "text-spark-ink-70"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function MobileWrap({ id }: { id: string }) {
  return (
    <>
      <MobileHeader title="Roteiros" back={{ href: "/scripts" }} />
      <ScriptBody id={id} />
      <BottomNav active="scripts" />
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
