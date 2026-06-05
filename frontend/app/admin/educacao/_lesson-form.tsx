"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  GraduationCap,
  Pencil,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  ListChecks,
  Eye,
  Code as CodeIcon,
  Plus,
  X,
  GripVertical,
  BookOpen,
  Upload,
  Loader2,
  FileDown,
} from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SButton } from "@/components/atoms/s-button";
import { SInput } from "@/components/atoms/s-input";
import { extractYoutubeId, youtubeThumbUrl } from "@/lib/youtube";
import { cn } from "@/lib/cn";

// =================================================================
// TYPES
// =================================================================

type LessonKind = "video" | "rich" | "checklist" | "ebook";

type ChecklistItem = { text: string };

type ModuleOption = { id: string; slug: string; title: string; order_index: number };

export type LessonFormData = {
  slug: string;
  title: string;
  description: string;
  category: string;
  kind: LessonKind;
  youtube_url: string;
  body_md: string;
  checklist_items: ChecklistItem[];
  cover_url: string;
  duration_seconds: number;
  order_index: number;
  is_published: boolean;
  module_id: string | null;
  file_url: string;
  file_name: string;
  file_size_bytes: number;
};

const EMPTY: LessonFormData = {
  slug: "",
  title: "",
  description: "",
  category: "",
  kind: "video",
  youtube_url: "",
  body_md: "",
  checklist_items: [],
  cover_url: "",
  duration_seconds: 0,
  order_index: 0,
  is_published: true,
  module_id: null,
  file_url: "",
  file_name: "",
  file_size_bytes: 0,
};

