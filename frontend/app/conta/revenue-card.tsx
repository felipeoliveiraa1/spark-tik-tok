"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Check, X, Pencil } from "lucide-react";
import { useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type RevenueRow = { year_month: string; amount_brl: number; notes: string | null };

type Props = {
  metaMensalBrl: number | null;
};

function currentYM(): string {
  return new Date().toISOString().slice(0, 7);
}

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function fmtMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export function RevenueCard({ metaMensalBrl }: Props) {
  const router = useRouter();
  const toast = useToast();
  const ym = currentYM();
  const [revenue, setRevenue] = React.useState<RevenueRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [amount, setAmount] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/revenue?months=6", { cache: "no-store" });
      if (cancelled) return;
      if (res.ok) {
        const data = (await res.json()) as { revenue: RevenueRow[] };
        setRevenue(data.revenue);
        const thisMonth = data.revenue.find((r) => r.year_month === ym);
        if (thisMonth) setAmount(String(thisMonth.amount_brl));
      }
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [ym]);

  const currentMonthAmount =
    revenue.find((r) => r.year_month === ym)?.amount_brl ?? 0;
  const pct =
    metaMensalBrl && metaMensalBrl > 0
      ? Math.min(100, Math.round((currentMonthAmount / metaMensalBrl) * 100))
      : 0;

  const save = async () => {
    const num = Number(amount);
    if (Number.isNaN(num) || num < 0) {
      toast.error("Valor inválido");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/revenue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ year_month: ym, amount_brl: num }),
      });
      if (res.ok) {
        toast.success("Faturamento salvo 💸");
        const updated = revenue.filter((r) => r.year_month !== ym);
        setRevenue([{ year_month: ym, amount_brl: num, notes: null }, ...updated]);
        setEditing(false);
        router.refresh();
      } else {
        toast.error("Não consegui salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
        <div className="text-eyebrow text-spark-brand">✦ faturamento</div>
        <div className="mt-3 h-6 w-32 rounded bg-spark-surface-sunken animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
      <div className="flex items-center justify-between mb-3">
        <div className="text-eyebrow text-spark-brand flex items-center gap-1.5">
          <TrendingUp size={11} strokeWidth={2.5} />
          ✦ faturamento · {fmtMonth(ym)}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar"
            className="w-9 h-9 rounded-full bg-spark-surface-sunken text-spark-ink-70 hover:text-spark-brand-deep hover:bg-spark-brand-soft active:scale-95 transition-all duration-300 ease-premium flex items-center justify-center"
          >
            <Pencil size={14} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* Explicação do que é e como funciona */}
      <p className="text-[12px] text-spark-ink-70 leading-snug font-semibold mb-3.5">
        Quanto você faturou no TikTok Shop <strong>nesse mês</strong>. Atualiza
        sempre que quiser — vai entrando aos pouquinhos conforme as vendas
        acumulam. No próximo mês vira histórico e abre o novo zerado.
      </p>

      {editing ? (
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-spark-ink-50 font-extrabold text-[14px]">
              R$
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min={0}
              step={50}
              className="w-full pl-12 pr-4 py-3 rounded-spark-xl bg-spark-bg border border-spark-brand/40 focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[18px] font-extrabold font-mono transition-all duration-200"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-spark-ink text-white text-[13px] font-extrabold shadow-lift hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-premium disabled:opacity-60"
            >
              <Check size={13} strokeWidth={2.5} />
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-spark-surface-sunken text-spark-ink-70 text-[13px] font-extrabold"
            >
              <X size={13} strokeWidth={2.5} />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div
            className="font-display lowercase tracking-tight text-spark-ink leading-none"
            style={{ fontSize: "clamp(2.5rem, 6vw, 3.5rem)" }}
          >
            {fmtBRL(currentMonthAmount)}
          </div>
          {metaMensalBrl ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-spark-ink-50 font-extrabold uppercase tracking-wider mb-1.5">
                <span>vs meta {fmtBRL(metaMensalBrl)}</span>
                <span className="text-spark-brand-deep">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-spark-surface-sunken overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-700 ease-premium",
                    pct >= 100 ? "bg-good" : "bg-brand-grad",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-spark-ink-50">
              Define uma meta mensal no &ldquo;Sobre mim&rdquo; pra ver progresso.
            </p>
          )}
        </div>
      )}

      {/* Histórico */}
      {revenue.length > 1 && (
        <div className="mt-5 pt-4 border-t border-spark-hairline">
          <div className="text-[10.5px] font-extrabold text-spark-ink-50 uppercase tracking-wider mb-2.5">
            Meses anteriores
          </div>
          <div className="space-y-1.5">
            {revenue
              .filter((r) => r.year_month !== ym)
              .slice(0, 3)
              .map((r) => (
                <div
                  key={r.year_month}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-spark-ink-70 font-semibold first-letter:capitalize">
                    {fmtMonth(r.year_month)}
                  </span>
                  <span className="font-mono font-extrabold text-spark-ink">
                    {fmtBRL(r.amount_brl)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
