"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, Loader2, ArrowLeft, Trash2, Save } from "lucide-react";
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
};

export default function AdminJornadaEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [journey, setJourney] = React.useState<Journey | null>(null);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingJourney, setSavingJourney] = React.useState(false);
  const [creatingLesson, setCreatingLesson] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/jornadas/${params.id}`, { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as { journey: Journey; lessons: Lesson[] };
        setJourney(j.journey);
        setLessons(j.lessons);
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

  if (loading || !journey) {
    return (
      <div className="py-16 flex items-center justify-center text-spark-ink-50">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[900px]">
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

      <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[24px] text-spark-ink">Aulas ({lessons.length})</h2>
          <button
            onClick={() => setCreatingLesson(true)}
            className="px-3 py-1.5 rounded-spark-lg bg-brand-grad text-white text-[12px] font-extrabold inline-flex items-center gap-1.5 shadow-lift-brand"
          >
            <Plus size={12} /> Nova aula
          </button>
        </div>
        {lessons.length === 0 ? (
          <div className="py-8 text-center text-spark-ink-50 text-[13px]">
            Nenhuma aula. Adicione a primeira.
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((l) => (
              <div
                key={l.id}
                className="border border-spark-hairline rounded-spark-lg px-3 py-2 flex items-center gap-3"
              >
                <span className="text-[11px] font-mono text-spark-ink-35 w-8 text-center">
                  #{l.order_index}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-spark-ink text-[13.5px]">{l.title}</div>
                  <div className="text-[11px] text-spark-ink-50 flex gap-3">
                    <span>kind: {l.kind}</span>
                    <span>XP: {l.xp_reward}</span>
                    {l.requires_proof && <span className="text-orange-700">requires_proof</span>}
                    {!l.is_published && <span className="text-spark-ink-35">rascunho</span>}
                  </div>
                </div>
                <button
                  onClick={() => deleteLesson(l)}
                  className="w-8 h-8 rounded-full hover:bg-bad/10 flex items-center justify-center text-bad"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {creatingLesson && (
        <CreateLessonModal
          journeyId={params.id as string}
          onClose={() => setCreatingLesson(false)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

function CreateLessonModal({
  journeyId,
  onClose,
  onSaved,
}: {
  journeyId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [slug, setSlug] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [kind, setKind] = React.useState<"video" | "rich" | "checklist" | "ebook">("video");
  const [youtubeId, setYoutubeId] = React.useState("");
  const [bodyMd, setBodyMd] = React.useState("");
  const [xpReward, setXpReward] = React.useState(10);
  const [requiresProof, setRequiresProof] = React.useState(false);
  const [orderIndex, setOrderIndex] = React.useState(100);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (!slug || !title) {
      toast.error("Preenche slug e title");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/jornadas/${journeyId}/lessons`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          kind,
          youtube_id: kind === "video" ? youtubeId : null,
          body_md: bodyMd || null,
          xp_reward: xpReward,
          requires_proof: requiresProof,
          order_index: orderIndex,
        }),
      });
      if (res.ok) {
        toast.success("Aula criada");
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
      <div className="bg-spark-surface rounded-spark-xl border border-spark-hairline shadow-lift max-w-[520px] w-full my-auto">
        <div className="px-5 py-4 border-b border-spark-hairline">
          <div className="text-eyebrow text-spark-ink-50">Nova</div>
          <div className="font-extrabold text-spark-ink mt-0.5">Adicionar aula</div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <Field label="Slug">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="ex: aula-01-config-conta"
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] font-mono"
            />
          </Field>
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                rows={5}
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
            <Field label="Order index">
              <input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px]"
              />
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
          <button onClick={onClose} className="px-4 py-2 rounded-spark-lg text-[13px] font-extrabold text-spark-ink-70 hover:bg-spark-surface-sunken">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-spark-lg bg-brand-grad text-white text-[13px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Criar
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
