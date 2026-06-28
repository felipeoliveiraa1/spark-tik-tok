"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  ArrowLeft,
  Trash2,
  Save,
  Pencil,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useToast, useConfirm } from "@/components/molecules/dialog-provider";

type Journey = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  character_stage: "bebe" | "adolescente" | "adulta";
  character_name: string | null;
  is_published: boolean;
  is_admin_only: boolean;
};

type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: "video" | "rich" | "checklist" | "ebook";
  youtube_id: string | null;
  body_md: string | null;
  order_index: number;
  xp_reward: number;
  requires_proof: boolean;
  map_x: number | null;
  map_y: number | null;
  is_published: boolean;
  module_id: string | null;
};

type Module = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  week_number: number | null;
  order_index: number;
  is_published: boolean;
};

export default function AdminJornadaEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [journey, setJourney] = React.useState<Journey | null>(null);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingJourney, setSavingJourney] = React.useState(false);
  const [creatingLesson, setCreatingLesson] = React.useState<{
    moduleId: string | null;
  } | null>(null);
  const [editingLesson, setEditingLesson] = React.useState<Lesson | null>(null);
  const [collapsedModules, setCollapsedModules] = React.useState<Set<string>>(
    new Set(),
  );

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/jornadas/${params.id}`, { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as {
          journey: Journey;
          lessons: Lesson[];
          modules: Module[];
        };
        setJourney(j.journey);
        setLessons(j.lessons);
        setModules(j.modules ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveJourney = async () => {
    if (!journey) return;
    setSavingJourney(true);
    try {
      const res = await fetch(`/api/admin/jornadas/${journey.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: journey.title,
          subtitle: journey.subtitle,
          description: journey.description,
          character_name: journey.character_name,
        }),
      });
      if (res.ok) toast.success("Salva");
      else toast.error("Erro ao salvar");
    } finally {
      setSavingJourney(false);
    }
  };

  const deleteLesson = async (l: Lesson) => {
    const ok = await confirm({
      title: `Apagar "${l.title}"?`,
      description: "Apaga a aula e todo o progresso associado dela.",
      confirmLabel: "Apagar",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/jornadas/${params.id}/lessons/${l.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Apagada");
      void refresh();
    }
  };

  const deleteJourney = async () => {
    const ok = await confirm({
      title: "Apagar jornada inteira?",
      description: "Apaga jornada, aulas, comentários, provas e progresso. Irreversível.",
      confirmLabel: "Apagar tudo",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/jornadas/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Apagada");
      router.push("/admin/jornadas");
    }
  };

  const toggleModule = (moduleId: string) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (loading || !journey) {
    return (
      <div className="flex items-center justify-center py-20 text-spark-ink-50">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  // Agrupa lessons por modulo (orphan = sem module_id ou modulo deletado)
  const lessonsByModule = new Map<string, Lesson[]>();
  const moduleIds = new Set(modules.map((m) => m.id));
  const orphanLessons: Lesson[] = [];
  for (const l of lessons) {
    if (l.module_id && moduleIds.has(l.module_id)) {
      const arr = lessonsByModule.get(l.module_id) ?? [];
      arr.push(l);
      lessonsByModule.set(l.module_id, arr);
    } else {
      orphanLessons.push(l);
    }
  }

  return (
    <div className="max-w-[920px] mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/admin/jornadas"
          className="text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} /> Jornadas
        </Link>
        <button
          onClick={deleteJourney}
          className="text-[12.5px] font-extrabold text-bad hover:bg-bad/5 px-3 py-1.5 rounded-spark-lg inline-flex items-center gap-1.5"
        >
          <Trash2 size={13} /> Apagar jornada
        </button>
      </div>

      <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface p-5 space-y-3">
        <h2 className="font-display text-[24px] text-spark-ink">Detalhes</h2>
        <Field label="Title">
          <input
            value={journey.title}
            onChange={(e) => setJourney({ ...journey, title: e.target.value })}
            className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] focus:outline-none focus:border-spark-brand/40"
          />
        </Field>
        <Field label="Subtitle">
          <input
            value={journey.subtitle ?? ""}
            onChange={(e) => setJourney({ ...journey, subtitle: e.target.value })}
            className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] focus:outline-none focus:border-spark-brand/40"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={journey.description ?? ""}
            onChange={(e) => setJourney({ ...journey, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] focus:outline-none focus:border-spark-brand/40"
          />
        </Field>
        <Field label="Character name (Lila/Maya/Sofia)">
          <input
            value={journey.character_name ?? ""}
            onChange={(e) => setJourney({ ...journey, character_name: e.target.value })}
            className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] focus:outline-none focus:border-spark-brand/40"
          />
        </Field>
        <button
          onClick={saveJourney}
          disabled={savingJourney}
          className="px-4 py-2 rounded-spark-lg bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all disabled:opacity-50 inline-flex items-center gap-2"
        >
          {savingJourney ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Salvar
        </button>
      </div>

      <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-display text-[24px] text-spark-ink">
              Módulos & Aulas
            </h2>
            <div className="text-[11.5px] text-spark-ink-50 mt-0.5">
              {modules.length} módulos · {lessons.length} aulas
              {orphanLessons.length > 0 && (
                <span className="text-orange-700 ml-2">
                  ({orphanLessons.length} sem módulo)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setCreatingLesson({ moduleId: null })}
            className="px-3 py-1.5 rounded-spark-lg bg-brand-grad text-white text-[12px] font-extrabold inline-flex items-center gap-1.5 shadow-lift-brand"
          >
            <Plus size={12} /> Nova aula
          </button>
        </div>

        {modules.length === 0 && orphanLessons.length === 0 && (
          <div className="py-8 text-center text-spark-ink-50 text-[13px]">
            Nenhum módulo nem aula. Crie módulos via SQL ou adicione aulas
            soltas com o botão acima.
          </div>
        )}

        {modules.map((m) => {
          const mlessons = lessonsByModule.get(m.id) ?? [];
          const collapsed = collapsedModules.has(m.id);
          return (
            <div
              key={m.id}
              className="border border-spark-hairline rounded-spark-lg overflow-hidden"
            >
              <button
                onClick={() => toggleModule(m.id)}
                className="w-full px-4 py-3 bg-spark-surface-sunken hover:bg-spark-ink/5 transition-colors flex items-center gap-3 text-left"
              >
                <Layers size={14} className="text-spark-brand-deep shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-spark-ink text-[13.5px] inline-flex items-center gap-2">
                    {m.title}
                    {m.week_number !== null && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-spark-ink-50 bg-spark-ink/5 px-1.5 py-0.5 rounded">
                        SEM {m.week_number}
                      </span>
                    )}
                    {!m.is_published && (
                      <span className="text-[10px] text-spark-ink-35">
                        rascunho
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-spark-ink-50 font-mono">
                    {m.slug} · {mlessons.length} aulas · order #{m.order_index}
                  </div>
                </div>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingLesson({ moduleId: m.id });
                  }}
                  className="px-2.5 py-1 rounded-full bg-white border border-spark-hairline text-[11px] font-extrabold text-spark-ink-70 inline-flex items-center gap-1 cursor-pointer hover:border-spark-brand/40"
                >
                  <Plus size={11} /> Aula
                </span>
                {collapsed ? (
                  <ChevronRight size={14} className="text-spark-ink-50" />
                ) : (
                  <ChevronDown size={14} className="text-spark-ink-50" />
                )}
              </button>
              {!collapsed && (
                <div className="p-2 space-y-1.5 bg-white">
                  {mlessons.length === 0 ? (
                    <div className="py-4 text-center text-spark-ink-50 text-[12.5px]">
                      Sem aulas nesse módulo.
                    </div>
                  ) : (
                    mlessons.map((l) => (
                      <LessonRow
                        key={l.id}
                        lesson={l}
                        onEdit={() => setEditingLesson(l)}
                        onDelete={() => deleteLesson(l)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {orphanLessons.length > 0 && (
          <div className="border-2 border-dashed border-orange-300 rounded-spark-lg overflow-hidden">
            <div className="px-4 py-3 bg-orange-50/50 flex items-center gap-3">
              <Layers size={14} className="text-orange-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-orange-900 text-[13.5px]">
                  Sem módulo ({orphanLessons.length})
                </div>
                <div className="text-[11px] text-orange-700">
                  Edite cada aula pra vincular a um módulo.
                </div>
              </div>
            </div>
            <div className="p-2 space-y-1.5 bg-white">
              {orphanLessons.map((l) => (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  onEdit={() => setEditingLesson(l)}
                  onDelete={() => deleteLesson(l)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {(creatingLesson || editingLesson) && (
        <LessonFormModal
          journeyId={params.id as string}
          modules={modules}
          mode={editingLesson ? "edit" : "create"}
          initialLesson={editingLesson ?? undefined}
          initialModuleId={creatingLesson?.moduleId ?? null}
          onClose={() => {
            setCreatingLesson(null);
            setEditingLesson(null);
          }}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-spark-hairline rounded-spark-lg px-3 py-2 flex items-center gap-3 hover:bg-spark-ink/[0.02]">
      <span className="text-[11px] font-mono text-spark-ink-35 w-8 text-center shrink-0">
        #{lesson.order_index}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-spark-ink text-[13.5px] truncate">
          {lesson.title}
        </div>
        <div className="text-[11px] text-spark-ink-50 flex gap-3 flex-wrap">
          <span>kind: {lesson.kind}</span>
          <span>XP: {lesson.xp_reward}</span>
          {lesson.requires_proof && <span className="text-orange-700">requires_proof</span>}
          {!lesson.is_published && <span className="text-spark-ink-35">rascunho</span>}
          {lesson.kind === "video" && !lesson.youtube_id && (
            <span className="text-amber-700">⚠ sem youtube_id</span>
          )}
        </div>
      </div>
      <button
        onClick={onEdit}
        className="w-8 h-8 rounded-full hover:bg-spark-brand/10 flex items-center justify-center text-spark-brand-deep shrink-0"
        aria-label="Editar aula"
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={onDelete}
        className="w-8 h-8 rounded-full hover:bg-bad/10 flex items-center justify-center text-bad shrink-0"
        aria-label="Apagar aula"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function LessonFormModal({
  journeyId,
  modules,
  mode,
  initialLesson,
  initialModuleId,
  onClose,
  onSaved,
}: {
  journeyId: string;
  modules: Module[];
  mode: "create" | "edit";
  initialLesson?: Lesson;
  initialModuleId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [slug, setSlug] = React.useState(initialLesson?.slug ?? "");
  const [title, setTitle] = React.useState(initialLesson?.title ?? "");
  const [description, setDescription] = React.useState(initialLesson?.description ?? "");
  const [kind, setKind] = React.useState<Lesson["kind"]>(initialLesson?.kind ?? "video");
  const [youtubeId, setYoutubeId] = React.useState(initialLesson?.youtube_id ?? "");
  const [bodyMd, setBodyMd] = React.useState(initialLesson?.body_md ?? "");
  const [xpReward, setXpReward] = React.useState(initialLesson?.xp_reward ?? 10);
  const [requiresProof, setRequiresProof] = React.useState(
    initialLesson?.requires_proof ?? false,
  );
  const [orderIndex, setOrderIndex] = React.useState(initialLesson?.order_index ?? 100);
  const [moduleId, setModuleId] = React.useState<string | null>(
    initialLesson?.module_id ?? initialModuleId ?? null,
  );
  const [isPublished, setIsPublished] = React.useState(
    initialLesson?.is_published ?? true,
  );
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (!slug || !title) {
      toast.error("Preenche slug e title");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug,
        title,
        description: description || null,
        kind,
        youtube_id: kind === "video" ? youtubeId : null,
        body_md: bodyMd || null,
        xp_reward: xpReward,
        requires_proof: requiresProof,
        order_index: orderIndex,
        module_id: moduleId,
        is_published: isPublished,
      };
      const url =
        mode === "create"
          ? `/api/admin/jornadas/${journeyId}/lessons`
          : `/api/admin/jornadas/${journeyId}/lessons/${initialLesson?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(mode === "create" ? "Aula criada" : "Aula atualizada");
        onSaved();
        onClose();
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Erro");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-spark-ink/40 backdrop-blur-sm flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="bg-spark-surface rounded-spark-xl border border-spark-hairline shadow-lift max-w-[560px] w-full my-auto">
        <div className="px-5 py-4 border-b border-spark-hairline">
          <div className="text-eyebrow text-spark-ink-50">
            {mode === "create" ? "Nova" : "Editar"}
          </div>
          <div className="font-extrabold text-spark-ink mt-0.5">
            {mode === "create" ? "Adicionar aula" : `Editar ${initialLesson?.title ?? "aula"}`}
          </div>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <Field label="Módulo">
            <select
              value={moduleId ?? ""}
              onChange={(e) => setModuleId(e.target.value || null)}
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px]"
            >
              <option value="">— Sem módulo —</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                  {m.week_number !== null ? ` (Semana ${m.week_number})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
            <Field label="Slug">
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                }
                placeholder="ex: aula-01-config-conta"
                className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] font-mono"
                disabled={mode === "edit"}
              />
            </Field>
            <Field label="Order">
              <input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px]"
              />
            </Field>
          </div>
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px]"
            />
          </Field>
          <Field label="Description (opcional)">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px]"
            />
          </Field>
          <Field label="Kind">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px]"
            >
              <option value="video">Vídeo (YouTube)</option>
              <option value="rich">Texto (Markdown)</option>
              <option value="checklist">Checklist</option>
              <option value="ebook">eBook (PDF)</option>
            </select>
          </Field>
          {kind === "video" && (
            <Field label="YouTube ID">
              <input
                value={youtubeId}
                onChange={(e) => setYoutubeId(e.target.value)}
                placeholder="ex: dQw4w9WgXcQ"
                className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] font-mono"
              />
            </Field>
          )}
          {(kind === "rich" || kind === "video") && (
            <Field label="Body markdown (opcional)">
              <textarea
                value={bodyMd}
                onChange={(e) => setBodyMd(e.target.value)}
                rows={6}
                placeholder="## Bem vinda..."
                className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[12.5px] font-mono"
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="XP reward">
              <input
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px]"
              />
            </Field>
            <Field label="Publicada">
              <select
                value={isPublished ? "1" : "0"}
                onChange={(e) => setIsPublished(e.target.value === "1")}
                className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px]"
              >
                <option value="1">Sim</option>
                <option value="0">Rascunho</option>
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-spark-ink-70 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresProof}
              onChange={(e) => setRequiresProof(e.target.checked)}
            />
            Esta aula exige prova do TikTok pra concluir
          </label>
        </div>
        <div className="px-5 py-4 border-t border-spark-hairline flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-spark-lg text-[13px] font-extrabold text-spark-ink-70 hover:bg-spark-surface-sunken"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-spark-lg bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {mode === "create" ? "Criar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-extrabold uppercase tracking-wide text-spark-ink-50 block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
