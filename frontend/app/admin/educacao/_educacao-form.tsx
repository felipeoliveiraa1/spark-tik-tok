"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SButton } from "@/components/atoms/s-button";
import { SInput } from "@/components/atoms/s-input";
import { extractYoutubeId, youtubeThumbUrl } from "@/lib/youtube";

export type EducacaoFormData = {
  slug: string;
  title: string;
  description: string;
  category: string;
  youtube_url: string;
  cover_url: string;
  duration_seconds: number;
  order_index: number;
  is_published: boolean;
};

const EMPTY: EducacaoFormData = {
  slug: "",
  title: "",
  description: "",
  category: "",
  youtube_url: "",
  cover_url: "",
  duration_seconds: 0,
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

export function EducacaoForm({
  initial,
  mode,
  originalId,
}: {
  initial?: Partial<EducacaoFormData>;
  mode: "create" | "edit";
  originalId?: string;
}) {
  const router = useRouter();
  const [data, setData] = React.useState<EducacaoFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const update = <K extends keyof EducacaoFormData>(k: K, v: EducacaoFormData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
  };

  const onTitleChange = (v: string) => {
    update("title", v);
    if (mode === "create" && (!data.slug || data.slug === slugify(data.title))) {
      update("slug", slugify(v));
    }
  };

  const detectedYoutubeId = React.useMemo(
    () => extractYoutubeId(data.youtube_url),
    [data.youtube_url],
  );
  const previewThumb = detectedYoutubeId ? youtubeThumbUrl(detectedYoutubeId, "hq") : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!detectedYoutubeId) {
      setError("Cole uma URL ou ID válido do YouTube.");
      return;
    }
    setSaving(true);
    const payload = {
      slug: data.slug,
      title: data.title,
      description: data.description,
      category: data.category || null,
      youtube_id: detectedYoutubeId,
      cover_url: data.cover_url || null,
      duration_seconds: data.duration_seconds || null,
      order_index: data.order_index,
      is_published: data.is_published,
    };
    const url = mode === "create" ? "/api/educacao" : `/api/educacao/${originalId ?? data.slug}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/educacao");
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "save_failed");
    }
  };

  return (
    <form onSubmit={submit} className="max-w-[820px] mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">
          {mode === "create" ? "Nova aula 🎓" : "Editar aula ✏️"}
        </h1>
        <Link href="/admin/educacao" className="text-[13px] text-spark-ink-50 hover:text-spark-ink">
          ← Voltar
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Título" required>
          <SInput value={data.title} onChange={(e) => onTitleChange(e.target.value)} required />
        </Field>
        <Field label="Slug (URL)" required>
          <SInput
            value={data.slug}
            onChange={(e) => update("slug", slugify(e.target.value))}
            required
          />
        </Field>
      </div>

      <Field label="URL do YouTube" required>
        <SInput
          value={data.youtube_url}
          onChange={(e) => update("youtube_url", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          required
        />
        {detectedYoutubeId ? (
          <div className="mt-2 flex items-center gap-3">
            {previewThumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewThumb}
                alt=""
                className="w-32 h-20 object-cover rounded-md border border-spark-hairline"
              />
            )}
            <div className="text-[11px] text-good font-mono">✓ id: {detectedYoutubeId}</div>
          </div>
        ) : data.youtube_url ? (
          <div className="text-[11px] text-bad mt-1">URL ou ID não reconhecido</div>
        ) : null}
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Categoria">
          <SInput
            value={data.category}
            onChange={(e) => update("category", e.target.value)}
            placeholder="ex: Começando"
          />
        </Field>
        <Field label="Ordem">
          <SInput
            type="number"
            value={String(data.order_index)}
            onChange={(e) => update("order_index", Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Duração (segundos, opcional)">
          <SInput
            type="number"
            value={String(data.duration_seconds || "")}
            onChange={(e) => update("duration_seconds", Number(e.target.value) || 0)}
          />
        </Field>
      </div>

      <Field label="Descrição">
        <textarea
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className="w-full px-3.5 py-2.5 rounded-[12px] bg-white border border-spark-border focus:border-spark-brand outline-none text-[14px]"
          placeholder="O que a aluna vai aprender..."
        />
      </Field>

      <Field label="Capa customizada (opcional — usamos o thumb do YouTube por default)">
        <SInput
          value={data.cover_url}
          onChange={(e) => update("cover_url", e.target.value)}
          placeholder="https://..."
        />
      </Field>

      <label className="flex items-center gap-2 text-[13px] font-semibold">
        <input
          type="checkbox"
          checked={data.is_published}
          onChange={(e) => update("is_published", e.target.checked)}
        />
        Publicar (alunas conseguem ver)
      </label>

      {error && (
        <div className="text-[13px] text-bad bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">
          ⚠ {error}
        </div>
      )}

      <div className="flex gap-2">
        <SButton variant="primary" type="submit" disabled={saving}>
          {saving ? "Salvando…" : mode === "create" ? "Publicar aula" : "Salvar mudanças"}
        </SButton>
        <Link href="/admin/educacao">
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
