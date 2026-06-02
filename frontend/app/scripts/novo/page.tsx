"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Sparkles,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { CharacterReveal } from "@/components/atoms/character-reveal";
import { useToast } from "@/components/molecules/dialog-provider";
import { ColaRapidaButton } from "@/components/molecules/cola-rapida-button";
import { cn } from "@/lib/cn";

/**
 * /scripts/novo — cadastro premium magazine de roteiros.
 *
 * Aluna pega os roteiros que gerou no agente Scripts (no ChatGPT/Gemini)
 * e cadastra aqui. 1-5 roteiros, cada um com 4 blocos do método TTS:
 *   gancho (3s) → desenvolvimento → benefício → CTA
 *
 * Opcionalmente vincula com 1 produto do catálogo (dropdown).
 *
 * Mantém toda a lógica funcional original. Repagina visual no padrão
 * magazine: hero radial, blobs, Tanker, cards glass com border premium,
 * save bar sticky com glass effect.
 */

const STYLES = [
  { value: "fofoca", label: "Fofoca", emoji: "👀" },
  { value: "polemico", label: "Polêmico", emoji: "🔥" },
  { value: "engracado", label: "Engraçado", emoji: "😂" },
  { value: "educativo", label: "Educativo", emoji: "📚" },
  { value: "storytelling", label: "Storytelling", emoji: "📖" },
  { value: "comparacao", label: "Comparação", emoji: "⚖️" },
  { value: "transformacao", label: "Transformação", emoji: "✨" },
];

type ScriptItem = {
  n: number;
  style: string;
  hook: string;
  development: string;
  benefit: string;
  cta: string;
};

type Product = { id: string; name: string };

const emptyScript = (n: number): ScriptItem => ({
  n,
  style: "fofoca",
  hook: "",
  development: "",
  benefit: "",
  cta: "",
});

// =================================================================
// HERO
// =================================================================

