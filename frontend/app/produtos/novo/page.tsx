"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  Save,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { Sticker } from "@/components/atoms/sticker";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { useToast } from "@/components/molecules/dialog-provider";
import { ColaRapidaButton } from "@/components/molecules/cola-rapida-button";
import { type ParsedScripts, type ParseResult } from "@/lib/cola-rapida";
import { cn } from "@/lib/cn";

/**
 * /produtos/novo — cadastro manual editorial premium.
 *
 * Mantém TODA a lógica funcional original (upload de foto, 14 campos,
 * arrays dinâmicos, submit, validação). Repagina visual no estilo
 * magazine premium: hero radial, eyebrow + Tanker, seções accordion
 * com glass borders, save bar flutuante glass.
 */

type ArrayFieldKey =
  | "pain_points"
  | "strengths"
  | "competitors"
  | "differentiators"
  | "objections"
  | "emotional_triggers"
  | "usage_moments"
  | "content_angles"
  | "hook_ideas";

type FormState = {
  name: string;
  image_url: string | null;
  category: string;
  target_audience: string;
  price_range: string;
  seasonality: string;
  pain_points: string[];
  strengths: string[];
  competitors: string[];
  differentiators: string[];
  objections: string[];
  emotional_triggers: string[];
  usage_moments: string[];
  content_angles: string[];
  hook_ideas: string[];
};

const INITIAL: FormState = {
  name: "",
  image_url: null,
  category: "",
  target_audience: "",
  price_range: "",
  seasonality: "",
  pain_points: [""],
  strengths: [""],
  competitors: [""],
  differentiators: [""],
  objections: [""],
  emotional_triggers: [""],
  usage_moments: [""],
  content_angles: [""],
  hook_ideas: [""],
};

const ARRAY_LABELS: Record<
  ArrayFieldKey,
  { label: string; emoji: string; placeholder: string; min: number; max: number }
> = {
  pain_points: {
    label: "Dores que resolve",
    emoji: "💔",
    placeholder: "ex: Pele oleosa que brilha o dia todo",
    min: 1,
    max: 8,
  },
  strengths: {
    label: "Pontos fortes",
    emoji: "💪",
    placeholder: "ex: Fórmula 3 em 1: limpa, hidrata e clareia",
    min: 1,
    max: 8,
  },
  competitors: {
    label: "Concorrentes",
    emoji: "🥊",
    placeholder: "ex: Sallve Gel Pureza",
    min: 1,
    max: 8,
  },
  differentiators: {
    label: "Diferenciais únicos",
    emoji: "✨",
    placeholder: "ex: Único com prebiótico no Brasil",
    min: 1,
    max: 8,
  },
  objections: {
    label: "Objeções a quebrar",
    emoji: "🛡️",
    placeholder: "ex: 'Será que reseca minha pele?'",
    min: 1,
    max: 8,
  },
  emotional_triggers: {
    label: "Gatilhos emocionais",
    emoji: "🎯",
    placeholder: "ex: Autoestima, pertencimento, status",
    min: 1,
    max: 8,
  },
  usage_moments: {
    label: "Momentos de uso",
    emoji: "⏰",
    placeholder: "ex: Manhã, antes de dormir, antes do treino",
    min: 1,
    max: 6,
  },
  content_angles: {
    label: "Ângulos de conteúdo",
    emoji: "🎬",
    placeholder: "ex: Antes/depois de 7 dias",
    min: 1,
    max: 8,
  },
  hook_ideas: {
    label: "Hooks prontos",
    emoji: "🪝",
    placeholder: "ex: 'Achei o gel de limpeza perfeito por R$ 19'",
    min: 1,
    max: 8,
  },
};

// =================================================================
// HERO COMPACT
// =================================================================

