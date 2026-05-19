"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SButton } from "@/components/atoms/s-button";
import { SInput } from "@/components/atoms/s-input";
import { extractYoutubeId, youtubeThumbUrl } from "@/lib/youtube";

export type LiveFormData = {
  slug: string;
  title: string;
  description: string;
  youtube_url: string;
  cover_url: string;
  starts_at: string;
  duration_minutes: number;
  is_published: boolean;
};

const EMPTY: LiveFormData = {
  slug: "",
  title: "",
  description: "",
  youtube_url: "",
  cover_url: "",
  starts_at: new Date(Date.now() + 60 * 60_000).toISOString().slice(0, 16),
  duration_minutes: 60,
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

export function AoVivoForm({
  initial,
  mode,
  originalId,
}: {
  initial?: Partial<LiveFormData>;
  mode: "create" | "edit";
  originalId?: string;
}) {
  const router = useRouter();
  const [data, setData] = React.useState<LiveFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const update = <K extends keyof LiveFormData>(k: K, v: LiveFormData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
  };

  const onTitleChange = (v: string) => {
    update("title", v);
    if (mode === "create" && (!data.slug || data.slug === slugify(data.title))) {
      update("slug", slugify(v));
    }
  };

  const youtubeId = React.useMemo(() => extractYoutubeId(data.youtube_url), [data.youtube_url]);
  const previewThumb = youtubeId ? youtubeThumbUrl(youtubeId, "hq") : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!youtubeId) {
      setError("Cole uma URL ou ID válido do YouTube.");
      return;
    }
    setSaving(true);
    const payload = {
      slug: data.slug,
      title: data.title,
      description: data.description,
      youtube_id: youtubeId,
      cover_url: data.cover_url || null,
      starts_at: new Date(data.starts_at).toISOString(),
      duration_minutes: data.duration_minutes || 60,
      is_published: data.is_published,
    };
    const url = mode === "create" ? "/api/ao-vivo" : `/api/ao-vivo/${originalId ?? data.slug}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) router.push("/admin/ao-vivo");
    else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "save_failed");
    }
  };

  return (
    <form onSubmit={submit} className="max-w-[820px] mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">
          {mode === "create" ? "Nova live 🔴" : "Editar live ✏️"}
        </h1>
        <Link href="/admin/ao-vivo" className="text-[13px] text-spark-ink-50 hover:text-spark-ink">
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

      <Field label="URL do YouTube Live" required>
        <SInput
          value={data.youtube_url}
          onChange={(e) => update("youtube_url", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=... ou /live/..."
          required
        />
        {youtubeId ? (
          <div className="mt-2 flex items-center gap-3">
            {previewThumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewThumb}
                alt=""
                className="w-32 h-20 object-cover rounded-md border border-spark-hairline"
              />
            )}
            <div className="text-[11px] text-good font-mono">✓ id: {youtubeId}</div>
          </div>
        ) : data.youtube_url ? (
          <div className="text-[11px] text-bad mt-1">URL ou ID não reconhecido</div>
        ) : null}
        <div className="text-[11.5px] text-spark-ink-50 mt-1.5">
          Yara cria a live no YouTube (mesmo antes de começar, o YouTube já gera o link).
          Você cola aqui. Quando a transmissão acabar, vira replay automaticamente.
        </div>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Início" required>
          <SInput
            type="datetime-local"
            value={data.starts_at.slice(0, 16)}
            onChange={(e) => update("starts_at", e.target.value)}
            required
          />
        </Field>
        <Field label="Duração estimada (min)">
          <SInput
            type="number"
            min={5}
            value={String(data.duration_minutes)}
            onChange={(e) => update("duration_minutes", Number(e.target.value) || 60)}
          />
        </Field>
      </div>

      <Field label="Descrição">
        <textarea
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className="w-full px-3.5 py-2.5 rounded-[12px] bg-white border border-spark-border focus:border-spark-brand outline-none text-[14px]"
          placeholder="Sobre o que vai ser essa live..."
        />
      </Field>

      <Field label="Capa customizada (opcional — usamos thumb do YouTube por default)">
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
          {saving ? "Salvando…" : mode === "create" ? "Agendar live" : "Salvar mudanças"}
        </SButton>
        <Link href="/admin/ao-vivo">
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
