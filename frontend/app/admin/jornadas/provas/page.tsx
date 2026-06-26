"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Loader2, AlertCircle, Inbox } from "lucide-react";
import { useToast, useConfirm } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type Proof = {
  id: string;
  status: "pending" | "auto_approved" | "approved" | "rejected";
  ocr_confidence: number | null;
  ocr_detected_sales: number | null;
  ocr_text: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  image_signed_url: string | null;
  file_name: string | null;
  student: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
  };
  journey: { slug: string; title: string };
};

type Filter = "pending" | "approved" | "rejected" | "all";

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminProvasPage() {
  const [proofs, setProofs] = React.useState<Proof[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>("pending");
  const [actingId, setActingId] = React.useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/jornadas/proofs?status=${filter}`, {
        cache: "no-store",
      });
      if (r.ok) {
        const j = (await r.json()) as { proofs: Proof[] };
        setProofs(j.proofs);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleApprove = async (proof: Proof) => {
    setActingId(proof.id);
    try {
      const res = await fetch(`/api/admin/jornadas/proofs/${proof.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        toast.success(`Aprovada — ${proof.student.name ?? proof.student.email}`);
        void refresh();
      } else {
        toast.error("Erro ao aprovar");
      }
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (proof: Proof) => {
    const reason = window.prompt(
      "Motivo da rejeição (opcional, vai pra mensagem na aluna):",
    );
    if (reason === null) return; // cancelou prompt
    const ok = await confirm({
      title: `Rejeitar prova de ${proof.student.name ?? proof.student.email}?`,
      description: "Aluna recebe notificação e pode tentar de novo com outro print.",
      confirmLabel: "Rejeitar",
      destructive: true,
    });
    if (!ok) return;
    setActingId(proof.id);
    try {
      const res = await fetch(`/api/admin/jornadas/proofs/${proof.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "reject", rejection_reason: reason }),
      });
      if (res.ok) {
        toast.success("Rejeitada");
        void refresh();
      }
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1100px]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link
            href="/admin/jornadas"
            className="text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={13} /> Jornadas
          </Link>
          <h1 className="font-display text-[34px] leading-none text-spark-ink mt-2">
            Provas — fila de revisão
          </h1>
          <p className="text-spark-ink-70 mt-2 max-w-[60ch]">
            Prints do TikTok Shop enviados pelas alunas. OCR (gpt-4o-mini)
            classifica automaticamente: <strong>auto_approved</strong> (conf≥90 + sales) já
            valeu, mas você revisa pra garantir. Pendentes precisam de aprovação manual.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[12px] font-extrabold border transition-all",
              filter === f
                ? "bg-brand-grad text-white border-transparent shadow-lift-brand"
                : "bg-spark-surface border-spark-hairline text-spark-ink-70 hover:border-spark-brand/40",
            )}
          >
            {f === "pending" ? "Pendentes + auto" : f === "all" ? "Todas" : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center text-spark-ink-50">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : proofs.length === 0 ? (
        <div className="py-16 text-center text-spark-ink-50 text-[13px] rounded-spark-xl border border-spark-hairline bg-spark-surface">
          <Inbox size={20} className="mx-auto mb-2 opacity-60" />
          Nenhuma prova nesse filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proofs.map((p) => (
            <ProofCard
              key={p.id}
              proof={p}
              acting={actingId === p.id}
              onApprove={() => handleApprove(p)}
              onReject={() => handleReject(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProofCard({
  proof,
  acting,
  onApprove,
  onReject,
}: {
  proof: Proof;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const conf = proof.ocr_confidence ?? 0;
  const confColor =
    conf >= 90 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : conf >= 50 ? "text-yellow-700 bg-yellow-50 border-yellow-200"
    : "text-red-700 bg-red-50 border-red-200";

  const canAct = proof.status === "pending" || proof.status === "auto_approved";

  return (
    <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface overflow-hidden">
      {/* Imagem */}
      {proof.image_signed_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proof.image_signed_url}
          alt={`Prova de ${proof.student.name ?? proof.student.email}`}
          className="w-full max-h-[320px] object-contain bg-spark-ink/5"
        />
      ) : (
        <div className="aspect-video bg-spark-ink/5 flex items-center justify-center text-spark-ink-50 text-[12px]">
          (imagem expirou — recarregue)
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-spark-brand-soft flex items-center justify-center overflow-hidden">
            {proof.student.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proof.student.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-spark-brand-deep font-extrabold text-[13px]">
                {(proof.student.name ?? proof.student.email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-spark-ink text-[13px] truncate">
              {proof.student.name ?? "—"}
            </div>
            <div className="text-[11px] text-spark-ink-50 truncate">{proof.student.email}</div>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border",
              proof.status === "approved" || proof.status === "auto_approved"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : proof.status === "rejected"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-yellow-50 text-yellow-700 border-yellow-200",
            )}
          >
            {proof.status}
          </span>
        </div>

        {/* OCR info */}
        <div className="grid grid-cols-2 gap-2 text-[11.5px]">
          <div>
            <div className="text-spark-ink-50 text-[10px] uppercase tracking-wide">Jornada</div>
            <div className="font-extrabold text-spark-ink">{proof.journey.title}</div>
          </div>
          <div>
            <div className="text-spark-ink-50 text-[10px] uppercase tracking-wide">Recebida</div>
            <div className="font-extrabold text-spark-ink">{fmtDateTime(proof.created_at)}</div>
          </div>
          <div>
            <div className="text-spark-ink-50 text-[10px] uppercase tracking-wide">OCR confidence</div>
            <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10.5px] font-extrabold border", confColor)}>
              {conf.toFixed(0)}%
            </span>
          </div>
          <div>
            <div className="text-spark-ink-50 text-[10px] uppercase tracking-wide">Vendas detectadas</div>
            <div className="font-extrabold text-spark-ink">
              {proof.ocr_detected_sales !== null
                ? `R$ ${proof.ocr_detected_sales.toFixed(2).replace(".", ",")}`
                : "—"}
            </div>
          </div>
        </div>

        {proof.ocr_text && proof.ocr_text !== "" && (
          <details className="text-[11px]">
            <summary className="text-spark-ink-50 cursor-pointer hover:text-spark-ink-70">
              raw OCR
            </summary>
            <pre className="mt-1 bg-spark-surface-sunken rounded p-2 overflow-x-auto text-[10.5px]">
              {proof.ocr_text}
            </pre>
          </details>
        )}

        {proof.rejection_reason && (
          <div className="rounded-spark-lg bg-red-50 border border-red-200 px-3 py-2 text-[11.5px] text-red-700 inline-flex items-start gap-1.5">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <span>{proof.rejection_reason}</span>
          </div>
        )}

        {canAct && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={onApprove}
              disabled={acting}
              className="flex-1 px-3 py-2 rounded-spark-lg bg-emerald-600 text-white text-[12.5px] font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {acting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Aprovar
            </button>
            <button
              onClick={onReject}
              disabled={acting}
              className="flex-1 px-3 py-2 rounded-spark-lg bg-red-600 text-white text-[12.5px] font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <X size={12} />
              Rejeitar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
