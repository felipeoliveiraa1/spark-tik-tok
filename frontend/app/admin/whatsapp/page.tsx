"use client";

import * as React from "react";
import {
  MessageCircle,
  Send,
  TestTube,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Users,
  Loader2,
  Phone,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Stats = {
  users_with_whatsapp: number;
  users_total: number;
  sent_today: number;
  sent_week: number;
  pending_now: number;
  failed_week: number;
  recent: RecentRow[];
  instances: Instance[];
};

type RecentRow = {
  id: string;
  user_id: string;
  template_key: string;
  status: string;
  phone: string;
  sent_at: string | null;
  created_at: string;
  error: string | null;
  user_name: string | null;
  user_email: string | null;
};

type Instance = {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  priority: number;
  daily_limit: number;
  purpose: string;
};

type BlastResult = {
  ok: boolean;
  reason?: string;
  template_key?: string;
  theme?: string;
  preview?: string;
  outbox_id?: string;
  campaign?: string;
  total_users?: number;
  enqueued?: number;
  skipped_no_phone?: number;
  skipped_weekly?: number;
  skipped_other?: number;
  note?: string;
};

export default function AdminWhatsAppPage() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [testPhone, setTestPhone] = React.useState("5511998002960");
  const [testName, setTestName] = React.useState("Felipe");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<BlastResult | null>(null);
  const [confirmBlast, setConfirmBlast] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    const res = await fetch("/api/admin/whatsapp/stats");
    if (res.ok) {
      const data = (await res.json()) as Stats;
      setStats(data);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void fetchStats();
    const id = setInterval(fetchStats, 15_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  const runTest = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/whatsapp/blast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "test_admin",
          test_phone: testPhone,
          test_name: testName,
        }),
      });
      const j = (await res.json()) as BlastResult;
      setResult(j);
      void fetchStats();
    } catch (err) {
      setResult({ ok: false, reason: err instanceof Error ? err.message : "erro" });
    } finally {
      setBusy(false);
    }
  };

  const runFlush = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/whatsapp/flush", { method: "POST" });
      const j = (await res.json()) as BlastResult;
      setResult({ ...j, ok: true, note: `Flush forçado: ${JSON.stringify(j)}` });
      void fetchStats();
    } catch (err) {
      setResult({ ok: false, reason: err instanceof Error ? err.message : "erro" });
    } finally {
      setBusy(false);
    }
  };

  const runBlast = async () => {
    setBusy(true);
    setResult(null);
    setConfirmBlast(false);
    try {
      const res = await fetch("/api/admin/whatsapp/blast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "all_active" }),
      });
      const j = (await res.json()) as BlastResult;
      setResult(j);
      void fetchStats();
    } catch (err) {
      setResult({ ok: false, reason: err instanceof Error ? err.message : "erro" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-8">
      {/* Page header */}
      <header className="flex flex-col gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-spark-ink-35">
          Campanhas WhatsApp
        </span>
        <h1 className="font-display lowercase tracking-tight text-spark-ink leading-[0.95] text-[36px] lg:text-[48px]">
          whatsapp
        </h1>
        <p className="text-[14px] text-spark-ink-50 max-w-[60ch] font-semibold">
          Dispara blast motivacional e acompanha triggers automáticos. Mensagens são
          escalonadas (1 a cada ~4.5s) pra não derrubar o número.
        </p>
      </header>

      {/* KPIs */}
      {loading || !stats ? (
        <div className="text-spark-ink-50">Carregando…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi
              label="Com WhatsApp"
              value={stats.users_with_whatsapp}
              sub={`de ${stats.users_total} ativas`}
              icon={Phone}
              tone="brand"
            />
            <Kpi
              label="Enviadas hoje"
              value={stats.sent_today}
              icon={CheckCircle2}
              tone="good"
            />
            <Kpi
              label="Pendentes na fila"
              value={stats.pending_now}
              icon={Clock}
              tone={stats.pending_now > 0 ? "warn" : undefined}
            />
            <Kpi
              label="Falhas (7d)"
              value={stats.failed_week}
              icon={AlertCircle}
              tone={stats.failed_week > 0 ? "bad" : undefined}
            />
          </div>

          {/* Forca flush manual (chama worker no VPS) */}
          {stats.pending_now > 0 && (
            <div className="flex items-center justify-between gap-3 p-4 rounded-spark-xl bg-warn/5 border border-warn/20">
              <div className="min-w-0">
                <div className="text-[13.5px] font-extrabold text-spark-ink">
                  {stats.pending_now} {stats.pending_now === 1 ? "mensagem pendente" : "mensagens pendentes"} na fila
                </div>
                <div className="text-[12px] text-spark-ink-70 font-semibold mt-0.5">
                  O worker no VPS processa automático a cada 1 min. Quer empurrar agora?
                </div>
              </div>
              <button
                type="button"
                onClick={runFlush}
                disabled={busy}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-warn text-white text-[12.5px] font-extrabold hover:opacity-90 disabled:opacity-50"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} strokeWidth={2.5} />}
                Processar agora
              </button>
            </div>
          )}

          {/* Painel teste + blast */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Teste */}
            <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-spark-lg bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center">
                  <TestTube size={16} strokeWidth={2.2} />
                </div>
                <h2 className="text-[16px] font-extrabold tracking-tight text-spark-ink">
                  Teste — só pro seu número
                </h2>
              </div>
              <p className="text-[12.5px] text-spark-ink-50 font-semibold mb-4">
                Manda 1 mensagem motivacional pro número informado. Usado pra revisar
                como vai chegar antes de disparar pra todas.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[10.5px] font-extrabold text-spark-ink-50 uppercase tracking-wider mb-1.5 block">
                    Telefone (com DDD + 55)
                  </label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="5511998002960"
                    className="w-full px-4 py-2.5 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-extrabold text-spark-ink-50 uppercase tracking-wider mb-1.5 block">
                    Nome (substitui {`{{name}}`})
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="Felipe"
                    className="w-full px-4 py-2.5 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={runTest}
                  disabled={busy || !testPhone}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-spark-ink text-white text-[13.5px] font-extrabold hover:bg-spark-brand-deep transition-colors disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} strokeWidth={2.4} />
                  )}
                  Enviar teste
                </button>
              </div>
            </div>

            {/* Blast geral */}
            <div className="rounded-spark-2xl bg-brand-grad text-white shadow-hero p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-spark-lg bg-white/20 backdrop-blur flex items-center justify-center">
                    <Users size={16} strokeWidth={2.4} />
                  </div>
                  <h2 className="text-[16px] font-extrabold tracking-tight">
                    Blast — todas as alunas ativas
                  </h2>
                </div>
                <p className="text-[12.5px] text-white/85 font-semibold mb-4">
                  Vai enfileirar o próximo motivacional (sistema escolhe automaticamente
                  o que cada aluna ainda não recebeu, da biblioteca de 365 templates).
                </p>
                <div className="text-[28px] font-mono font-extrabold leading-none mb-1">
                  {stats.users_with_whatsapp}
                </div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-white/80 mb-5">
                  alunas vão receber
                </div>

                {!confirmBlast ? (
                  <button
                    type="button"
                    onClick={() => setConfirmBlast(true)}
                    disabled={busy || stats.users_with_whatsapp === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-spark-brand-deep text-[13.5px] font-extrabold shadow-lift hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    <Send size={14} strokeWidth={2.5} />
                    Disparar pra todas
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="text-[12.5px] font-extrabold text-white/95 text-center">
                      Tem certeza? Vai mandar pra {stats.users_with_whatsapp} alunas.
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={runBlast}
                        disabled={busy}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-spark-brand-deep text-[13.5px] font-extrabold disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Sim, disparar"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmBlast(false)}
                        disabled={busy}
                        className="px-4 py-3 rounded-full bg-white/20 backdrop-blur text-white text-[13.5px] font-extrabold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resultado do último disparo */}
          {result && (
            <div
              className={cn(
                "rounded-spark-2xl border p-5",
                result.ok
                  ? "bg-good/5 border-good/20"
                  : "bg-bad/5 border-bad/20",
              )}
            >
              <div className="flex items-start gap-3">
                {result.ok ? (
                  <CheckCircle2 size={18} className="text-good shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="text-bad shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-extrabold text-spark-ink">
                    {result.ok ? "Disparo OK" : `Falhou: ${result.reason ?? "erro"}`}
                  </div>
                  {result.note && (
                    <div className="text-[12px] text-spark-ink-70 mt-1 font-semibold">
                      {result.note}
                    </div>
                  )}
                  {result.template_key && (
                    <div className="text-[11.5px] text-spark-ink-50 mt-2 font-mono">
                      {result.template_key} · {result.theme}
                    </div>
                  )}
                  {result.preview && (
                    <pre className="mt-3 p-4 rounded-spark-lg bg-spark-surface border border-spark-hairline text-[12.5px] whitespace-pre-wrap font-sans">
                      {result.preview}
                    </pre>
                  )}
                  {typeof result.enqueued === "number" && (
                    <div className="text-[12px] text-spark-ink-70 mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      <span>Enfileiradas: <strong>{result.enqueued}</strong></span>
                      <span>Sem WhatsApp: <strong>{result.skipped_no_phone}</strong></span>
                      <span>Limite semanal: <strong>{result.skipped_weekly}</strong></span>
                      <span>Outros skips: <strong>{result.skipped_other}</strong></span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="text-spark-ink-50 hover:text-spark-ink"
                  aria-label="Fechar"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {/* Instâncias */}
          <Section title="Instâncias (números)" subtitle="números do Evolution conectados">
            <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
              <ul className="divide-y divide-spark-hairline">
                {stats.instances.map((i) => (
                  <li
                    key={i.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          i.is_active ? "bg-good" : "bg-spark-ink-35",
                        )}
                      />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-extrabold text-spark-ink tracking-tight truncate">
                          {i.display_name}
                        </div>
                        <div className="text-[11px] text-spark-ink-50 font-mono">
                          {i.name} · prio {i.priority} · limit {i.daily_limit}/dia · {i.purpose}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-spark-ink-70">
                      {i.is_active ? "ativa" : "pausada"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* Histórico */}
          <Section title="Últimas 30 mensagens" subtitle="enviadas e pendentes">
            <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
              {stats.recent.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <MessageCircle
                    size={28}
                    strokeWidth={1.8}
                    className="mx-auto text-spark-ink-35 mb-2"
                  />
                  <div className="text-[13px] font-extrabold text-spark-ink">
                    Nenhuma mensagem ainda
                  </div>
                  <div className="text-[12px] text-spark-ink-50 mt-1 font-semibold">
                    Dispara um teste pro seu número pra começar.
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-spark-hairline">
                  {stats.recent.map((r) => (
                    <li key={r.id} className="px-5 py-3 flex items-center gap-3">
                      <StatusDot status={r.status} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-extrabold text-spark-ink truncate">
                          {r.user_name ?? r.user_email?.split("@")[0] ?? "—"}
                          <span className="ml-2 text-[11px] font-mono text-spark-ink-50">
                            {r.phone}
                          </span>
                        </div>
                        <div className="text-[11px] text-spark-ink-50 font-mono mt-0.5 truncate">
                          {r.template_key}
                          {r.error && (
                            <span className="ml-2 text-bad">· {r.error}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10.5px] text-spark-ink-50 font-mono shrink-0">
                        {fmtRelative(r.sent_at ?? r.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[16px] font-extrabold tracking-tight text-spark-ink">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] text-spark-ink-50 mt-0.5 font-semibold">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  tone?: "brand" | "good" | "warn" | "bad";
}) {
  const iconBg =
    tone === "brand"
      ? "bg-spark-brand-soft text-spark-brand-deep"
      : tone === "good"
        ? "bg-good/10 text-good"
        : tone === "warn"
          ? "bg-warn/10 text-warn"
          : tone === "bad"
            ? "bg-bad/10 text-bad"
            : "bg-spark-surface-sunken text-spark-ink-70";

  return (
    <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 shadow-rest">
      <div
        className={`w-9 h-9 rounded-spark-lg flex items-center justify-center mb-4 ${iconBg}`}
      >
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <div className="font-mono font-extrabold text-spark-ink text-[26px] leading-none">
        {value}
      </div>
      <div className="text-[11px] text-spark-ink-50 mt-1.5 font-extrabold uppercase tracking-wider">
        {label}
      </div>
      {sub && <div className="text-[10.5px] text-spark-ink-35 mt-0.5">{sub}</div>}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    sent: { color: "bg-good", label: "enviada" },
    pending: { color: "bg-warn", label: "fila" },
    failed: { color: "bg-bad", label: "falhou" },
    skipped: { color: "bg-spark-ink-35", label: "pulou" },
  };
  const s = map[status] ?? map.pending;
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-spark-ink-50 w-12">
        {s.label}
      </span>
    </div>
  );
}

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}
