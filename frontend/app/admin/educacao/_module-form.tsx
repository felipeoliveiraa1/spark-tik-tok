"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers, Pencil, AlertCircle } from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SButton } from "@/components/atoms/s-button";
import { SInput } from "@/components/atoms/s-input";
import { cn } from "@/lib/cn";

type Accent = "rose" | "peach" | "lilac";

export type ModuleFormData = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cover_url: string;
  accent: Accent;
  order_index: number;
  is_published: boolean;
};

const EMPTY: ModuleFormData = {
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  cover_url: "",
  accent: "rose",
  order_index: 0,
  is_published: true,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const ACCENT_SWATCH: Record<Accent, { bg: string; ring: string; label: string }> = {
  rose: {
    bg: "bg-gradient-to-br from-rose-300 to-pink-200",
    ring: "ring-rose-400",
    label: "Rosa",
  },
  peach: {
    bg: "bg-gradient-to-br from-orange-300 to-rose-200",
    ring: "ring-orange-400",
    label: "Pêssego",
  },
  lilac: {
    bg: "bg-gradient-to-br from-purple-300 to-pink-200",
    ring: "ring-purple-400",
    label: "Lilás",
  },
};

function AccentSwatch({
  value,
  onChange,
}: {
  value: Accent;
  onChange: (a: Accent) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {(Object.keys(ACCENT_SWATCH) as Accent[]).map((a) => {
        const swatch = ACCENT_SWATCH[a];
        const active = value === a;
        return (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className={cn(
              "group p-4 rounded-spark-2xl border-2 transition-all duration-300 ease-premium text-left",
              active
                ? "border-spark-brand bg-spark-brand-soft/40 shadow-lift-brand"
                : "border-spark-hairline hover:border-spark-brand/40 hover:bg-spark-surface-sunken/60",
            )}
          >
            <div
              className={cn(
                "w-full h-12 rounded-spark-xl shadow-rest transition-transform duration-300",
                swatch.bg,
                active ? "scale-105" : "group-hover:scale-105",
              )}
            />
            <div className="mt-2.5 text-[12px] font-extrabold text-spark-ink">
              {swatch.label}
            </div>
            <div className="text-[10px] text-spark-ink-50 font-mono">{a}</div>
          </button>
        );
      })}
    </div>
  );
}

export function ModuleForm({
  initial,
  mode,
  originalSlug,
}: {
  initial?: Partial<ModuleFormData>;
  mode: "create" | "edit";
  originalSlug?: string;
}) {
  const router = useRouter();
  const [data, setData] = React.useState<ModuleFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const update = <K extends keyof ModuleFormData>(k: K, v: ModuleFormData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
  };

  const onTitleChange = (v: string) => {
    update("title", v);
    if (mode === "create" && (!data.slug || data.slug === slugify(data.title))) {
      update("slug", slugify(v));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle || null,
      description: data.description || null,
      cover_url: data.cover_url || null,
      accent: data.accent,
      order_index: data.order_index,
      is_published: data.is_published,
    };

    const url =
      mode === "create"
        ? "/api/educacao/modules"
        : `/api/educacao/modules/${originalSlug ?? data.slug}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const dataRes = (await res.json().catch(() => null)) as
        | { item?: { slug?: string } }
        | null;
      const targetSlug = dataRes?.item?.slug ?? data.slug;
      router.push(`/admin/educacao/m/${targetSlug}`);
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "save_failed");
    }
  };

  const Icon = mode === "create" ? Layers : Pencil;
  const eyebrow = mode === "create" ? "✦ novo módulo" : "✦ editar módulo";
  const title =
    mode === "create" ? (
      <>
        criar um <span className="text-grad-brand">novo módulo.</span>
      </>
    ) : (
      <>
        ajustar o <span className="text-grad-brand">módulo.</span>
      </>
    );

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial -mx-4 lg:-mx-10 px-4 lg:px-10 pt-6 lg:pt-10 pb-10 rounded-spark-3xl">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-24 w-[420px] h-[420px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-20 w-[420px] h-[420px]" />
        <SparkleField count={10} seed={1111} className="opacity-50" />

        <div className="relative max-w-[820px] mx-auto">
          <Link
            href={mode === "edit" && originalSlug ? `/admin/educacao/m/${originalSlug}` : "/admin/educacao"}
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar
          </Link>

          <div className="mt-6 inline-flex items-center gap-2 text-eyebrow text-spark-brand">
            <Icon size={13} strokeWidth={2.5} />
            {eyebrow}
          </div>
          <h1
            className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            {title}
          </h1>
        </div>
      </section>

      {/* Form */}
      <SectionReveal direction="up">
        <form
          onSubmit={submit}
          className="max-w-[820px] mx-auto mt-8 p-6 lg:p-8 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Título" required>
              <SInput
                value={data.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="ex: 1 · Estrutura e Rotina"
                required
              />
            </Field>
            <Field label="Slug (URL)" required>
              <SInput
                value={data.slug}
                onChange={(e) => update("slug", slugify(e.target.value))}
                required
              />
            </Field>
          </div>

          <Field label="Subtítulo (1 linha curta)">
            <SInput
              value={data.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
              placeholder="Como criar uma rotina que vira venda."
            />
          </Field>

          <Field label="Descrição">
            <textarea
              value={data.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] transition-all duration-200"
              placeholder="Parágrafo descritivo do módulo..."
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Ordem">
              <SInput
                type="number"
                value={String(data.order_index)}
                onChange={(e) => update("order_index", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Capa (URL, opcional)">
              <SInput
                value={data.cover_url}
                onChange={(e) => update("cover_url", e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>

          <Field label="Cor de destaque (accent)">
            <AccentSwatch value={data.accent} onChange={(a) => update("accent", a)} />
          </Field>

          <label className="flex items-center gap-2.5 text-[13.5px] font-extrabold text-spark-ink select-none cursor-pointer">
            <input
              type="checkbox"
              checked={data.is_published}
              onChange={(e) => update("is_published", e.target.checked)}
              className="w-4 h-4 rounded text-spark-brand focus:ring-spark-brand/30"
            />
            Publicar (módulo aparece na trilha pras alunas)
          </label>

          {error && (
            <div className="px-4 py-3 rounded-spark-xl bg-bad/5 border border-bad/20 text-bad text-[13px] inline-flex items-center gap-2 font-extrabold">
              <AlertCircle size={14} strokeWidth={2.5} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <SButton variant="primary" type="submit" disabled={saving}>
              {saving
                ? "Salvando..."
                : mode === "create"
                  ? "Criar módulo"
                  : "Salvar mudanças"}
            </SButton>
            <Link
              href={
                mode === "edit" && originalSlug
                  ? `/admin/educacao/m/${originalSlug}`
                  : "/admin/educacao"
              }
            >
              <SButton variant="ghost">Cancelar</SButton>
            </Link>
          </div>
        </form>
      </SectionReveal>
    </div>
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
    <label className="flex flex-col gap-2">
      <span className="text-eyebrow text-spark-ink-50">
        {label}
        {required && <span className="text-bad ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