function fmtFileSize(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// =================================================================
// KIND SWITCHER
// =================================================================

const KIND_OPTIONS: Array<{
  kind: LessonKind;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  desc: string;
}> = [
  { kind: "video", Icon: PlayCircle, label: "Vídeo", desc: "YouTube embed" },
  { kind: "rich", Icon: FileText, label: "Conteúdo Rich", desc: "Markdown editorial" },
  { kind: "checklist", Icon: ListChecks, label: "Checklist", desc: "Itens interativos" },
  { kind: "ebook", Icon: BookOpen, label: "Ebook", desc: "PDF pra baixar" },
];

function KindSwitcher({
  value,
  onChange,
}: {
  value: LessonKind;
  onChange: (k: LessonKind) => void;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-spark-xl bg-spark-surface-sunken border border-spark-hairline">
      {KIND_OPTIONS.map((opt) => {
        const active = value === opt.kind;
        return (
          <button
            key={opt.kind}
            type="button"
            onClick={() => onChange(opt.kind)}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-spark-lg transition-all duration-300 ease-premium",
              active
                ? "bg-brand-grad text-white shadow-lift-brand"
                : "text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface",
            )}
          >
            <opt.Icon
              size={18}
              strokeWidth={active ? 2.5 : 2.2}
              className={cn("transition-transform", active ? "scale-110" : "")}
            />
            <span className="text-[12.5px] font-extrabold">{opt.label}</span>
            <span className={cn("text-[10px] font-semibold", active ? "opacity-90" : "opacity-60")}>
              {opt.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// =================================================================
// MARKDOWN EDITOR + PREVIEW
// =================================================================

function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 18,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [tab, setTab] = React.useState<"edit" | "preview">("edit");

  return (
    <div className="rounded-spark-xl border border-spark-hairline bg-spark-bg overflow-hidden">
      <div className="flex items-center justify-between border-b border-spark-hairline px-2.5 py-1.5 bg-spark-surface">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-extrabold transition-all duration-300",
              tab === "edit"
                ? "bg-spark-ink text-white"
                : "text-spark-ink-70 hover:text-spark-ink",
            )}
          >
            <CodeIcon size={11} strokeWidth={2.5} />
            Editar
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-extrabold transition-all duration-300",
              tab === "preview"
                ? "bg-spark-ink text-white"
                : "text-spark-ink-70 hover:text-spark-ink",
            )}
          >
            <Eye size={11} strokeWidth={2.5} />
            Preview
          </button>
        </div>
        <div className="text-[10.5px] text-spark-ink-50 font-mono">
          {value.length} chars · {value.split("\n").length} linhas
        </div>
      </div>
      {tab === "edit" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-transparent outline-none text-[14px] font-mono leading-relaxed resize-y"
          style={{ minHeight: `${rows * 1.6}rem` }}
        />
      ) : (
        <div className="px-4 py-3 prose-tts" style={{ minHeight: `${rows * 1.6}rem` }}>
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <div className="text-spark-ink-50 italic text-[13.5px]">
              Nada pra prévia ainda. Escreve algo na aba Editar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =================================================================
// CHECKLIST BUILDER
// =================================================================

function ChecklistBuilder({
  items,
  onChange,
}: {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}) {
  const update = (idx: number, text: string) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, text } : it)));
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, { text: "" }]);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const arr = [...items];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange(arr);
  };

  return (
    <div className="space-y-2.5">
      {items.length === 0 && (
        <div className="text-center py-8 px-4 rounded-spark-xl border-2 border-dashed border-spark-hairline">
          <ListChecks size={28} strokeWidth={1.8} className="mx-auto text-spark-ink-50 mb-2" />
          <div className="text-[13px] text-spark-ink-50 font-semibold">
            Nenhum item ainda. Adiciona o primeiro abaixo.
          </div>
        </div>
      )}

      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 p-2.5 rounded-spark-xl bg-spark-surface border border-spark-hairline"
        >
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => move(i, i - 1)}
              disabled={i === 0}
              className="w-5 h-4 flex items-center justify-center text-spark-ink-50 hover:text-spark-ink disabled:opacity-30"
              aria-label="Mover pra cima"
            >
              <GripVertical size={12} strokeWidth={2.5} />
            </button>
          </div>
          <span className="w-7 h-7 rounded-full bg-spark-surface-sunken text-spark-ink-50 flex items-center justify-center font-mono text-[11px] font-extrabold shrink-0">
            {String(i + 1).padStart(2, "0")}
          </span>
          <input
            value={item.text}
            onChange={(e) => update(i, e.target.value)}
            placeholder="Texto do item..."
            className="flex-1 px-3 py-2 rounded-spark-lg bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="w-9 h-9 rounded-full text-spark-ink-50 hover:text-bad hover:bg-bad/10 flex items-center justify-center transition-colors duration-200 shrink-0"
            aria-label="Remover item"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-spark-xl border-2 border-dashed border-spark-brand/30 text-spark-brand-deep text-[13px] font-extrabold hover:bg-spark-brand-soft hover:border-spark-brand/50 transition-all duration-300 ease-premium"
      >
        <Plus size={14} strokeWidth={2.5} />
        Adicionar item
      </button>
    </div>
  );
}

// =================================================================
// EBOOK UPLOADER (PDF -> /api/admin/upload-ebook)
// =================================================================

