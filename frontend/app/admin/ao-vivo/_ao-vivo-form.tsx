"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Radio,
  Pencil,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
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
      setError("Cola uma URL ou ID válido do YouTube.");
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

  const Icon = mode === "create" ? Radio : Pencil;
  const eyebrow = mode === "create" ? "✦ nova live" : "✦ editar live";
  const title =
    mode === "create" ? (
      <>
        agendar um <span className="text-grad-brand">encontro.</span>
      </>
    ) : (
      <>
        ajustar a <span className="text-grad-brand">live.</span>
      </>
    );

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial -mx-4 lg:-mx-10 px-4 lg:px-10 pt-6 lg:pt-10 pb-10 rounded-spark-3xl">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-24 w-[420px] h-[420px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-20 w-[420px] h-[420px]" />
        <SparkleField count={10} seed={1010} className="opacity-50" />

        <div className="relative max-w-[820px] mx-auto">
          <Link
            href="/admin/ao-vivo"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pras lives
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

          <Field label="URL do YouTube Live" required>
            <div className="relative">
              <PlayCircle
                size={16}
                strokeWidth={2.2}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-spark-ink-50 pointer-events-none z-10"
              />
              <SInput
                value={data.youtube_url}
                onChange={(e) => update("youtube_url", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ou /live/..."
                required
                className="pl-10"
              />
            </div>
            {youtubeId ? (
              <div className="mt-3 flex items-center gap-3 p-3 rounded-spark-xl bg-good/5 border border-good/15">
                {previewThumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewThumb}
                    alt=""
                    className="w-32 h-20 object-cover rounded-spark-lg border border-spark-hairline"
                  />
                )}
                <div className="flex items-center gap-1.5 text-[12px] text-good font-extrabold">
                  <CheckCircle2 size={13} strokeWidth={2.5} />
                  ID detectado: <span className="font-mono">{youtubeId}</span>
                </div>
              </div>
            ) : data.youtube_url ? (
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-bad font-extrabold">
                <AlertCircle size={12} strokeWidth={2.5} />
                URL ou ID não reconhecido
              </div>
            ) : null}
            <p className="text-[11.5px] text-spark-ink-50 mt-3 leading-relaxed">
              Yara cria a live no YouTube (mesmo antes de começar, o YouTube já gera o link).
              Você cola aqui. Quando a transmissão acabar, vira replay automaticamente.
            </p>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) =>
                  update("duration_minutes", Number(e.target.value) || 60)
                }
              />
            </Field>
          </div>

          <Field label="Descrição">
            <textarea
              value={data.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] transition-all duration-200"
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

          <label className="flex items-center gap-2.5 text-[13.5px] font-extrabold text-spark-ink select-none cursor-pointer">
            <input
              type="checkbox"
              checked={data.is_published}
              onChange={(e) => update("is_published", e.target.checked)}
              className="w-4 h-4 rounded text-spark-brand focus:ring-spark-brand/30"
            />
            Publicar (alunas conseguem ver)
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
                  ? "Agendar live"
                  : "Salvar mudanças"}
            </SButton>
            <Link href="/admin/ao-vivo">
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
