"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Loader2, ExternalLink, Lock, Unlock, Eye, EyeOff, Camera } from "lucide-react";
import { useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type Journey = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  character_stage: "bebe" | "adolescente" | "adulta";
  is_published: boolean;
  is_admin_only: boolean;
  order_index: number;
  lesson_count: number;
  students_started: number;
  students_completed: number;
};

const STAGE_EMOJI = { bebe: "👶", adolescente: "👧", adulta: "🙋‍♀️" } as const;

export default function AdminJornadasPage() {
  const [journeys, setJourneys] = React.useState<Journey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const toast = useToast();

  const refresh = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/jornadas", { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as { journeys: Journey[] };
        setJourneys(j.journeys);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const togglePublished = async (j: Journey) => {
    const res = await fetch(`/api/admin/jornadas/${j.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_published: !j.is_published }),
    });
    if (res.ok) {
      toast.success(j.is_published ? "Despublicada" : "Publicada");
      void refresh();
    }
  };

  const toggleAdminOnly = async (j: Journey) => {
    const res = await fetch(`/api/admin/jornadas/${j.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_admin_only: !j.is_admin_only }),
    });
    if (res.ok) {
      toast.success(
        j.is_admin_only ? "Liberada pra alunas 🎉" : "Voltou pra beta interno",
      );
      void refresh();
    }
  };

  return (
    <div className="space-y-6 max-w-[1100px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-eyebrow text-spark-brand-deep">Admin</div>
          <h1 className="font-display text-[34px] leading-none text-spark-ink mt-1">
            Jornadas
          </h1>
          <p className="text-spark-ink-70 mt-2 max-w-[60ch]">
            Sistema gamificado de 3 jornadas. Personagem evolui:{" "}
            {STAGE_EMOJI.bebe} bebê → {STAGE_EMOJI.adolescente} adolescente →{" "}
            {STAGE_EMOJI.adulta} adulta. Em beta admin-only — toggle{" "}
            <Unlock size={12} className="inline" /> libera pra alunas.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/jornadas/provas"
            className="px-4 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface text-[12.5px] font-extrabold inline-flex items-center gap-2 hover:bg-spark-surface-sunken"
          >
            <Camera size={13} /> Fila de provas
          </Link>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 rounded-spark-lg bg-brand-grad text-white text-[12.5px] font-extrabold inline-flex items-center gap-2 shadow-lift-brand hover:-translate-y-0.5 transition-all"
          >
            <Plus size={13} /> Nova jornada
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center text-spark-ink-50">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {journeys.map((j) => (
            <div
              key={j.id}
              className="rounded-spark-xl border border-spark-hairline bg-spark-surface p-5 flex flex-wrap items-center gap-4"
            >
              <span className="text-4xl" style={{ lineHeight: 1 }}>
                {STAGE_EMOJI[j.character_stage]}
              </span>
              <div className="flex-1 min-w-[240px]">
                <Link
                  href={`/admin/jornadas/${j.id}`}
                  className="font-extrabold text-spark-ink hover:text-spark-brand-deep transition-colors inline-flex items-center gap-1.5"
                >
                  {j.title}
                  <ExternalLink size={12} />
                </Link>
                {j.subtitle && (
                  <div className="text-[12.5px] text-spark-ink-50 mt-0.5">{j.subtitle}</div>
                )}
                <div className="text-[11.5px] text-spark-ink-35 mt-1.5 font-mono">
                  /{j.slug}
                </div>
              </div>

              <div className="flex gap-3 text-[12px] text-spark-ink-70">
                <div>
                  <div className="text-spark-ink-35 text-[10px] uppercase tracking-wide">Aulas</div>
                  <div className="font-extrabold text-spark-ink">{j.lesson_count}</div>
                </div>
                <div>
                  <div className="text-spark-ink-35 text-[10px] uppercase tracking-wide">Alunas</div>
                  <div className="font-extrabold text-spark-ink">{j.students_started}</div>
                </div>
                <div>
                  <div className="text-spark-ink-35 text-[10px] uppercase tracking-wide">Conclu.</div>
                  <div className="font-extrabold text-spark-ink">{j.students_completed}</div>
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => togglePublished(j)}
                  title={j.is_published ? "Despublicar" : "Publicar"}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full text-[11px] font-extrabold border inline-flex items-center gap-1",
                    j.is_published
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-spark-ink-10 border-transparent text-spark-ink-70",
                  )}
                >
                  {j.is_published ? <Eye size={11} /> : <EyeOff size={11} />}
                  {j.is_published ? "publicada" : "rascunho"}
                </button>
                <button
                  onClick={() => toggleAdminOnly(j)}
                  title={j.is_admin_only ? "Liberar pra alunas" : "Voltar pra beta"}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full text-[11px] font-extrabold border inline-flex items-center gap-1",
                    j.is_admin_only
                      ? "bg-orange-50 border-orange-200 text-orange-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700",
                  )}
                >
                  {j.is_admin_only ? <Lock size={11} /> : <Unlock size={11} />}
                  {j.is_admin_only ? "admin-only" : "público"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateJourneyModal onClose={() => setCreating(false)} onSaved={refresh} />
      )}
    </div>
  );
}

function CreateJourneyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [slug, setSlug] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [stage, setStage] = React.useState<"bebe" | "adolescente" | "adulta">("bebe");
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (!slug || !title) {
      toast.error("Preenche slug e title");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/jornadas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, title, character_stage: stage }),
      });
      if (res.ok) {
        toast.success("Criada");
        onSaved();
        onClose();
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Erro ao criar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-spark-ink/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-spark-surface rounded-spark-xl border border-spark-hairline shadow-lift max-w-[440px] w-full">
        <div className="px-5 py-4 border-b border-spark-hairline">
          <div className="text-eyebrow text-spark-ink-50">Nova</div>
          <div className="font-extrabold text-spark-ink mt-0.5">Criar jornada</div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <Field label="Slug (URL)">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ex: jornada-4-mestre"
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] font-mono focus:outline-none focus:border-spark-brand/40"
            />
          </Field>
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Jornada 4 — Mestra das vendas"
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] focus:outline-none focus:border-spark-brand/40"
            />
          </Field>
          <Field label="Stage do personagem">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as typeof stage)}
              className="w-full px-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface-sunken text-[13px] focus:outline-none focus:border-spark-brand/40"
            >
              <option value="bebe">👶 bebê</option>
              <option value="adolescente">👧 adolescente</option>
              <option value="adulta">🙋‍♀️ adulta</option>
            </select>
          </Field>
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
