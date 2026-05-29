import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, DollarSign } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";

export const dynamic = "force-dynamic";

type UsageRow = {
  user_id: string;
  agent: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
};

function formatBRL(usd: number, fx = 5.5): string {
  return (usd * fx).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUSD(usd: number): string {
  return `$${usd.toFixed(4)}`;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function AdminUsagePage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const admin = getServiceClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: rowsRaw, error: usageErr } = await admin
    .from("ai_usage")
    .select("user_id, agent, model, prompt_tokens, completion_tokens, cost_usd, created_at")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (usageErr) {
    console.error("[admin/usage] read ai_usage failed", usageErr);
  }

  const rows = (rowsRaw ?? []) as UsageRow[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  let profiles: ProfileRow[] = [];
  if (userIds.length > 0) {
    const { data: profsRaw } = await admin
      .from("profiles")
      .select("id, email, name")
      .in("id", userIds);
    profiles = (profsRaw ?? []) as ProfileRow[];
  }
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const totalUsd = rows.reduce((sum, r) => sum + Number(r.cost_usd), 0);
  const totalCalls = rows.length;
  const totalTokens = rows.reduce(
    (sum, r) => sum + Number(r.prompt_tokens) + Number(r.completion_tokens),
    0,
  );

  const byAgent = new Map<string, { calls: number; cost: number; tokens: number }>();
  for (const r of rows) {
    const cur = byAgent.get(r.agent) ?? { calls: 0, cost: 0, tokens: 0 };
    cur.calls += 1;
    cur.cost += Number(r.cost_usd);
    cur.tokens += Number(r.prompt_tokens) + Number(r.completion_tokens);
    byAgent.set(r.agent, cur);
  }

  const byUser = new Map<string, { calls: number; cost: number }>();
  for (const r of rows) {
    const cur = byUser.get(r.user_id) ?? { calls: 0, cost: 0 };
    cur.calls += 1;
    cur.cost += Number(r.cost_usd);
    byUser.set(r.user_id, cur);
  }
  const topUsers = [...byUser.entries()]
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 20);

  const byModel = new Map<string, { calls: number; cost: number }>();
  for (const r of rows) {
    const cur = byModel.get(r.model) ?? { calls: 0, cost: 0 };
    cur.calls += 1;
    cur.cost += Number(r.cost_usd);
    byModel.set(r.model, cur);
  }

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial -mx-4 lg:-mx-10 px-4 lg:px-10 pt-6 lg:pt-10 pb-10 rounded-spark-3xl">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-24 w-[420px] h-[420px]" />
        <HeroBlob color="lilac" variant={2} className="top-10 -right-20 w-[420px] h-[420px]" />
        <SparkleField count={10} seed={444} className="opacity-50" />

        <div className="relative max-w-[1100px] mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pro painel
          </Link>

          <div className="mt-6 inline-flex items-center gap-2 text-eyebrow text-spark-brand">
            <DollarSign size={13} strokeWidth={2.5} />
            ✦ custo da ia
          </div>
          <h1
            className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
          >
            quanto a gemini <span className="text-grad-brand">tá comendo.</span>
          </h1>
          <p className="mt-5 text-fluid-lead text-spark-ink-70 max-w-[60ch] leading-snug font-semibold">
            Últimos 30 dias. Agregado por agente, modelo e top alunas.
          </p>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto mt-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Custo total (USD)" value={formatUSD(totalUsd)} />
          <KpiCard label="Custo total (BRL ~)" value={formatBRL(totalUsd)} tone="brand" />
          <KpiCard label="Chamadas" value={totalCalls.toLocaleString("pt-BR")} />
          <KpiCard label="Tokens" value={totalTokens.toLocaleString("pt-BR")} />
        </div>

        {/* Por agente */}
        <TableSection label="por agente">
          <table className="w-full text-[13.5px]">
            <thead className="text-[10.5px] uppercase text-spark-ink-50 tracking-wider">
              <tr>
                <th className="text-left pb-3 font-extrabold">Agente</th>
                <th className="text-right pb-3 font-extrabold">Chamadas</th>
                <th className="text-right pb-3 font-extrabold">Tokens</th>
                <th className="text-right pb-3 font-extrabold">Custo</th>
                <th className="text-right pb-3 font-extrabold">% custo</th>
              </tr>
            </thead>
            <tbody>
              {[...byAgent.entries()]
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([agent, s]) => (
                  <tr
                    key={agent}
                    className="border-t border-spark-hairline hover:bg-spark-brand-soft/20 transition-colors"
                  >
                    <td className="py-3 font-extrabold capitalize text-spark-ink">{agent}</td>
                    <td className="py-3 text-right font-mono text-spark-ink">{s.calls}</td>
                    <td className="py-3 text-right font-mono text-spark-ink-70">
                      {s.tokens.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 text-right font-mono font-extrabold text-spark-ink">
                      {formatBRL(s.cost)}
                    </td>
                    <td className="py-3 text-right font-mono text-spark-ink-50">
                      {totalUsd > 0 ? `${((s.cost / totalUsd) * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableSection>

        {/* Por modelo */}
        <TableSection label="por modelo">
          <table className="w-full text-[13.5px]">
            <thead className="text-[10.5px] uppercase text-spark-ink-50 tracking-wider">
              <tr>
                <th className="text-left pb-3 font-extrabold">Modelo</th>
                <th className="text-right pb-3 font-extrabold">Chamadas</th>
                <th className="text-right pb-3 font-extrabold">Custo</th>
              </tr>
            </thead>
            <tbody>
              {[...byModel.entries()]
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([model, s]) => (
                  <tr
                    key={model}
                    className="border-t border-spark-hairline hover:bg-spark-brand-soft/20 transition-colors"
                  >
                    <td className="py-3 font-mono text-[12.5px] text-spark-ink">{model}</td>
                    <td className="py-3 text-right font-mono text-spark-ink">{s.calls}</td>
                    <td className="py-3 text-right font-mono font-extrabold text-spark-ink">
                      {formatBRL(s.cost)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableSection>

        {/* Top alunas */}
        <TableSection label="top alunas (custo)">
          {topUsers.length === 0 ? (
            <div className="text-[13px] text-spark-ink-50 py-3 italic">
              Nenhum uso registrado ainda. Faça uma conversa no chat pra começar a popular.
            </div>
          ) : (
            <table className="w-full text-[13.5px]">
              <thead className="text-[10.5px] uppercase text-spark-ink-50 tracking-wider">
                <tr>
                  <th className="text-left pb-3 font-extrabold">Aluna</th>
                  <th className="text-right pb-3 font-extrabold">Chamadas</th>
                  <th className="text-right pb-3 font-extrabold">Custo</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map(([uid, s]) => {
                  const p = profileMap.get(uid);
                  return (
                    <tr
                      key={uid}
                      className="border-t border-spark-hairline hover:bg-spark-brand-soft/20 transition-colors"
                    >
                      <td className="py-3">
                        <div className="font-extrabold text-spark-ink">
                          {p?.name || "—"}
                        </div>
                        <div className="text-[11px] text-spark-ink-50 font-mono truncate">
                          {p?.email ?? uid.slice(0, 8)}
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono align-top text-spark-ink">
                        {s.calls}
                      </td>
                      <td className="py-3 text-right font-mono align-top font-extrabold text-spark-ink">
                        {formatBRL(s.cost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableSection>

        <div className="text-[11.5px] text-spark-ink-50 italic">
          FX considerado: 1 USD = R$ 5,50 (aproximado). Atualize em
          <code className="px-1.5 py-0.5 mx-1 rounded bg-spark-surface-sunken font-mono text-[11px] border border-spark-hairline">
            app/admin/usage/page.tsx
          </code>
          se quiser refinar.
        </div>
      </div>
    </div>
  );
}

function TableSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
      <div className="text-eyebrow text-spark-brand mb-4">{label}</div>
      <div className="overflow-x-auto -mx-2 px-2">{children}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "brand";
}) {
  return (
    <div
      className={`p-5 rounded-spark-2xl border shadow-rest transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-lift ${
        tone === "brand"
          ? "bg-brand-grad-soft border-spark-brand/15"
          : "bg-spark-surface border-spark-hairline"
      }`}
    >
      <div className="text-[10.5px] font-extrabold text-spark-ink-50 uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`mt-2.5 font-mono tracking-tight leading-none font-extrabold ${
          tone === "brand" ? "text-spark-brand-deep" : "text-spark-ink"
        }`}
        style={{ fontSize: "clamp(1.4rem, 2.2vw, 1.75rem)" }}
      >
        {value}
      </div>
    </div>
  );
}
