"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    const res = await fetch("/api/admin/upload?bucket=news-covers", { method: "POST", body: fd });
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

  return (
    <form onSubmit={submit} className="max-w-[820px] mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">
          {mode === "create" ? "Novo artigo 📰" : "Editar artigo ✏️"}
        </h1>
        <Link href="/admin/news" className="text-[13px] text-spark-ink-50 hover:text-spark-ink">
          ← Voltar
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Título" required>
          <SInput value={data.title} onChange={(e) => onTitleChange(e.target.value)} required />
        </Field>
        <Field label="Slug (URL)" required>
          <SInput value={data.slug} onChange={(e) => update("slug", slugify(e.target.value))} required />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            onChange={(e) => update("reading_minutes", Number(e.target.value) || 3)}
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
          className="w-full px-3.5 py-2.5 rounded-[12px] bg-white border border-spark-border focus:border-spark-brand outline-none text-[14px]"
          placeholder="1-2 linhas que aparecem no feed."
        />
      </Field>

      <Field label="Capa (imagem)">
        <div className="flex items-start gap-3">
          {data.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.cover_url}
              alt=""
              className="w-28 h-20 rounded-lg object-cover border border-spark-hairline"
            />
          )}
          <div className="flex-1">
            <SInput
              value={data.cover_url}
              onChange={(e) => update("cover_url", e.target.value)}
              placeholder="https://..."
            />
            <label className="mt-2 inline-flex items-center gap-2 text-[12px] text-spark-brand cursor-pointer">
              📷 Subir imagem
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
          rows={14}
          className="w-full px-3.5 py-2.5 rounded-[12px] bg-white border border-spark-border focus:border-spark-brand outline-none text-[14px] font-mono"
          placeholder={"# Título\n\nUm parágrafo aqui...\n\n## Subtítulo"}
        />
      </Field>

      <label className="flex items-center gap-2 text-[13px] font-semibold">
        <input
          type="checkbox"
          checked={data.is_new}
          onChange={(e) => update("is_new", e.target.checked)}
        />
        Mostrar selo &ldquo;Novo&rdquo; no feed
      </label>

      {error && (
        <div className="text-[13px] text-bad bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">
          ⚠ {error}
        </div>
      )}

      <div className="flex gap-2">
        <SButton variant="primary" type="submit" disabled={saving}>
          {saving ? "Salvando…" : mode === "create" ? "Publicar artigo" : "Salvar mudanças"}
        </SButton>
        <Link href="/admin/news">
          <SButton variant="ghost">Cancelar</SButton>
        </Link>
      </div>
    </form>
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
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-bold text-spark-ink-70 tracking-[0.04em] uppercase">
        {label}
        {required && <span className="text-bad ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
