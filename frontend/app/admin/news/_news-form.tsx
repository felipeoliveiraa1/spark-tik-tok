"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Newspaper, Pencil, Camera, AlertCircle } from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SButton } from "@/components/atoms/s-button";
import { SInput } from "@/components/atoms/s-input";

export type NewsFormData = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover_url: string;
  body_md: string;
  reading_minutes: number;
  is_new: boolean;
  published_at: string;
};

const EMPTY: NewsFormData = {
  slug: "",
  title: "",
  category: "",
  excerpt: "",
  cover_url: "",
  body_md: "",
  reading_minutes: 3,
  is_new: true,
  published_at: new Date().toISOString().slice(0, 16),
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

export function NewsForm({
  initial,
  mode,
  originalSlug,
}: {
  initial?: Partial<NewsFormData>;
  mode: "create" | "edit";
  originalSlug?: string;
}) {
  const router = useRouter();
  const [data, setData] = React.useState<NewsFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const update = <K extends keyof NewsFormData>(k: K, v: NewsFormData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
  };

  const onTitleChange = (v: string) => {
    update("title", v);
    if (mode === "create" && (!data.slug || data.slug === slugify(data.title))) {
      update("slug", slugify(v));
    }
  };

  const handleUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload?bucket=news-covers", {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    if (res.ok && json.url) {
      update("cover_url", json.url);
    } else {
      setError(json.error ?? "upload_failed");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      ...data,
      published_at: new Date(data.published_at).toISOString(),
    };
    const url = mode === "create" ? "/api/news" : `/api/news/${originalSlug ?? data.slug}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/news");
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "save_failed");
    }
  };

  const Icon = mode === "create" ? Newspaper : Pencil;
  const eyebrow = mode === "create" ? "✦ nova matéria" : "✦ editar matéria";
  const title =
    mode === "create" ? (
      <>
        escrever <span className="text-grad-brand">no jornal.</span>
      </>
    ) : (
      <>
        ajustar a <span className="text-grad-brand">história.</span>
      </>
    );

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial -mx-4 lg:-mx-10 px-4 lg:px-10 pt-6 lg:pt-10 pb-10 rounded-spark-3xl">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-24 w-[420px] h-[420px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-20 w-[420px] h-[420px]" />
        <SparkleField count={10} seed={606} className="opacity-50" />

        <div className="relative max-w-[820px] mx-auto">
          <Link
            href="/admin/news"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pras news
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
          className="max-w-[820px] mx-auto mt-8 p-6 lg:p-8 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest flex flex-col gap-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Título" required>
              <SInput
                value={data.title}
                onChange={(e) => onTitleChange(e.target.value)}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Categoria" required>
              <SInput
                value={data.category}
                onChange={(e) => update("category", e.target.value)}
                placeholder="ex: Tendência"
                required
              />
            </Field>
            <Field label="Leitura (min)">
              <SInput
                type="number"
                min={1}
                value={String(data.reading_minutes)}
                onChange={(e) =>
                  update("reading_minutes", Number(e.target.value) || 3)
                }
              />
            </Field>
            <Field label="Publicação">
              <SInput
                type="datetime-local"
                value={data.published_at.slice(0, 16)}
                onChange={(e) => update("published_at", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Resumo">
            <textarea
              value={data.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] transition-all duration-200"
              placeholder="1-2 linhas que aparecem no feed."
            />
          </Field>

          <Field label="Capa (imagem)">
            <div className="flex items-start gap-4">
              {data.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.cover_url}
                  alt=""
                  className="w-32 h-24 rounded-spark-xl object-cover border border-spark-hairline shadow-rest"
                />
              )}
              <div className="flex-1">
                <SInput
                  value={data.cover_url}
                  onChange={(e) => update("cover_url", e.target.value)}
                  placeholder="https://..."
                />
                <label className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-brand-soft text-spark-brand-deep text-[12px] font-extrabold cursor-pointer hover:bg-spark-brand/15 transition-colors duration-200">
                  <Camera size={12} strokeWidth={2.5} />
                  Subir imagem
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleUpload(f);
                    }}
                  />
                </label>
              </div>
            </div>
          </Field>

          <Field label="Conteúdo (Markdown)">
            <textarea
              value={data.body_md}
              onChange={(e) => update("body_md", e.target.value)}
              rows={16}
              className="w-full px-4 py-3 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] font-mono transition-all duration-200"
              placeholder={"# Título\n\nUm parágrafo aqui...\n\n## Subtítulo"}
            />
          </Field>

          <label className="flex items-center gap-2.5 text-[13.5px] font-extrabold text-spark-ink select-none cursor-pointer">
            <input
              type="checkbox"
              checked={data.is_new}
              onChange={(e) => update("is_new", e.target.checked)}
              className="w-4 h-4 rounded text-spark-brand focus:ring-spark-brand/30"
            />
            Mostrar selo &ldquo;Novo&rdquo; no feed
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
                  ? "Publicar artigo"
                  : "Salvar mudanças"}
            </SButton>
            <Link href="/admin/news">
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
