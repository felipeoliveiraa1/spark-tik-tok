"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Tag, Check, Pencil, X, Plus } from "lucide-react";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { useToast } from "@/components/molecules/dialog-provider";

// Mesma lista do /welcome — mantém consistente.
const PRESET_NICHES = [
  "Skincare",
  "Makeup",
  "Suplementos",
  "Cabelo",
  "Perfumaria",
  "Casa e decoração",
  "Moda feminina",
  "Maternidade",
  "Eletrônicos",
  "Acessórios",
  "Pet",
  "Calçados",
];

type Props = {
  initialName: string;
  initialNiche: string;
};

function parseNiches(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ProfileEditor({ initialName, initialNiche }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(initialName);
  const [niches, setNiches] = React.useState<string[]>(parseNiches(initialNiche));
  const [customOpen, setCustomOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const cancel = () => {
    setName(initialName);
    setNiches(parseNiches(initialNiche));
    setCustomOpen(false);
    setCustomValue("");
    setEditing(false);
  };

  const toggle = (n: string) => {
    setNiches((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const addCustom = () => {
    const v = customValue.trim();
    if (!v) return;
    if (niches.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setCustomValue("");
      setCustomOpen(false);
      return;
    }
    setNiches((prev) => [...prev, v]);
    setCustomValue("");
    setCustomOpen(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, niche: niches.join(", ") }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? "Falhou ao salvar");
        return;
      }
      toast.success("Perfil atualizado 💕");
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="bg-spark-surface rounded-spark-2xl border border-spark-hairline p-5 shadow-rest">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-eyebrow text-spark-brand mb-3">✦ seus dados</div>
            <div className="space-y-3">
              <Row label="Nome" value={name || "—"} icon={<User size={14} strokeWidth={2.2} />} />
              <Row
                label={niches.length > 1 ? "Nichos" : "Nicho"}
                value={niches.length > 0 ? niches.join(" · ") : "—"}
                icon={<Tag size={14} strokeWidth={2.2} />}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar perfil"
            className="w-10 h-10 rounded-full bg-spark-surface-sunken text-spark-ink-70 hover:text-spark-brand-deep hover:bg-spark-brand-soft active:scale-95 transition-all duration-300 ease-premium flex items-center justify-center shrink-0"
          >
            <Pencil size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-spark-surface rounded-spark-2xl border border-spark-brand/30 p-5 shadow-lift-brand">
      <div className="text-eyebrow text-spark-brand mb-4">✦ editando perfil</div>

      {/* Nome */}
      <div>
        <div className="text-[11px] font-semibold text-spark-ink-70 mb-1">Nome</div>
        <SInput
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como você quer ser chamada"
          Icon={User}
          maxLength={80}
        />
      </div>

      {/* Nichos (multi-select) */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="text-[11px] font-semibold text-spark-ink-70">
            Nichos que você atua
          </div>
          {niches.length > 0 && (
            <div className="text-[10.5px] text-spark-ink-50 font-mono">
              {niches.length} selecionado{niches.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_NICHES.map((n) => {
            const active = niches.includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggle(n)}
                className={`px-3 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors inline-flex items-center gap-1.5 ${
                  active
                    ? "bg-brand-grad text-white border-transparent shadow-[0_4px_14px_-6px_oklch(0.55_0.24_340/0.5)]"
                    : "bg-spark-surface border-spark-hairline text-spark-ink-70 hover:border-spark-ink/30"
                }`}
              >
                {active && <Check size={11} strokeWidth={2.5} />}
                {n}
              </button>
            );
          })}

          {/* Chips custom (não-preset) */}
          {niches
            .filter((s) => !PRESET_NICHES.includes(s))
            .map((custom) => (
              <button
                key={custom}
                type="button"
                onClick={() => toggle(custom)}
                className="px-3 py-1.5 rounded-full border bg-brand-grad text-white border-transparent text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-[0_4px_14px_-6px_oklch(0.55_0.24_340/0.5)]"
              >
                <Check size={11} strokeWidth={2.5} />
                {custom}
                <X size={11} strokeWidth={2.5} className="opacity-80" />
              </button>
            ))}

          {/* Outro */}
          {customOpen ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-spark-surface border border-spark-brand/40">
              <input
                autoFocus
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setCustomOpen(false);
                    setCustomValue("");
                  }
                }}
                placeholder="Digita o nicho"
                maxLength={40}
                className="bg-transparent outline-none text-[12.5px] font-semibold w-[120px] px-1 placeholder:text-spark-ink-35"
              />
              <button
                type="button"
                onClick={addCustom}
                aria-label="Adicionar nicho"
                className="w-6 h-6 rounded-full bg-brand-grad text-white flex items-center justify-center active:scale-95 transition-transform"
              >
                <Check size={11} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomOpen(false);
                  setCustomValue("");
                }}
                aria-label="Cancelar"
                className="w-6 h-6 rounded-full text-spark-ink-50 flex items-center justify-center"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              className="px-3 py-1.5 rounded-full border-2 border-dashed border-spark-brand/40 text-spark-brand-deep text-[12.5px] font-semibold hover:bg-spark-brand-soft transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={12} strokeWidth={2} />
              Outro
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <SButton
          type="button"
          variant="primary"
          size="md"
          Icon={Check}
          onClick={save}
          disabled={saving}
        >
          {saving ? "Salvando…" : "Salvar"}
        </SButton>
        <SButton type="button" variant="ghost" size="md" Icon={X} onClick={cancel} disabled={saving}>
          Cancelar
        </SButton>
      </div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-spark-xl bg-spark-surface-sunken text-spark-ink-70 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-spark-ink-50">
          {label}
        </div>
        <div className="text-[13.5px] font-extrabold text-spark-ink truncate">{value}</div>
      </div>
    </div>
  );
}