function HeroSection({ desktop }: { desktop: boolean }) {
  return (
    <section
      className="relative overflow-hidden hero-radial"
      style={{
        paddingTop: desktop ? "72px" : "calc(env(safe-area-inset-top) + 64px)",
        paddingBottom: desktop ? "56px" : "40px",
      }}
    >
      <HeroBlob color="rose" variant={1} className="-top-20 -left-20 w-[360px] h-[360px]" />
      <HeroBlob color="peach" variant={2} className="top-10 -right-32 w-[420px] h-[420px]" />
      <SparkleField count={10} seed={188} className="opacity-60" />

      <div className={`relative ${desktop ? "px-12 max-w-[820px] mx-auto" : "px-5"}`}>
        {/* Back link */}
        <SectionReveal direction="down" durationMs={500}>
          <Link
            href="/produtos"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pro catálogo
          </Link>
        </SectionReveal>

        <div className="flex items-start justify-between gap-4 mt-6">
          <SectionReveal direction="down" delay={100} durationMs={600}>
            <div className="text-eyebrow text-spark-brand-deep">
              ✦ novo cadastro
            </div>
            <div className="mt-3 text-fluid-lead text-spark-ink-70 max-w-[34ch] font-semibold">
              Cole os campos da ficha gerada pelo agente Info. Só o nome é obrigatório.
            </div>
          </SectionReveal>

          {desktop && (
            <SectionReveal direction="scale" delay={250}>
              <Sticker text="NOVO PRODUTO · 2026 · " emoji="📦" size={108} />
            </SectionReveal>
          )}
        </div>

        <SectionReveal direction="up" delay={200} durationMs={800}>
          <h1
            className="mt-6 font-display lowercase leading-[0.92] tracking-tight text-spark-ink"
            style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}
          >
            cadastra esse <span className="text-grad-brand">campeão.</span>
          </h1>
        </SectionReveal>
      </div>
    </section>
  );
}

// =================================================================
// FORM
// =================================================================

