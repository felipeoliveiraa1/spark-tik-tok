"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Tag, Check, Pencil, X } from "lucide-react";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { useToast } from "@/components/molecules/dialog-provider";

type Props = {
  initialName: string;
  initialNiche: string;
};

export function ProfileEditor({ initialName, initialNiche }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(initialName);
  const [niche, setNiche] = React.useState(initialNiche);
  const [saving, setSaving] = React.useState(false);

  const cancel = () => {
    setName(initialName);
    setNiche(initialNiche);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, niche }),
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
      <div className="mt-6 bg-spark-surface rounded-[18px] border border-spark-hairline p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] uppercase tracking-[0.08em] font-bold text-spark-ink-50">
              Seus dados
            </div>
            <div className="mt-2 space-y-2.5">
              <Row label="Nome" value={name || "—"} icon={<User size={14} strokeWidth={1.7} />} />
              <Row label="Nicho" value={niche || "—"} icon={<Tag size={14} strokeWidth={1.7} />} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar perfil"
            className="w-9 h-9 rounded-full bg-spark-surface-sunken text-spark-ink-70 hover:text-spark-ink active:scale-95 transition-transform flex items-center justify-center shrink-0"
          >
            <Pencil size={14} strokeWidth={1.7} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-spark-surface rounded-[18px] border border-spark-brand/30 p-4">
      <div className="text-[10.5px] uppercase tracking-[0.08em] font-bold text-spark-brand-deep mb-3">
        Editando perfil ✏️
      </div>
      <div className="space-y-2.5">
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
        <div>
          <div className="text-[11px] font-semibold text-spark-ink-70 mb-1">Nicho</div>
          <SInput
            name="niche"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Ex: skincare, suplementos, moda"
            Icon={Tag}
            maxLength={80}
          />
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
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-spark-surface-sunken text-spark-ink-70 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] uppercase tracking-[0.08em] font-bold text-spark-ink-50">
          {label}
        </div>
        <div className="text-[14px] font-semibold text-spark-ink truncate">{value}</div>
      </div>
    </div>
  );
}
