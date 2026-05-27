"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, Trash2, Save } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useToast } from "@/components/molecules/dialog-provider";

/**
 * Página de cadastro manual de produto.
 *
 * Aluna preenche os 14 campos (alguns texto livre, outros listas) +
 * sobe foto opcional. Os campos espelham a ficha que a Info gerava
 * antes — agora a aluna pega a ficha do Gemini/ChatGPT e cola aqui.
 *
 * Estrutura visual: 1 seção por bloco, agrupado por importância.
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

const ARRAY_LABELS: Record<ArrayFieldKey, { label: string; placeholder: string; min: number; max: number }> = {
  pain_points: { label: "Dores que resolve", placeholder: "ex: Pele oleosa que brilha o dia todo", min: 1, max: 8 },
  strengths: { label: "Pontos fortes", placeholder: "ex: Fórmula 3 em 1: limpa, hidrata e clareia", min: 1, max: 8 },
  competitors: { label: "Concorrentes", placeholder: "ex: Sallve Gel Pureza", min: 1, max: 8 },
  differentiators: { label: "Diferenciais únicos", placeholder: "ex: Único com prebiótico no Brasil", min: 1, max: 8 },
  objections: { label: "Objeções a quebrar", placeholder: "ex: 'Será que reseca minha pele?'", min: 1, max: 8 },
  emotional_triggers: { label: "Gatilhos emocionais", placeholder: "ex: Autoestima, pertencimento, status", min: 1, max: 8 },
  usage_moments: { label: "Momentos de uso", placeholder: "ex: Manhã, antes de dormir, antes do treino", min: 1, max: 6 },
  content_angles: { label: "Ângulos de conteúdo", placeholder: "ex: Antes/depois de 7 dias", min: 1, max: 8 },
  hook_ideas: { label: "Hooks prontos", placeholder: "ex: 'Achei o gel de limpeza perfeito por R$ 19'", min: 1, max: 8 },
};

function NovoProdutoBody({ desktop = false }: { desktop?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      toast.success("Produto salvo 💕");
      router.push(`/produtos/${data.id}`);
    } catch {
      toast.error("Não consegui salvar agora.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-24"}`}>
      <div className={desktop ? "max-w-[720px]" : "px-4 pt-4"}>
        {desktop && (
          <>
            <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
              📦 Novo Produto
            </div>
            <h1 className="mt-1 font-extrabold tracking-tight leading-[1.1] text-[36px]">
              Cadastrar produto ✨
            </h1>
          </>
        )}
        <p
          className={`text-[13.5px] text-spark-ink-50 max-w-[560px] ${desktop ? "mt-1.5 mb-6" : "mb-5"}`}
        >
          Cole aqui os campos da ficha que você gerou no agente (ChatGPT ou Gemini). Só o nome é
          obrigatório — você pode salvar parcial e completar depois 💕
        </p>

        {/* FOTO */}
        <Section title="Foto do produto" hint="Opcional">
          <div className="flex items-start gap-3">
            <div className="w-24 h-24 rounded-2xl bg-spark-surface-sunken border border-spark-hairline overflow-hidden flex items-center justify-center shrink-0">
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Upload size={20} strokeWidth={1.6} className="text-spark-ink-35" />
              )}
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
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
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-spark-ink text-white text-[12.5px] font-bold active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
              >
                <Upload size={13} strokeWidth={2} />
                {uploadingImage ? "Subindo..." : form.image_url ? "Trocar foto" : "Escolher foto"}
              </button>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => updateField("image_url", null)}
                  className="inline-flex items-center gap-1 text-[11.5px] text-bad font-bold"
                >
                  <X size={11} /> Remover
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* BÁSICOS */}
        <Section title="Informações básicas">
          <Field label="Nome do produto" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="ex: Gel de Limpeza GL-01 Principia"
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl border border-spark-hairline bg-white text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand"
            />
          </Field>
          <Field label="Categoria">
            <input
              type="text"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="ex: Skincare / Limpeza Facial"
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl border border-spark-hairline bg-white text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand"
            />
          </Field>
          <Field label="Público-alvo">
            <textarea
              value={form.target_audience}
              onChange={(e) => updateField("target_audience", e.target.value)}
              placeholder="ex: Mulheres 25-40 anos com pele mista a oleosa, que buscam rotina simples"
              rows={2}
              maxLength={500}
              className="w-full px-3.5 py-2.5 rounded-xl border border-spark-hairline bg-white text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand resize-none"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Faixa de preço">
              <input
                type="text"
                value={form.price_range}
                onChange={(e) => updateField("price_range", e.target.value)}
                placeholder="ex: R$ 19,90 a R$ 39,90"
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl border border-spark-hairline bg-white text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand"
              />
            </Field>
            <Field label="Sazonalidade">
              <input
                type="text"
                value={form.seasonality}
                onChange={(e) => updateField("seasonality", e.target.value)}
                placeholder="ex: Vende o ano todo, pico no verão"
                maxLength={300}
                className="w-full px-3.5 py-2.5 rounded-xl border border-spark-hairline bg-white text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand"
              />
            </Field>
          </div>
        </Section>

        {/* LISTAS */}
        <Section title="Análise estratégica" hint="Listas com 1-8 itens cada">
          {(Object.keys(ARRAY_LABELS) as ArrayFieldKey[]).map((key) => (
            <ArrayField
              key={key}
              label={ARRAY_LABELS[key].label}
              placeholder={ARRAY_LABELS[key].placeholder}
              values={form[key]}
              max={ARRAY_LABELS[key].max}
              onChange={(idx, v) => updateArrayItem(key, idx, v)}
              onAdd={() => addArrayItem(key)}
              onRemove={(idx) => removeArrayItem(key, idx)}
            />
          ))}
        </Section>

        {/* SAVE BAR */}
        <div className={`${desktop ? "mt-8" : "mt-6 sticky bottom-0 -mx-4 px-4 py-3 bg-white border-t border-spark-hairline"}`}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-grad text-white text-[14px] font-extrabold shadow-[0_8px_24px_-12px_oklch(0.55_0.24_340/0.5)] active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
          >
            <Save size={15} strokeWidth={2.2} />
            {saving ? "Salvando..." : "Salvar produto"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-3">
        <h2 className="text-[14px] font-extrabold text-spark-ink tracking-tight">{title}</h2>
        {hint && <p className="text-[11.5px] text-spark-ink-50 mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
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
      <label className="block text-[12.5px] font-bold text-spark-ink mb-1.5">
        {label}
        {required && <span className="text-spark-brand"> *</span>}
      </label>
      {children}
    </div>
  );
}