function EbookUploader({
  fileUrl,
  fileName,
  fileSize,
  onChange,
}: {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  onChange: (url: string, name: string, size: number) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const pick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);

    if (file.type !== "application/pdf") {
      setErr("Só aceita PDF (.pdf).");
      e.target.value = "";
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setErr("Arquivo passa de 100MB. Tenta comprimir o PDF antes.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-ebook", { method: "POST", body: fd });
      const j = (await res.json()) as {
        ok?: boolean;
        url?: string;
        file_name?: string;
        file_size_bytes?: number;
        error?: string;
      };
      if (!res.ok || !j.ok || !j.url) {
        setErr(j.error ?? "Falhou o upload");
        return;
      }
      onChange(j.url, j.file_name ?? file.name, j.file_size_bytes ?? file.size);
    } catch (caught) {
      setErr(caught instanceof Error ? caught.message : "erro_upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const clear = () => {
    onChange("", "", 0);
    setErr(null);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onFile}
      />

      {fileUrl ? (
        <div className="flex items-center gap-3 p-4 rounded-spark-xl bg-good/5 border border-good/20">
          <div className="w-12 h-14 rounded-spark-lg bg-bad/10 text-bad flex items-center justify-center shrink-0">
            <FileDown size={22} strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[12px] font-extrabold text-good mb-0.5">
              <CheckCircle2 size={12} strokeWidth={2.5} />
              PDF enviado
            </div>
            <div className="text-[13.5px] font-extrabold text-spark-ink truncate">
              {fileName || "arquivo.pdf"}
            </div>
            <div className="text-[11px] text-spark-ink-50 font-mono mt-0.5">
              {fmtFileSize(fileSize)}
              <span className="mx-1.5 opacity-50">·</span>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-spark-brand-deep hover:text-spark-brand font-semibold"
              >
                abrir
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            className="px-3 py-2 rounded-full bg-spark-surface border border-spark-hairline text-[11.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken disabled:opacity-50 transition-colors"
          >
            Trocar
          </button>
          <button
            type="button"
            onClick={clear}
            aria-label="Remover PDF"
            className="w-9 h-9 rounded-full text-spark-ink-50 hover:text-bad hover:bg-bad/10 flex items-center justify-center transition-colors"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className="w-full p-6 rounded-spark-xl border-2 border-dashed border-spark-brand/40 hover:border-spark-brand/70 hover:bg-spark-brand-soft/30 transition-all duration-300 flex flex-col items-center gap-2 text-spark-brand-deep disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 size={28} strokeWidth={2.2} className="animate-spin" />
              <span className="text-[13px] font-extrabold">Enviando PDF…</span>
            </>
          ) : (
            <>
              <Upload size={28} strokeWidth={2.2} />
              <span className="text-[13.5px] font-extrabold">Selecionar PDF (até 100MB)</span>
              <span className="text-[11px] text-spark-ink-50 font-semibold">
                Aceita só .pdf. Sobe pro bucket lesson-ebooks.
              </span>
            </>
          )}
        </button>
      )}

      {err && (
        <div className="inline-flex items-center gap-1.5 text-[11.5px] text-bad font-extrabold">
          <AlertCircle size={12} strokeWidth={2.5} />
          {err}
        </div>
      )}
    </div>
  );
}

// =================================================================
// FORM
// =================================================================

