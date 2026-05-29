"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Copy,
  Trash2,
  Check,
  Sparkles,
  Clock,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

/**
 * /scripts/[id] — biblioteca editorial premium dos roteiros.
 *
 * Layout:
 *   • Hero compacto: back + sticker + Tanker title + chips metadata
 *   • Cards de roteiros COMPLETOS (formato Yara) com blocos
 *     coloridos: gancho destacado em gradient, dev/benefício/CTA
 *     em sub-cards limpos. Numero do roteiro em ring grande.
 *   • Suporta também formato LEGADO (hooks soltos).
 *   • Action bar flutuante glass: copiar tudo + apagar.
 */

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
  polêmico: "🔥",
  engracado: "😄",
  engraçado: "😄",
  educativo: "📚",
  storytelling: "📖",
  comparacao: "⚖️",
  comparação: "⚖️",
  transformacao: "✨",
  transformação: "✨",
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

// =================================================================
// HERO
// =================================================================

function ScriptHero({
  script,
  desktop,
}: {
  script: ScriptDetail;
  desktop: boolean;
}) {
  const isFull = script.hooks.some(isFullScript);
  const label = isFull ? "roteiros" : "hooks";

  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "72px" : "calc(env(safe-area-inset-top) + 64px)",
        paddingBottom: desktop ? "64px" : "40px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-24 -left-24 w-[420px] h-[420px]" />
      <HeroBlob color="lilac" variant={2} className="top-10 -right-32 w-[460px] h-[460px]" />
      <SparkleField count={12} seed={848} className="opacity-60" />

      <div className={`relative ${desktop ? "px-12 max-w-[920px] mx-auto" : "px-5"}`}>
        {/* Back */}
        <SectionReveal direction="down" durationMs={500}>
          <Link
            href="/scripts"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pra biblioteca
          </Link>
        </SectionReveal>

        <div className="flex items-start justify-between gap-4 mt-6">
          <SectionReveal direction="down" delay={100} durationMs={600}>
            <div className="text-eyebrow text-spark-brand-deep">
              ✦ {script.hooks.length} {label}
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="ROTEIROS · TTS · 2026 · " emoji="✍️" size={108} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={200} durationMs={800}>
          <h1
            className="mt-5 font-display lowercase leading-[0.92] tracking-tight text-spark-ink"
            style={{
              fontSize: desktop ? "clamp(2.25rem, 4.5vw, 4rem)" : "clamp(1.875rem, 7vw, 2.75rem)",
            }}
          >
            {script.title.toLowerCase()}
          </h1>
        </SectionReveal>

        <SectionReveal direction="up" delay={400}>
          <div className="mt-6 flex items-center gap-2 text-[11.5px] text-spark-ink-50 font-mono">
            <Clock size={11} strokeWidth={2} />
            criado em{" "}
            {new Date(script.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// FULL SCRIPT CARD (formato Yara — gancho + dev + benefício + CTA)
// =================================================================

function FullScriptCard({
  item,
  n,
  index,
}: {
  item: ScriptItem;
  n: number;
  index: number;
}) {
  const styleKey = (item.style ?? "").toLowerCase();
  const emoji = STYLE_EMOJI[styleKey] ?? "🎬";

  return (
    <SectionReveal direction="up" delay={Math.min(index * 90, 360)}>
      <article className="relative rounded-spark-3xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest hover-lift">
        {/* Header colorido */}
        <header className="relative px-6 sm:px-8 py-5 bg-gradient-to-br from-rose-100 via-amber-50 to-purple-100">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.55) 0%, transparent 40%)",
            }}
          />
          <div className="relative flex items-center gap-4">
            {/* Numero em ring grande */}
            <div className="shrink-0 relative">
              <svg width="64" height="64" viewBox="0 0 64 64" className="drop-shadow-sm">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="white"
                  stroke="oklch(0.65 0.20 350)"
                  strokeWidth="2"
                />
                <text
                  x="32"
                  y="42"
                  textAnchor="middle"
                  fontSize="24"
                  fontWeight="800"
                  fill="oklch(0.50 0.22 345)"
                  fontFamily="var(--font-display)"
                >
                  {n}
                </text>
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-eyebrow text-spark-brand-deep mb-1.5">
                ✦ roteiro {item.duration_sec ? `· ${item.duration_sec}s` : ""}
              </div>
              <div
                className="font-display lowercase tracking-tight text-spark-ink leading-tight flex items-center gap-2 truncate"
                style={{ fontSize: "clamp(1.25rem, 3vw, 1.875rem)" }}
              >
                <span aria-hidden className="text-[24px]">
                  {emoji}
                </span>
                {item.style ?? "completo"}
              </div>
            </div>
          </div>
        </header>

        {/* Blocos */}
        <div className="p-6 sm:p-8 space-y-5">
          {item.hook && (
            <Block
              emoji="🎣"
              label="gancho (3s)"
              tone="highlight"
            >
              {item.hook}
            </Block>
          )}
          {item.development && (
            <Block emoji="💡" label="desenvolvimento">
              {item.development}
            </Block>
          )}
          {item.benefit && (
            <Block emoji="✨" label="benefício">
              {item.benefit}
            </Block>
          )}
          {item.cta && (
            <Block emoji="💕" label="CTA" tone="brand">
              {item.cta}
            </Block>
          )}
        </div>
      </article>
    </SectionReveal>
  );
}