function NovoProdutoForm({ desktop }: { desktop: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Quando aluna cola tudo do agente, scripts vem junto e a gente cria
  // depois que o produto for salvo (precisa do product_id).
  const [pendingScripts, setPendingScripts] = React.useState<ParsedScripts | null>(null);

  // Seções colapsáveis pra reduzir cognição inicial. Defaults baseados
  // na fase do form (primeiras abertas, análise estratégica fechada).
  const [openSections, setOpenSections] = React.useState({
    photo: true,
    basics: true,
    strategy: false,
  });

  const handleUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        toast.error(data?.error ?? "Não consegui subir a foto agora.");
        return;
      }
      setForm((f) => ({ ...f, image_url: data.url! }));
      toast.success("Foto pronta 💕");
    } catch {
      toast.error("Não consegui subir a foto agora.");
    } finally {
      setUploadingImage(false);
    }
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const updateArrayItem = (key: ArrayFieldKey, idx: number, value: string) => {
    setForm((f) => {
      const arr = [...f[key]];
      arr[idx] = value;
      return { ...f, [key]: arr };
    });
  };

  const addArrayItem = (key: ArrayFieldKey) => {
    setForm((f) => {
      const max = ARRAY_LABELS[key].max;
      if (f[key].length >= max) return f;
      return { ...f, [key]: [...f[key], ""] };
    });
  };

  const removeArrayItem = (key: ArrayFieldKey, idx: number) => {
    setForm((f) => {
      const arr = f[key].filter((_, i) => i !== idx);
      return { ...f, [key]: arr.length === 0 ? [""] : arr };
    });
  };

  // Auto-preenche o form com o que o parser extraiu do texto colado
  const applyParsed = (parsed: ParseResult) => {
    let appliedAny = false;
    if (parsed.product) {
      setForm((prev) => ({
        ...prev,
        name: parsed.product!.name || prev.name,
        category: parsed.product!.category || prev.category,
        target_audience: parsed.product!.target_audience || prev.target_audience,
        price_range: parsed.product!.price_range || prev.price_range,
        seasonality: parsed.product!.seasonality || prev.seasonality,
        // Arrays — substitui se vier preenchido, senao mantem o atual
        pain_points: parsed.product!.pain_points.length ? parsed.product!.pain_points : prev.pain_points,
        strengths: parsed.product!.strengths.length ? parsed.product!.strengths : prev.strengths,
        competitors: parsed.product!.competitors.length ? parsed.product!.competitors : prev.competitors,
        differentiators: parsed.product!.differentiators.length ? parsed.product!.differentiators : prev.differentiators,
        objections: parsed.product!.objections.length ? parsed.product!.objections : prev.objections,
        emotional_triggers: parsed.product!.emotional_triggers.length ? parsed.product!.emotional_triggers : prev.emotional_triggers,
        usage_moments: parsed.product!.usage_moments.length ? parsed.product!.usage_moments : prev.usage_moments,
        content_angles: parsed.product!.content_angles.length ? parsed.product!.content_angles : prev.content_angles,
        hook_ideas: parsed.product!.hook_ideas.length ? parsed.product!.hook_ideas : prev.hook_ideas,
      }));
      // Abre todas as seções colapsáveis pra aluna conferir
      setOpenSections({ photo: true, basics: true, strategy: true });
      appliedAny = true;
    }
    if (parsed.scripts) {
      setPendingScripts(parsed.scripts);
      appliedAny = true;
    }
    if (appliedAny) {
      const msg = parsed.product && parsed.scripts
        ? `✓ Produto preenchido + ${parsed.scripts.scripts.length} roteiros prontos pra criar junto 💕`
        : parsed.product
          ? "✓ Ficha de produto auto-preenchida 💕"
          : `✓ ${parsed.scripts!.scripts.length} roteiros prontos pra criar 💕`;
      toast.success(msg);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Pelo menos o nome do produto precisa estar preenchido 💕");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        image_url: form.image_url,
        category: form.category || null,
        target_audience: form.target_audience || null,
        price_range: form.price_range || null,
        seasonality: form.seasonality || null,
        pain_points: form.pain_points,
        strengths: form.strengths,
        competitors: form.competitors,
        differentiators: form.differentiators,
        objections: form.objections,
        emotional_triggers: form.emotional_triggers,
        usage_moments: form.usage_moments,
        content_angles: form.content_angles,
        hook_ideas: form.hook_ideas,
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!res.ok || !data?.id) {
        toast.error(data?.error ?? "Não consegui salvar agora.");
        return;
      }
      const productId = data.id;

      // Se a aluna colou junto um bloco de roteiros, cria agora vinculado
      // ao produto recem-salvo.
      let scriptsCreated = false;
      if (pendingScripts) {
        try {
          const scriptsRes = await fetch("/api/scripts", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              product_id: productId,
              title:
                pendingScripts.title ||
                `${pendingScripts.scripts.length} roteiros · ${form.name}`,
              hooks: pendingScripts.scripts.map((s, i) => ({
                n: i + 1,
                style: s.style,
                hook: s.hook,
                development: s.development,
                benefit: s.benefit,
                cta: s.cta,
              })),
            }),
          });
          scriptsCreated = scriptsRes.ok;
        } catch {
          /* segue mesmo se scripts falharem — produto ja foi salvo */
        }
      }

      toast.success(
        scriptsCreated
          ? `Produto salvo + ${pendingScripts!.scripts.length} roteiros criados 💕`
          : "Produto salvo 💕",
      );
      router.push(`/produtos/${productId}`);
    } catch {
      toast.error("Não consegui salvar agora.");
    } finally {
      setSaving(false);
    }
  };

  // Contador de preenchimento pra dar feedback de progresso
  const filledScore = React.useMemo(() => {
    let n = 0;
    if (form.name.trim()) n += 2;
    if (form.image_url) n += 2;
    if (form.category.trim()) n += 1;
    if (form.target_audience.trim()) n += 1;
    if (form.price_range.trim()) n += 1;
    if (form.seasonality.trim()) n += 1;
    const arrays: ArrayFieldKey[] = [
      "pain_points",
      "strengths",
      "competitors",
      "differentiators",
      "objections",
      "emotional_triggers",
      "usage_moments",
      "content_angles",
      "hook_ideas",
    ];
    for (const k of arrays) {
      if (form[k].some((v) => v.trim())) n += 1;
    }
    return n;
  }, [form]);

  const totalScore = 2 + 2 + 4 + 9; // peso name(2) + img(2) + básicos(4) + arrays(9)
  const progressPct = Math.min(100, Math.round((filledScore / totalScore) * 100));

  return (
    <div className={cn("relative", desktop ? "px-12" : "px-5", "pb-32")}>
      <div className={cn(desktop ? "max-w-[820px] mx-auto" : "")}>
        {/* Progresso */}
        <SectionReveal direction="up">
          <div className="mb-7 rounded-spark-2xl glass border border-spark-hairline p-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-eyebrow text-spark-brand mb-1.5">progresso</div>
              <div className="h-2 rounded-full bg-spark-surface-sunken overflow-hidden">
                <div
                  className="h-full bg-brand-grad transition-all duration-700 ease-premium"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <div className="text-[18px] font-extrabold text-spark-ink tracking-tight">
              {progressPct}%
            </div>
          </div>
        </SectionReveal>

        {/* COLA RAPIDA — atalho do agente */}
        <SectionReveal direction="up">
          <div className="rounded-spark-2xl bg-brand-grad-soft border-2 border-spark-brand/25 shadow-rest p-5 lg:p-6 mb-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="text-eyebrow text-spark-brand-deep mb-1.5">
                ✦ atalho do agente
              </div>
              <div className="text-[14px] font-extrabold text-spark-ink tracking-tight leading-tight">
                Já tem a resposta do GPT?
              </div>
              <div className="text-[12.5px] text-spark-ink-70 mt-1 leading-snug font-semibold">
                Cola tudo aqui e o app preenche os campos automaticamente —
                inclusive os 5 roteiros se vierem juntos.
              </div>
            </div>
            <ColaRapidaButton mode="produto" onParsed={applyParsed} />
          </div>
        </SectionReveal>

        {/* FOTO */}
        <SectionAccordion
          emoji="📸"
          title="Foto do produto"
          hint="Opcional"
          open={openSections.photo}
          onToggle={() => setOpenSections((s) => ({ ...s, photo: !s.photo }))}
        >
          <div className="flex items-start gap-4">
            <div className="w-28 h-28 rounded-2xl bg-spark-surface-sunken border border-spark-hairline overflow-hidden flex items-center justify-center shrink-0 shadow-rest">
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Upload size={24} strokeWidth={1.6} className="text-spark-ink-35" />
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-spark-ink text-white text-[12.5px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <Upload size={13} strokeWidth={2.2} />
                {uploadingImage
                  ? "Subindo..."
                  : form.image_url
                    ? "Trocar foto"
                    : "Escolher foto"}
              </button>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => updateField("image_url", null)}
                  className="self-start inline-flex items-center gap-1 text-[11.5px] text-bad font-bold hover:underline"
                >
                  <X size={11} /> Remover
                </button>
              )}
            </div>
          </div>
        </SectionAccordion>

        {/* BÁSICOS */}
        <SectionAccordion
          emoji="📋"
          title="Informações básicas"
          hint="Nome, categoria, público, preço"
          open={openSections.basics}
          onToggle={() => setOpenSections((s) => ({ ...s, basics: !s.basics }))}
        >
          <div className="space-y-4">
            <Field label="Nome do produto" required>
              <PremiumInput
                value={form.name}
                onChange={(v) => updateField("name", v)}
                placeholder="ex: Gel de Limpeza GL-01 Principia"
                maxLength={200}
              />
            </Field>
            <Field label="Categoria">
              <PremiumInput
                value={form.category}
                onChange={(v) => updateField("category", v)}
                placeholder="ex: Skincare / Limpeza Facial"
                maxLength={100}
              />
            </Field>
            <Field label="Público-alvo">
              <PremiumTextarea
                value={form.target_audience}
                onChange={(v) => updateField("target_audience", v)}
                placeholder="ex: Mulheres 25-40 anos com pele mista a oleosa, que buscam rotina simples"
                rows={2}
                maxLength={500}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Faixa de preço">
                <PremiumInput
                  value={form.price_range}
                  onChange={(v) => updateField("price_range", v)}
                  placeholder="ex: R$ 19,90 a R$ 39,90"
                  maxLength={100}
                />
              </Field>
              <Field label="Sazonalidade">
                <PremiumInput
                  value={form.seasonality}
                  onChange={(v) => updateField("seasonality", v)}
                  placeholder="ex: Vende o ano todo, pico no verão"
                  maxLength={300}
                />
              </Field>
            </div>
          </div>
        </SectionAccordion>

        {/* LISTAS */}
        <SectionAccordion
          emoji="🧠"
          title="Análise estratégica"
          hint="9 listas com 1-8 itens cada"
          open={openSections.strategy}
          onToggle={() => setOpenSections((s) => ({ ...s, strategy: !s.strategy }))}
        >
          <div className="space-y-5">
            {(Object.keys(ARRAY_LABELS) as ArrayFieldKey[]).map((key) => (
              <ArrayField
                key={key}
                emoji={ARRAY_LABELS[key].emoji}
                label={ARRAY_LABELS[key].label}
                placeholder={ARRAY_LABELS[key].placeholder}
                values={form[key]}
                max={ARRAY_LABELS[key].max}
                onChange={(idx, v) => updateArrayItem(key, idx, v)}
                onAdd={() => addArrayItem(key)}
                onRemove={(idx) => removeArrayItem(key, idx)}
              />
            ))}
          </div>
        </SectionAccordion>
      </div>

      {/* SAVE BAR fixa */}
      <div
        className="fixed inset-x-0 z-30 px-4 pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 92px)" }}
      >
        <div className={cn("mx-auto pointer-events-auto", desktop ? "max-w-[820px]" : "max-w-full")}>
          <div className="glass rounded-full shadow-lift flex items-center gap-3 p-2">
            <div className="flex-1 pl-4 text-[11.5px] text-spark-ink-50">
              {form.name.trim() ? (
                <>
                  <strong className="text-spark-ink">{form.name}</strong>
                  <span className="text-spark-ink-50"> · {progressPct}% preenchido</span>
                </>
              ) : (
                <span>Coloca pelo menos o nome pra salvar</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !form.name.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-spark-brand-deep active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Save size={14} strokeWidth={2.5} />
              {saving ? "Salvando..." : "Salvar produto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// SUB-COMPONENTES
// =================================================================

function SectionAccordion({
  emoji,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  emoji: string;
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <SectionReveal direction="up">
      <section className="mb-4 rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-spark-surface-sunken/40 transition-colors duration-300"
        >
          <div className="w-11 h-11 rounded-full bg-brand-grad-soft flex items-center justify-center text-[20px] shrink-0">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-extrabold text-spark-ink tracking-tight">
              {title}
            </div>
            {hint && (
              <div className="text-[11.5px] text-spark-ink-50 mt-0.5 leading-snug">
                {hint}
              </div>
            )}
          </div>
          <ChevronDown
            size={16}
            strokeWidth={2.2}
            className={cn(
              "text-spark-ink-50 transition-transform duration-300 shrink-0",
              open && "rotate-180",
            )}
          />
        </button>
        {open && <div className="px-5 pb-5 pt-2">{children}</div>}
      </section>
    </SectionReveal>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-eyebrow text-spark-ink mb-2">
        {label}
        {required && <span className="text-spark-brand"> *</span>}
      </label>
      {children}
    </div>
  );
}

function PremiumInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full px-4 py-3 rounded-2xl border border-spark-hairline bg-white text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 transition-all duration-200"
    />
  );
}

function PremiumTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className="w-full px-4 py-3 rounded-2xl border border-spark-hairline bg-white text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 transition-all duration-200 resize-none"
    />
  );
}

