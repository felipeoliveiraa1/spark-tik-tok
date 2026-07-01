"use client";

import * as React from "react";
import { Search, Loader2, Calendar, XCircle, AlertTriangle, RotateCcw, Timer } from "lucide-react";
import { cn } from "@/lib/cn";

const SECTIONS = [
  { key: "renewals-upcoming", label: "Renovações 30d", Icon: Calendar, tone: "brand" },
  { key: "late", label: "Atrasadas", Icon: AlertTriangle, tone: "warn" },
  { key: "canceled", label: "Canceladas 90d", Icon: XCircle, tone: "neutral" },
  { key: "refunded", label: "Reembolsadas", Icon: RotateCcw, tone: "bad" },
  { key: "trial", label: "Trial expirando", Icon: Timer, tone: "brand" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

type Row = {
  id: string;
  email: string;
  name: string | null;
  whatsapp: string | null;
  plan_status: string | null;
  plan_next_payment: string | null;
  plan_canceled_at: string | null;
  plan_expires_at: string | null;
  plan_renewed_at: string | null;
  created_at: string;
  days_until_renewal: number | null;
};

type SectionResp = {
  section: SectionKey;
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function SegmentsTabs() {
  const [active, setActive] = React.useState<SectionKey>("renewals-upcoming");
  const [search, setSearch] = React.useState("");
  const [data, setData] = React.useState<SectionResp | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (debouncedSearch) qs.set("search", debouncedSearch);
      qs.set("page", "1");
      qs.set("pageSize", "100");
      const res = await fetch(
        `/api/admin/financeiro/sections/${active}?${qs}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const j = (await res.json()) as SectionResp;
        setData(j);
      }
    } finally {
      setLoading(false);
    }
  }, [active, debouncedSearch]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const copyEmails = () => {
    if (!data?.rows) return;
    const emails = data.rows.map((r) => r.email).join(", ");
    navigator.clipboard.writeText(emails);
  };

  return (
    <section>
      <div className="text-eyebrow text-spark-brand mb-3">✦ listas segmentadas</div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SECTIONS.map((s) => {
          const isActive = s.key === active;
          return (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12.5px] font-extrabold transition-all",
                isActive
                  ? "bg-spark-brand text-white shadow-lift-brand"
                  : "bg-spark-surface border border-spark-hairline text-spark-ink-70 hover:text-spark-ink",
              )}
            >
              <s.Icon size={13} strokeWidth={2.5} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Search + copy */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-spark-ink-35"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email ou nome..."
            className="w-full pl-9 pr-3 py-2 rounded-spark-lg border border-spark-hairline bg-spark-surface text-[13px] focus:outline-none focus:border-spark-brand/40"
          />
        </div>
        <button
          onClick={copyEmails}
          disabled={!data?.rows.length}
          className="px-3 py-2 rounded-spark-lg bg-spark-surface border border-spark-hairline text-[12px] font-extrabold text-spark-ink-70 hover:text-spark-ink disabled:opacity-50"
        >
          Copiar emails
        </button>
      </div>

      {/* Table */}
      <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-spark-ink-50">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-[24px] mb-2">✨</div>
            <div className="text-[13px] text-spark-ink-50 font-semibold">
              Nenhuma aluna nesse segmento.
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-spark-ink-50 bg-spark-surface-sunken/50 flex items-center justify-between">
              <span>
                {data.total} {data.total === 1 ? "aluna" : "alunas"}
                {data.total > data.rows.length && ` (mostrando ${data.rows.length})`}
              </span>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              <table className="w-full text-[12.5px]">
                <thead className="sticky top-0 bg-spark-surface z-10 border-b border-spark-hairline">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-extrabold text-spark-ink-50 uppercase tracking-wider text-[10px]">
                      Email
                    </th>
                    <th className="text-left px-3 py-2.5 font-extrabold text-spark-ink-50 uppercase tracking-wider text-[10px]">
                      Nome
                    </th>
                    <th className="text-left px-3 py-2.5 font-extrabold text-spark-ink-50 uppercase tracking-wider text-[10px]">
                      {active === "renewals-upcoming"
                        ? "Renova em"
                        : active === "canceled"
                          ? "Cancelou em"
                          : active === "refunded"
                            ? "Reembolso"
                            : active === "late"
                              ? "Deveria ter renovado"
                              : "Trial acaba"}
                    </th>
                    <th className="text-right px-5 py-2.5 font-extrabold text-spark-ink-50 uppercase tracking-wider text-[10px]">
                      WhatsApp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-spark-hairline">
                  {data.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-spark-ink/[0.02]">
                      <td className="px-5 py-2.5 font-mono text-spark-ink truncate max-w-[200px]">
                        {r.email}
                      </td>
                      <td className="px-3 py-2.5 text-spark-ink-70 truncate max-w-[140px]">
                        {r.name ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-spark-ink-70 tabular-nums">
                        {active === "renewals-upcoming" && (
                          <span
                            className={cn(
                              "font-extrabold",
                              r.days_until_renewal !== null &&
                                r.days_until_renewal <= 3
                                ? "text-warn"
                                : "text-spark-ink",
                            )}
                          >
                            {r.days_until_renewal !== null
                              ? `${r.days_until_renewal}d`
                              : "—"}
                          </span>
                        )}
                        {active === "canceled" && fmtDate(r.plan_canceled_at)}
                        {active === "refunded" && fmtDate(r.plan_canceled_at)}
                        {active === "late" && (
                          <span className="text-warn font-extrabold">
                            {r.days_until_renewal !== null
                              ? `${Math.abs(r.days_until_renewal)}d atrás`
                              : "—"}
                          </span>
                        )}
                        {active === "trial" && fmtDate(r.plan_expires_at)}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {r.whatsapp ? (
                          <a
                            href={`https://wa.me/${r.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-spark-brand-deep hover:underline font-extrabold text-[11.5px]"
                          >
                            WhatsApp →
                          </a>
                        ) : (
                          <span className="text-spark-ink-35 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