function ArrayField({
  label,
  placeholder,
  values,
  max,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  values: string[];
  max: number;
  onChange: (idx: number, v: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-bold text-spark-ink mb-1.5">{label}</label>
      <div className="space-y-1.5">
        {values.map((v, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={v}
              onChange={(e) => onChange(idx, e.target.value)}
              placeholder={placeholder}
              maxLength={200}
              className="flex-1 px-3 py-2 rounded-lg border border-spark-hairline bg-white text-[13.5px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand"
            />
            {values.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                aria-label="Remover item"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-spark-ink-50 hover:text-bad hover:bg-bad/10 transition-colors shrink-0"
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
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-spark-brand py-1"
          >
            <Plus size={12} strokeWidth={2.5} /> Adicionar mais
          </button>
        )}
      </div>
    </div>
  );
}

function NovoProdutoMobile() {
  return (
    <>
      <MobileHeader title="Novo Produto ✨" back={{ href: "/produtos" }} />
      <NovoProdutoBody />
    </>
  );
}

function NovoProdutoDesktop() {
  return <NovoProdutoBody desktop />;
}

export default function NovoProdutoPage() {
  return (
    <ResponsiveShell mobile={<NovoProdutoMobile />} desktop={<NovoProdutoDesktop />} active="produtos" />
  );
}