function ArrayField({
  emoji,
  label,
  placeholder,
  values,
  max,
  onChange,
  onAdd,
  onRemove,
}: {
  emoji: string;
  label: string;
  placeholder: string;
  values: string[];
  max: number;
  onChange: (idx: number, v: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  const filled = values.filter((v) => v.trim()).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-eyebrow text-spark-ink flex items-center gap-1.5">
          <span>{emoji}</span>
          {label}
        </label>
        <span className="text-[10.5px] font-extrabold text-spark-ink-50 font-mono">
          {filled}/{max}
        </span>
      </div>
      <div className="space-y-2">
        {values.map((v, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={v}
              onChange={(e) => onChange(idx, e.target.value)}
              placeholder={placeholder}
              maxLength={200}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-spark-hairline bg-white text-[13.5px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 transition-all duration-200"
            />
            {values.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                aria-label="Remover item"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-spark-ink-50 hover:text-bad hover:bg-bad/10 transition-colors shrink-0"
              >
                <Trash2 size={14} strokeWidth={1.8} />
              </button>
            )}
          </div>
        ))}
        {values.length < max && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-extrabold text-spark-brand-deep hover:text-spark-brand hover:bg-spark-brand-soft/40 transition-colors duration-300"
          >
            <Plus size={12} strokeWidth={2.5} /> Adicionar mais
          </button>
        )}
      </div>
    </div>
  );
}

// =================================================================
// BODY + PAGE
// =================================================================

function NovoProdutoBody({ desktop = false }: { desktop?: boolean }) {
  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 0 : "calc(env(safe-area-inset-bottom) + 88px)" }}
    >
      <HeroSection desktop={desktop} />
      <NovoProdutoForm desktop={desktop} />
    </div>
  );
}

function NovoProdutoMobile() {
  return <NovoProdutoBody />;
}

function NovoProdutoDesktop() {
  return <NovoProdutoBody desktop />;
}

export default function NovoProdutoPage() {
  return (
    <>
      <ResponsiveShell
        mobile={<NovoProdutoMobile />}
        desktop={<NovoProdutoDesktop />}
        active="produtos"
        customSidebar
      />
      <FloatingMainNav active="produtos" />
    </>
  );
}

void Sparkles;