export function LessonForm({
  initial,
  mode,
  originalId,
  modules,
}: {
  initial?: Partial<LessonFormData>;
  mode: "create" | "edit";
  originalId?: string;
  modules: ModuleOption[];
}) {
  const router = useRouter();
  const [data, setData] = React.useState<LessonFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const update = <K extends keyof LessonFormData>(k: K, v: LessonFormData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
  };

  const onTitleChange = (v: string) => {
    update("title", v);
    if (mode === "create" && (!data.slug || data.slug === slugify(data.title))) {
      update("slug", slugify(v));
    }
  };

  const detectedYoutubeId = React.useMemo(
    () => (data.kind === "video" ? extractYoutubeId(data.youtube_url) : null),
    [data.youtube_url, data.kind],
  );
  const previewThumb = detectedYoutubeId ? youtubeThumbUrl(detectedYoutubeId, "hq") : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (data.kind === "video" && !detectedYoutubeId) {
      setError("Cola uma URL ou ID válido do YouTube.");
      return;
    }
    if (data.kind === "rich" && !data.body_md.trim()) {
      setError("Conteúdo rich precisa ter corpo em Markdown.");
      return;
    }
    if (data.kind === "checklist" && data.checklist_items.length === 0) {
      setError("Adiciona pelo menos 1 item no checklist.");
      return;
    }
    // Criar aula ebook precisa de PDF. Em edicao, deixa salvar sem PDF
    // (auto-despublica logo abaixo) — assim admin pode trocar o tipo ou
    // limpar e voltar depois sem ficar travada.
    if (mode === "create" && data.kind === "ebook" && !data.file_url) {
      setError("Sobe o PDF do ebook antes de salvar.");
      return;
    }

    setSaving(true);

    // Edit + ebook sem PDF -> despublica pra aluna nao ver aula vazia.
    const ebookSemPdf = data.kind === "ebook" && !data.file_url;
    const effectivePublished = ebookSemPdf ? false : data.is_published;

    const payload: Record<string, unknown> = {
      slug: data.slug,
      title: data.title,
      description: data.description || null,
      category: data.category || null,
      kind: data.kind,
      cover_url: data.cover_url || null,
      duration_seconds: data.duration_seconds || null,
      order_index: data.order_index,
      is_published: effectivePublished,
      module_id: data.module_id,
    };

    if (data.kind === "video") {
      payload.youtube_id = detectedYoutubeId;
      payload.body_md = data.body_md || null;
      payload.checklist_items = null;
      payload.file_url = null;
      payload.file_name = null;
      payload.file_size_bytes = null;
    } else if (data.kind === "rich") {
      payload.youtube_id = null;
      payload.body_md = data.body_md;
      payload.checklist_items = null;
      payload.file_url = null;
      payload.file_name = null;
      payload.file_size_bytes = null;
    } else if (data.kind === "checklist") {
      payload.youtube_id = null;
      payload.body_md = data.body_md || null;
      payload.checklist_items = data.checklist_items.filter((it) => it.text.trim());
      payload.file_url = null;
      payload.file_name = null;
      payload.file_size_bytes = null;
    } else {
      // ebook (file_url null quando admin removeu o PDF — auto-despublica)
      payload.youtube_id = null;
      payload.body_md = data.body_md || null;
      payload.checklist_items = null;
      payload.file_url = data.file_url || null;
      payload.file_name = data.file_name || null;
      payload.file_size_bytes = data.file_size_bytes || null;
    }

    const url = mode === "create" ? "/api/educacao" : `/api/educacao/${originalId ?? data.slug}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      // Volta pro módulo se tiver, senão pra raiz
      if (data.module_id) {
        const mod = modules.find((m) => m.id === data.module_id);
        if (mod) {
          router.push(`/admin/educacao/m/${mod.slug}`);
          return;
        }
      }
      router.push("/admin/educacao");
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "save_failed");
    }
  };

  const Icon = mode === "create" ? GraduationCap : Pencil;
  const eyebrow = mode === "create" ? "✦ nova aula" : "✦ editar aula";
  const titleText =
    mode === "create" ? (
      <>
        publicar uma <span className="text-grad-brand">aula nova.</span>
      </>
    ) : (
      <>
        ajustar a <span className="text-grad-brand">aula.</span>
      </>
    );

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial -mx-4 lg:-mx-10 px-4 lg:px-10 pt-6 lg:pt-10 pb-10 rounded-spark-3xl">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-24 w-[420px] h-[420px]" />
        <HeroBlob color="lilac" variant={2} className="top-10 -right-20 w-[420px] h-[420px]" />
        <SparkleField count={10} seed={808} className="opacity-50" />

        <div className="relative max-w-[920px] mx-auto">
          <Link
            href={
              data.module_id && modules.find((m) => m.id === data.module_id)
                ? `/admin/educacao/m/${modules.find((m) => m.id === data.module_id)!.slug}`
                : "/admin/educacao"
            }
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
            {titleText}
          </h1>
        </div>
      </section>

      {/* Form */}
      <SectionReveal direction="up">
        <form
          onSubmit={submit}
          className="max-w-[920px] mx-auto mt-8 space-y-6"
        >
          {/* Kind switcher */}
          <div className="p-6 lg:p-7 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
            <div className="text-eyebrow text-spark-brand mb-4">✦ tipo de aula</div>
            <KindSwitcher value={data.kind} onChange={(k) => update("kind", k)} />
          </div>

          {/* Core fields */}
          <div className="p-6 lg:p-7 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest space-y-5">
            <div className="text-eyebrow text-spark-brand">✦ identificação</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Título" required>
                <SInput
                  value={data.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Como aparece pra aluna"
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

            <Field label="Descrição (linha curta abaixo do título)">
              <textarea
                value={data.description}
                onChange={(e) => update("description", e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] transition-all duration-200"
                placeholder="O que a aluna vai aprender..."
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Módulo">
                <select
                  value={data.module_id ?? ""}
                  onChange={(e) => update("module_id", e.target.value || null)}
                  className="w-full px-4 py-2.5 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] font-semibold transition-all duration-200"
                >
                  <option value="">— sem módulo (orphan) —</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {String(m.order_index).padStart(2, "0")} · {m.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ordem (dentro do módulo)">
                <SInput
                  type="number"
                  value={String(data.order_index)}
                  onChange={(e) => update("order_index", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Categoria (legado, opcional)">
                <SInput
                  value={data.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="ex: Começando"
                />
              </Field>
            </div>
          </div>

          {/* Kind-specific content */}
          <div className="p-6 lg:p-7 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest space-y-5">
            <div className="text-eyebrow text-spark-brand">
              ✦ conteúdo da aula{" "}
              {data.kind === "video" && "(vídeo)"}
              {data.kind === "rich" && "(rich · markdown)"}
              {data.kind === "checklist" && "(checklist)"}
              {data.kind === "ebook" && "(ebook · PDF)"}
            </div>

            {data.kind === "video" && (
              <>
                <Field label="URL do YouTube" required>
                  <div className="relative">
                    <PlayCircle
                      size={16}
                      strokeWidth={2.2}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-spark-ink-50 pointer-events-none z-10"
                    />
                    <SInput
                      value={data.youtube_url}
                      onChange={(e) => update("youtube_url", e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      required={data.kind === "video"}
                      className="pl-10"
                    />
                  </div>
                  {detectedYoutubeId ? (
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
                        ID detectado: <span className="font-mono">{detectedYoutubeId}</span>
                      </div>
                    </div>
                  ) : data.youtube_url ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-bad font-extrabold">
                      <AlertCircle size={12} strokeWidth={2.5} />
                      URL ou ID não reconhecido
                    </div>
                  ) : null}
                </Field>

                <Field label="Conteúdo complementar (Markdown, opcional)">
                  <MarkdownEditor
                    value={data.body_md}
                    onChange={(v) => update("body_md", v)}
                    placeholder="Notas, resumo ou complemento ao vídeo..."
                    rows={10}
                  />
                </Field>
              </>
            )}

            {data.kind === "rich" && (
              <Field label="Conteúdo Markdown" required>
                <MarkdownEditor
                  value={data.body_md}
                  onChange={(v) => update("body_md", v)}
                  placeholder={"## Título da seção\n\nParágrafo de abertura...\n\n### Subseção\n\n- Item de lista\n- Outro item\n\n> Pull quote\n\n```\nprompt ou código\n```"}
                  rows={20}
                />
              </Field>
            )}

            {data.kind === "checklist" && (
              <>
                <Field label="Texto introdutório (Markdown, opcional)">
                  <MarkdownEditor
                    value={data.body_md}
                    onChange={(v) => update("body_md", v)}
                    placeholder="Contexto antes dos itens..."
                    rows={6}
                  />
                </Field>
                <Field label="Itens do checklist" required>
                  <ChecklistBuilder
                    items={data.checklist_items}
                    onChange={(items) => update("checklist_items", items)}
                  />
                </Field>
              </>
            )}

            {data.kind === "ebook" && (
              <>
                <Field label="Arquivo PDF" required>
                  <EbookUploader
                    fileUrl={data.file_url}
                    fileName={data.file_name}
                    fileSize={data.file_size_bytes}
                    onChange={(url, name, size) => {
                      update("file_url", url);
                      update("file_name", name);
                      update("file_size_bytes", size);
                    }}
                  />
                </Field>
                <Field label="Texto complementar (Markdown, opcional)">
                  <MarkdownEditor
                    value={data.body_md}
                    onChange={(v) => update("body_md", v)}
                    placeholder="Resumo do ebook, o que tem dentro, pra quem é..."
                    rows={8}
                  />
                </Field>
              </>
            )}
          </div>

          {/* Cover + Published */}
          <div className="p-6 lg:p-7 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest space-y-5">
            <div className="text-eyebrow text-spark-brand">✦ visual + publicação</div>

            <Field label="Capa customizada (URL, opcional — usamos thumb do YT por default)">
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
          </div>

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
                  ? "Publicar aula"
                  : "Salvar mudanças"}
            </SButton>
            <Link
              href={
                data.module_id && modules.find((m) => m.id === data.module_id)
                  ? `/admin/educacao/m/${modules.find((m) => m.id === data.module_id)!.slug}`
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