function Block({
  emoji,
  label,
  tone = "default",
  children,
}: {
  emoji: string;
  label: string;
  tone?: "default" | "highlight" | "brand";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-eyebrow text-spark-brand mb-2">
        <span className="text-[14px] leading-none" aria-hidden>
          {emoji}
        </span>
        {label}
      </div>
      <div
        className={cn(
          "text-[14.5px] leading-relaxed",
          tone === "highlight" &&
            "p-4 rounded-2xl bg-spark-ink text-white font-semibold tracking-tight",
          tone === "brand" &&
            "p-4 rounded-2xl bg-spark-brand-soft/60 border border-spark-brand/20 text-spark-ink font-medium",
          tone === "default" && "text-spark-ink-70",
        )}
      >
        {children}
      </div>
    </div>
  );
}

// =================================================================
// LEGACY HOOK CARD (formato antigo — hook simples)
// =================================================================

function LegacyHookCard({
  item,
  n,
  index,
}: {
  item: ScriptItem;
  n: number;
  index: number;
}) {
  return (
    <SectionReveal direction="up" delay={Math.min(index * 70, 320)}>
      <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest hover-lift">
        <div className="p-5 flex gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-brand-grad-soft text-spark-brand-deep flex items-center justify-center text-[16px] font-extrabold font-mono">
            {n}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14.5px] leading-snug text-spark-ink font-medium">
              {item.hook ?? "—"}
            </div>
            {(item.trigger || item.fire) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.trigger && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[11px] font-extrabold">
                    {item.trigger}
                  </span>
                )}
                {item.fire && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-good/15 text-good text-[11px] font-extrabold">
                    🔥 {item.fire}
                  </span>
                )}
              </div>
            )}
            {item.why && (
              <div className="mt-3 text-[12.5px] text-spark-ink-50 italic leading-snug">
                {item.why}
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// ACTION BAR
// =================================================================

function ActionBar({
  onCopy,
  onDelete,
  copied,
  deleting,
  desktop,
}: {
  onCopy: () => void;
  onDelete: () => void;
  copied: boolean;
  deleting: boolean;
  desktop: boolean;
}) {
  return (
    <div
      className="fixed inset-x-0 z-30 px-4 pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 92px)" }}
    >
      <div
        className={cn(
          "mx-auto pointer-events-auto glass rounded-full shadow-lift flex items-center gap-2 p-2",
          desktop ? "max-w-[760px]" : "max-w-full",
        )}
      >
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label="Apagar"
          className="inline-flex items-center justify-center w-12 h-12 rounded-full text-spark-ink-70 hover:text-bad hover:bg-bad/10 transition-colors duration-300 disabled:opacity-50"
        >
          <Trash2 size={16} strokeWidth={2.2} />
        </button>
        <div className="flex-1 text-[12px] text-spark-ink-50 px-2 hidden sm:block">
          Cola lá no TikTok ou no Notion e bora gravar 💕
        </div>
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            "group inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5 active:translate-y-0",
            copied ? "bg-good" : "bg-spark-ink hover:bg-spark-brand-deep",
          )}
        >
          {copied ? (
            <>
              <Check size={14} strokeWidth={2.5} />
              Copiado
            </>
          ) : (
            <>
              <Copy size={14} strokeWidth={2.5} />
              Copiar tudo
              <ArrowUpRight
                size={14}
                strokeWidth={2.5}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// =================================================================
// BODY
// =================================================================

function ScriptBody({ id, desktop = false }: { id: string; desktop?: boolean }) {
  const router = useRouter();
  const { script, loading, error } = useScript(id);
  const [deleting, setDeleting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  const copyAll = async () => {
    if (!script) return;
    const text = script.hooks
      .map((h, i) => {
        const n = h.n ?? i + 1;
        if (isFullScript(h)) {
          const lines = [
            `═══ ROTEIRO ${n}${h.style ? ` — ${h.style.toUpperCase()}` : ""} ═══`,
          ];
          if (h.hook) lines.push(`\n🎣 GANCHO (3s)\n${h.hook}`);
          if (h.development) lines.push(`\n💡 DESENVOLVIMENTO\n${h.development}`);
          if (h.benefit) lines.push(`\n✨ BENEFÍCIO\n${h.benefit}`);
          if (h.cta) lines.push(`\n💕 CTA\n${h.cta}`);
          return lines.join("\n");
        }
        return `${n.toString().padStart(2, "0")}. ${h.hook ?? ""}${
          h.trigger ? ` [${h.trigger}]` : ""
        }`;
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Roteiros copiados 💕");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Não consegui copiar");
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: "Apagar esses scripts?",
      description: "Os roteiros somem da sua biblioteca. ✨",
      confirmLabel: "Apagar",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    const res = await fetch(`/api/scripts/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast.success("Removido 💕");
      router.push("/scripts");
    } else {
      toast.error("Não consegui remover");
    }
  };

  if (loading) {
    return (
      <div
        className="flex-1 overflow-auto relative hero-radial flex items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <LoadingSplash message="Abrindo o script" />
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="flex-1 overflow-auto relative hero-radial">
        <SparkleField count={8} seed={42} className="opacity-50" />
        <div className="px-6 py-32 text-center max-w-[480px] mx-auto relative">
          <div className="text-[64px] mb-4">😕</div>
          <h1 className="font-display lowercase text-fluid-headline text-spark-ink leading-tight">
            opa, sumiu.
          </h1>
          <p className="mt-4 text-[14px] text-spark-ink-70 leading-snug">
            {error ?? "Erro desconhecido."}
          </p>
          <Link
            href="/scripts"
            className="mt-8 inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pra biblioteca
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 96 : 160 }}
    >
      <ScriptHero script={script} desktop={desktop} />

      {/* Scripts grid */}
      <section className={`relative ${desktop ? "py-12 px-12" : "py-8 px-5"}`}>
        <div className={desktop ? "max-w-[920px] mx-auto" : ""}>
          {script.hooks.length === 0 ? (
            <SectionReveal>
              <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-8 text-center text-[13px] text-spark-ink-50">
                Sem conteúdo salvo.
              </div>
            </SectionReveal>
          ) : (
            <div className="space-y-4">
              {script.hooks.map((h, i) => {
                const n = h.n ?? i + 1;
                return isFullScript(h) ? (
                  <FullScriptCard key={i} item={h} n={n} index={i} />
                ) : (
                  <LegacyHookCard key={i} item={h} n={n} index={i} />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ActionBar
        onCopy={copyAll}
        onDelete={remove}
        copied={copied}
        deleting={deleting}
        desktop={desktop}
      />
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function MobileWrap({ id }: { id: string }) {
  return <ScriptBody id={id} />;
}

export default function ScriptDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  return (
    <>
      <ResponsiveShell
        mobile={<MobileWrap id={id} />}
        desktop={<ScriptBody id={id} desktop />}
        active="scripts"
        customSidebar
      />
      <FloatingMainNav active="scripts" />
    </>
  );
}

void Sparkles;
