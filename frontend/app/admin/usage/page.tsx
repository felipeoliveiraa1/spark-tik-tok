import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";

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

  // Pega últimos 30 dias
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: rowsRaw } = await supabase
    .from("ai_usage")
    .select("user_id, agent, model, prompt_tokens, completion_tokens, cost_usd, created_at")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows = (rowsRaw ?? []) as UsageRow[];

  // Junta com profiles pra mostrar email
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  let profiles: ProfileRow[] = [];
  if (userIds.length > 0) {
    const { data: profsRaw } = await supabase
      .from("profiles")
      .select("id, email, name")
      .in("id", userIds);
    profiles = (profsRaw ?? []) as ProfileRow[];
  }
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  // Agregações
  const totalUsd = rows.reduce((sum, r) => sum + Number(r.cost_usd), 0);
  const totalCalls = rows.length;
  const totalTokens = rows.reduce(
    (sum, r) => sum + Number(r.prompt_tokens) + Number(r.completion_tokens),
    0,
  );

  // Por agente
  const byAgent = new Map<string, { calls: number; cost: number; tokens: number }>();
  for (const r of rows) {
    const cur = byAgent.get(r.agent) ?? { calls: 0, cost: 0, tokens: 0 };
    cur.calls += 1;
    cur.cost += Number(r.cost_usd);
    cur.tokens += Number(r.prompt_tokens) + Number(r.completion_tokens);
    byAgent.set(r.agent, cur);
  }

  // Por usuária (top 20)
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

  // Por modelo
  const byModel = new Map<string, { calls: number; cost: number }>();
  for (const r of rows) {
    const cur = byModel.get(r.model) ?? { calls: 0, cost: 0 };
    cur.calls += 1;
    cur.cost += Number(r.cost_usd);
    byModel.set(r.model, cur);
  }

  return (
    <div className="max-w-[1100px] mx-auto px-5 lg:px-10 py-8">
      <div className="text-[13px] font-bold text-spark-brand uppercase tracking-[0.06em]">
        💰 Custo IA
      </div>
      <h1 className="text-[32px] font-extrabold tracking-tight mt-1">
        Uso da Gemini API · últimos 30 dias
      </h1>

      {/* KPIs gerais */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Custo total (USD)" value={formatUSD(totalUsd)} />
        <KpiCard
          label="Custo total (BRL ~)"
          value={formatBRL(totalUsd)}
          tone="brand"
        />
        <KpiCard label="Chamadas" value={totalCalls.toLocaleString("pt-BR")} />
        <KpiCard label="Tokens" value={totalTokens.toLocaleString("pt-BR")} />
      </div>

      {/* Por agente */}
      <div className="mt-8 p-5 rounded-2xl bg-spark-surface border border-spark-hairline">
        <div className="text-[11px] font-bold text-spark-ink-50 uppercase tracking-[0.08em] mb-3">
          Por agente
        </div>
        <table className="w-full text-[13.5px]">
          <thead className="text-[11px] uppercase text-spark-ink-50">
            <tr>
              <th className="text-left pb-2">Agente</th>
              <th className="text-right pb-2">Chamadas</th>
              <th className="text-right pb-2">Tokens</th>
              <th className="text-right pb-2">Custo</th>
              <th className="text-right pb-2">% custo</th>
            </tr>
          </thead>
          <tbody>
            {[...byAgent.entries()]
              .sort((a, b) => b[1].cost - a[1].cost)
              .map(([agent, s]) => (
                <tr key={agent} className="border-t border-spark-hairline">
                  <td className="py-2 font-bold capitalize">{agent}</td>
                  <td className="py-2 text-right font-mono">{s.calls}</td>
                  <td className="py-2 text-right font-mono">{s.tokens.toLocaleString("pt-BR")}</td>
                  <td className="py-2 text-right font-mono">{formatBRL(s.cost)}</td>
                  <td className="py-2 text-right font-mono text-spark-ink-50">
                    {totalUsd > 0 ? `${((s.cost / totalUsd) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Por modelo */}
      <div className="mt-5 p-5 rounded-2xl bg-spark-surface border border-spark-hairline">
        <div className="text-[11px] font-bold text-spark-ink-50 uppercase tracking-[0.08em] mb-3">
          Por modelo
        </div>
        <table className="w-full text-[13.5px]">
          <thead className="text-[11px] uppercase text-spark-ink-50">
            <tr>
              <th className="text-left pb-2">Modelo</th>
              <th className="text-right pb-2">Chamadas</th>
              <th className="text-right pb-2">Custo</th>
            </tr>
          </thead>
          <tbody>
            {[...byModel.entries()]
              .sort((a, b) => b[1].cost - a[1].cost)
              .map(([model, s]) => (
                <tr key={model} className="border-t border-spark-hairline">
                  <td className="py-2 font-mono text-[12.5px]">{model}</td>
                  <td className="py-2 text-right font-mono">{s.calls}</td>
                  <td className="py-2 text-right font-mono">{formatBRL(s.cost)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Top alunas mais caras */}
      <div className="mt-5 p-5 rounded-2xl bg-spark-surface border border-spark-hairline">
        <div className="text-[11px] font-bold text-spark-ink-50 uppercase tracking-[0.08em] mb-3">
          Top alunas (custo)
        </div>
        {topUsers.length === 0 ? (
          <div className="text-[13px] text-spark-ink-50 py-3">
            Nenhum uso registrado ainda. Faça uma conversa no chat pra começar a popular.
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead className="text-[11px] uppercase text-spark-ink-50">
              <tr>
                <th className="text-left pb-2">Aluna</th>
                <th className="text-right pb-2">Chamadas</th>
                <th className="text-right pb-2">Custo</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map(([uid, s]) => {
                const p = profileMap.get(uid);
                return (
                  <tr key={uid} className="border-t border-spark-hairline">
                    <td className="py-2">
                      <div className="font-bold">{p?.name || "—"}</div>
                      <div className="text-[11px] text-spark-ink-50 font-mono truncate">
                        {p?.email ?? uid.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-2 text-right font-mono align-top">{s.calls}</td>
                    <td className="py-2 text-right font-mono align-top">{formatBRL(s.cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 text-[11.5px] text-spark-ink-50">
        FX considerado: 1 USD = R$ 5,50 (aproximado). Atualize em
        <code className="px-1 py-0.5 mx-1 rounded bg-spark-surface-sunken font-mono text-[11px]">app/admin/usage/page.tsx</code>
        se quiser refinar.
      </div>
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
      className={`p-4 rounded-2xl border ${
        tone === "brand"
          ? "bg-brand-grad-soft border-spark-brand/15"
          : "bg-spark-surface border-spark-hairline"
      }`}
    >
      <div className="text-[11px] font-bold text-spark-ink-50 uppercase tracking-[0.06em]">
        {label}
      </div>
      <div
        className={`mt-2 font-extrabold font-mono tracking-tight text-[22px] ${
          tone === "brand" ? "text-spark-brand-deep" : "text-spark-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