function HeroSection({ desktop }: { desktop: boolean }) {
  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "72px" : "calc(env(safe-area-inset-top) + 64px)",
        paddingBottom: desktop ? "48px" : "32px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="lilac" variant={2} className="top-20 -right-40 w-[420px] h-[420px]" />
      <HeroBlob color="peach" variant={3} className="bottom-0 left-1/3 w-[360px] h-[360px]" />
      <SparkleField count={12} seed={414} className="opacity-60" />

      <div className={`relative ${desktop ? "px-12 max-w-[820px] mx-auto" : "px-5"}`}>
        <SectionReveal direction="down" durationMs={500}>
          <Link
            href="/scripts"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pros scripts
          </Link>
        </SectionReveal>

        <div className="flex items-start justify-between gap-4 mt-6">
          <SectionReveal direction="down" delay={100} durationMs={600}>
            <div className="text-eyebrow text-spark-brand-deep">
              ✦ novo conjunto
            </div>
            <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[34ch] font-semibold">
              Cola os roteiros gerados no agente Scripts. Cada um com 4 blocos do método TTS.
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="ROTEIROS · MÉTODO TTS · " emoji="✍️" size={118} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={150} durationMs={900}>
          <h1
            className="mt-6 font-display lowercase leading-[0.9] tracking-tight max-w-[14ch]"
            style={{ fontSize: desktop ? "clamp(2.5rem, 6vw, 4.5rem)" : "clamp(2.25rem, 9vw, 3rem)" }}
          >
            <CharacterReveal as="span" immediate staggerMs={28} className="block text-spark-ink">
              cadastrar
            </CharacterReveal>
            <CharacterReveal
              as="span"
              immediate
              staggerMs={28}
              delayMs={350}
              className="block"
              charClassName="text-grad-brand"
            >
              roteiros.
            </CharacterReveal>
          </h1>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// FIELD HELPER
// =================================================================

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <label className="block text-[12.5px] font-extrabold text-spark-ink uppercase tracking-wider">
          {label}
        </label>
        {hint && (
          <span className="text-[10.5px] text-spark-ink-50 font-mono">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// =================================================================
// SCRIPT CARD
// =================================================================

function ScriptCard({
  s,
  idx,
  total,
  canRemove,
  onUpdate,
  onRemove,
}: {
  s: ScriptItem;
  idx: number;
  total: number;
  canRemove: boolean;
  onUpdate: <K extends keyof ScriptItem>(key: K, value: ScriptItem[K]) => void;
  onRemove: () => void;
}) {
  return (
    <SectionReveal direction="up" delay={Math.min(idx * 60, 240)}>
      <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 lg:p-6 shadow-rest space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-spark-hairline">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-grad text-white flex items-center justify-center font-extrabold text-[14px] shadow-lift-brand">
              {s.n}
            </div>
            <div>
              <div className="text-eyebrow text-spark-brand-deep">✦ roteiro</div>
              <div className="text-[14.5px] font-extrabold text-spark-ink leading-none mt-0.5">
                {s.n} de {total}
              </div>
            </div>
          </div>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remover roteiro"
              className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink-50 hover:text-bad hover:bg-bad/10 transition-colors"
            >
              <Trash2 size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>

        <Field label="Estilo">
          <select
            value={s.style}
            onChange={(e) => onUpdate("style", e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink font-semibold focus:outline-none focus:border-spark-brand transition-colors"
          >
            {STYLES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.emoji} {st.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="🎣 Gancho" hint="3 segundos pra prender">
          <textarea
            value={s.hook}
            onChange={(e) => onUpdate("hook", e.target.value)}
            placeholder="Frase curta que para o scroll nos primeiros 3 segundos"
            rows={2}
            className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand resize-none transition-colors"
          />
        </Field>

        <Field label="💡 Desenvolvimento" hint="a história / contexto">
          <textarea
            value={s.development}
            onChange={(e) => onUpdate("development", e.target.value)}
            placeholder="Analogia ou explicação simples, conecta com situação real"
            rows={3}
            className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand resize-none transition-colors"
          />
        </Field>

        <Field label="✨ Benefício" hint="o que entrega de verdade">
          <textarea
            value={s.benefit}
            onChange={(e) => onUpdate("benefit", e.target.value)}
            placeholder="O que o produto entrega — sem milagre, sem promessa vazia"
            rows={2}
            className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand resize-none transition-colors"
          />
        </Field>

        <Field label="💕 CTA" hint="convite leve pra ação">
          <textarea
            value={s.cta}
            onChange={(e) => onUpdate("cta", e.target.value)}
            placeholder="'link na bio', 'salva esse pra depois', 'me chama no direct'"
            rows={2}
            className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand resize-none transition-colors"
          />
        </Field>
      </div>
    </SectionReveal>
  );
}

// =================================================================
// BODY
// =================================================================

function NovoScriptBody({ desktop = false }: { desktop?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [title, setTitle] = React.useState("");
  const [productId, setProductId] = React.useState<string>("");
  const [scripts, setScripts] = React.useState<ScriptItem[]>([emptyScript(1)]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/products", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products: Product[] }) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (productId && !title.trim()) {
      const p = products.find((x) => x.id === productId);
      if (p) setTitle(`${scripts.length} roteiros · ${p.name}`);
    }
  }, [productId, products, scripts.length, title]);

  const updateScript = <K extends keyof ScriptItem>(idx: number, key: K, value: ScriptItem[K]) => {
    setScripts((arr) => arr.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));
  };

  const addScript = () => {
    setScripts((arr) => [...arr, emptyScript(arr.length + 1)]);
  };

  const removeScript = (idx: number) => {
    if (scripts.length <= 1) return;
    setScripts((arr) => arr.filter((_, i) => i !== idx).map((s, i) => ({ ...s, n: i + 1 })));
  };

  // Auto-preenche o form a partir do bloco ===ROTEIROS TTS===. Ignora
  // bloco de produto se vier (aluna pode colar tudo do agente sem
  // problema, parser pega so a parte que importa pra essa tela).
  const applyParsed = (parsed: { product?: unknown; scripts?: { title: string; scripts: Array<{ style: string; hook: string; development: string; benefit: string; cta: string }> } }) => {
    if (!parsed.scripts || parsed.scripts.scripts.length === 0) {
      toast.error("Nenhum bloco de roteiros encontrado no texto colado.");
      return;
    }
    const items: ScriptItem[] = parsed.scripts.scripts.map((s, i) => ({
      n: i + 1,
      style: s.style,
      hook: s.hook,
      development: s.development,
      benefit: s.benefit,
      cta: s.cta,
    }));
    setScripts(items);
    if (parsed.scripts.title) setTitle(parsed.scripts.title);
    toast.success(`✓ ${items.length} roteiro${items.length === 1 ? "" : "s"} preenchido${items.length === 1 ? "" : "s"} 💕`);
  };

  const handleSubmit = async () => {
    for (const s of scripts) {
      if (!s.hook.trim() || !s.development.trim() || !s.benefit.trim() || !s.cta.trim()) {
        toast.error(`Roteiro ${s.n} tá com bloco vazio. Preenche todos pra continuar 💕`);
        return;
      }
    }
    const cleanTitle =
      title.trim() ||
      `${scripts.length} roteiro${scripts.length > 1 ? "s" : ""}`;

    setSaving(true);
    try {
      const payload = {
        product_id: productId || null,
        title: cleanTitle,
        hooks: scripts,
      };
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!res.ok || !data?.id) {
        toast.error(data?.error ?? "Não consegui salvar agora.");
        return;
      }
      toast.success("Roteiros salvos 💕");
      router.push(`/scripts/${data.id}`);
    } catch {
      toast.error("Não consegui salvar agora.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{
        paddingBottom: desktop ? 48 : "calc(env(safe-area-inset-bottom) + 200px)",
      }}
    >
      <HeroSection desktop={desktop} />

      {/* CONTEÚDO */}
      <section className={`relative ${desktop ? "px-12 py-8" : "px-5 py-6"}`}>
        <div className={desktop ? "max-w-[820px] mx-auto space-y-6" : "space-y-6"}>
          {/* Cola rápida — atalho do agente */}
          <SectionReveal direction="up">
            <div className="rounded-spark-2xl bg-brand-grad-soft border-2 border-spark-brand/25 shadow-rest p-5 lg:p-6 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-eyebrow text-spark-brand-deep mb-1.5">
                  ✦ atalho do agente
                </div>
                <div className="text-[14px] font-extrabold text-spark-ink tracking-tight leading-tight">
                  Já tem os roteiros do GPT?
                </div>
                <div className="text-[12.5px] text-spark-ink-70 mt-1 leading-snug font-semibold">
                  Cola tudo aqui que o app preenche os 5 blocos automaticamente.
                </div>
              </div>
              <ColaRapidaButton mode="scripts" onParsed={applyParsed} />
            </div>
          </SectionReveal>

          {/* Meta */}
          <SectionReveal direction="up">
            <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 lg:p-6 shadow-rest space-y-4">
              <div className="text-eyebrow text-spark-brand flex items-center gap-1.5">
                <Sparkles size={11} strokeWidth={2.5} />
                ✦ informações gerais
              </div>

              <Field label="Título do conjunto">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: 5 roteiros · Gel de Limpeza"
                  maxLength={150}
                  className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand transition-colors"
                />
              </Field>

              <Field label="Produto relacionado" hint="opcional">
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink font-semibold focus:outline-none focus:border-spark-brand transition-colors"
                >
                  <option value="">Nenhum (avulso)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </SectionReveal>

          {/* Lista de roteiros */}
          <div className="space-y-4">
            {scripts.map((s, idx) => (
              <ScriptCard
                key={idx}
                s={s}
                idx={idx}
                total={scripts.length}
                canRemove={scripts.length > 1}
                onUpdate={(key, value) => updateScript(idx, key, value)}
                onRemove={() => removeScript(idx)}
              />
            ))}
          </div>

          {/* Add card — sem limite */}
          <SectionReveal direction="up" delay={120}>
            <button
              type="button"
              onClick={addScript}
              className="group w-full flex items-center justify-center gap-2 px-5 py-5 rounded-spark-2xl border-2 border-dashed border-spark-brand/30 bg-spark-brand-soft/30 text-spark-brand-deep text-[13.5px] font-extrabold transition-all duration-300 ease-premium hover:border-spark-brand/60 hover:bg-spark-brand-soft/50 hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-full bg-brand-grad text-white flex items-center justify-center shadow-lift-brand transition-transform duration-300 group-hover:rotate-90">
                <Plus size={18} strokeWidth={2.5} />
              </div>
              Adicionar mais um roteiro
            </button>
          </SectionReveal>

          {/* CTA inline desktop */}
          {desktop && (
            <SectionReveal direction="up" delay={150}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full text-[14px] font-extrabold shadow-hero transition-all duration-300 ease-premium hover:-translate-y-0.5 active:translate-y-0",
                  saving
                    ? "bg-spark-surface text-spark-ink-50 border border-spark-hairline cursor-not-allowed"
                    : "bg-brand-grad text-white",
                )}
              >
                <Save size={15} strokeWidth={2.5} />
                {saving
                  ? "Salvando..."
                  : `Salvar ${scripts.length} roteiro${scripts.length > 1 ? "s" : ""}`}
              </button>
            </SectionReveal>
          )}
        </div>
      </section>

      {/* CTA sticky bottom mobile (acima do FloatingMainNav) */}
      {!desktop && (
        <div
          className="lg:hidden fixed left-1/2 -translate-x-1/2 z-30 w-full max-w-[520px] px-5"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 92px)" }}
        >
          {/* Fade glass atrás pra disfarcar conteudo */}
          <div
            aria-hidden
            className="absolute -inset-x-3 -bottom-6 -top-3 -z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, oklch(0.98 0.005 320 / 0.6) 35%, oklch(0.98 0.005 320 / 0.92) 65%)",
              filter: "blur(8px)",
            }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full text-[14px] font-extrabold shadow-hero transition-all duration-300 ease-premium active:scale-95",
              saving
                ? "bg-spark-surface text-spark-ink-50 border border-spark-hairline cursor-not-allowed"
                : "bg-brand-grad text-white",
            )}
          >
            <Save size={15} strokeWidth={2.5} />
            {saving
              ? "Salvando..."
              : `Salvar ${scripts.length} roteiro${scripts.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}

// =================================================================
// PAGE
// =================================================================

function NovoScriptMobile() {
  return <NovoScriptBody />;
}

function NovoScriptDesktop() {
  return <NovoScriptBody desktop />;
}

export default function NovoScriptPage() {
  return (
    <>
      <ResponsiveShell
        mobile={<NovoScriptMobile />}
        desktop={<NovoScriptDesktop />}
        active="scripts"
        customSidebar
      />
      <FloatingMainNav active="scripts" />
    </>
  );
}
