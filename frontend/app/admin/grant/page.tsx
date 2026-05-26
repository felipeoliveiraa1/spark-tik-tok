"use client";

import * as React from "react";
import { Check, Gift, AlertCircle, Send } from "lucide-react";
import { SButton } from "@/components/atoms/s-button";

type ResultRow =
  | { email: string; status: "created"; userId: string; emailSent: boolean }
  | { email: string; status: "exists"; userId: string }
  | { email: string; status: "error"; error: string };

export default function AdminGrantPage() {
  const [emailsRaw, setEmailsRaw] = React.useState("");
  const [days, setDays] = React.useState(30);
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<{
    total: number;
    created: number;
    exists: number;
    errors: number;
    daysGranted: number;
    expiresAt: string;
    results: ResultRow[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const parsedEmails = React.useMemo(
    () =>
      emailsRaw
        .split(/[\s,;\n]+/)
        .map((e) => e.trim())
        .filter(Boolean),
    [emailsRaw],
  );

  async function submit() {
    setError(null);
    setResult(null);
    if (parsedEmails.length === 0) {
      setError("Cola pelo menos 1 email.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/admin/grant-trial", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emails: parsedEmails, days }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Erro inesperado");
        return;
      }
      setResult(data);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-[820px] mx-auto px-5 lg:px-10 py-8">
      <div className="text-[13px] font-bold text-spark-brand uppercase tracking-[0.06em] inline-flex items-center gap-1.5">
        <Gift size={14} strokeWidth={2} />
        Liberar acesso
      </div>
      <h1 className="text-[32px] font-extrabold tracking-tight mt-1">
        Conceder trial em lote
      </h1>
      <p className="text-[14px] text-spark-ink-70 mt-2 max-w-[600px] leading-relaxed">
        Cria contas pra essas alunas com acesso gratuito de N dias. Cada uma
        recebe email com senha temporária. Quando o trial expirar, elas caem em{" "}
        <code className="font-mono text-[13px] bg-spark-surface-sunken px-1 rounded">
          /plano-inativo
        </code>{" "}
        e podem comprar via Kiwify (que aí reativa a conta existente, sem criar
        nova).
      </p>

      <div className="mt-6 p-5 rounded-2xl bg-spark-surface border border-spark-hairline">
        <label className="block">
          <div className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-[0.06em] mb-1.5">
            Emails (1 por linha, ou separados por vírgula/espaço)
          </div>
          <textarea
            value={emailsRaw}
            onChange={(e) => setEmailsRaw(e.target.value)}
            placeholder={"aluna1@exemplo.com\naluna2@exemplo.com\n…"}
            className="w-full min-h-[140px] px-3.5 py-2.5 rounded-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand outline-none text-[14px] font-mono"
          />
          {parsedEmails.length > 0 && (
            <div className="mt-1.5 text-[11.5px] text-spark-ink-50">
              {parsedEmails.length} email{parsedEmails.length === 1 ? "" : "s"}{" "}
              detectado{parsedEmails.length === 1 ? "" : "s"}
            </div>
          )}
        </label>

        <label className="block mt-4">
          <div className="text-[12px] font-bold text-spark-ink-50 uppercase tracking-[0.06em] mb-1.5">
            Dias de acesso
          </div>
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10) || 30)}
            className="w-32 px-3.5 py-2 rounded-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand outline-none text-[15px] font-mono"
          />
        </label>

        {error && (
          <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] inline-flex items-center gap-2">
            <AlertCircle size={14} strokeWidth={2} />
            {error}
          </div>
        )}

        <div className="mt-5">
          <SButton
            type="button"
            variant="primary"
            size="md"
            Icon={Send}
            onClick={submit}
            disabled={pending || parsedEmails.length === 0}
          >
            {pending ? "Criando contas…" : `Liberar ${parsedEmails.length} conta${parsedEmails.length === 1 ? "" : "s"}`}
          </SButton>
        </div>
      </div>

      {result && (
        <div className="mt-6 p-5 rounded-2xl bg-spark-surface border border-spark-hairline">
          <div className="text-[11px] font-bold text-spark-ink-50 uppercase tracking-[0.08em] mb-3">
            Resultado
          </div>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <Stat label="Total" value={result.total} />
            <Stat label="Criadas" value={result.created} tone="good" />
            <Stat label="Já existiam" value={result.exists} tone="warn" />
            <Stat label="Erros" value={result.errors} tone={result.errors > 0 ? "bad" : "neutral"} />
          </div>
          <div className="text-[12px] text-spark-ink-50 mb-3">
            Acesso liberado por <strong>{result.daysGranted} dias</strong>. Expira em{" "}
            <strong>{new Date(result.expiresAt).toLocaleDateString("pt-BR")}</strong>.
          </div>

          <div className="border-t border-spark-hairline pt-3 space-y-2">
            {result.results.map((r) => (
              <div
                key={r.email}
                className="flex items-center gap-2.5 text-[13px] py-1"
              >
                {r.status === "created" ? (
                  <Check size={14} strokeWidth={2.5} className="text-good shrink-0" />
                ) : r.status === "exists" ? (
                  <Check size={14} strokeWidth={2.5} className="text-warn shrink-0" />
                ) : (
                  <AlertCircle size={14} strokeWidth={2} className="text-bad shrink-0" />
                )}
                <span className="font-mono text-[12.5px]">{r.email}</span>
                <span className="text-[11px] text-spark-ink-50">
                  {r.status === "created" &&
                    (r.emailSent ? "criada + email enviado ✨" : "criada (email falhou)")}
                  {r.status === "exists" && "já existia — trial estendido"}
                  {r.status === "error" && `erro: ${r.error}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "good" | "warn" | "bad" | "neutral";
}) {
  const color =
    tone === "good"
      ? "text-good"
      : tone === "warn"
        ? "text-warn"
        : tone === "bad"
          ? "text-bad"
          : "text-spark-ink";
  return (
    <div className="p-3 rounded-xl bg-spark-surface-sunken">
      <div className={`text-[24px] font-extrabold font-mono tracking-tight leading-none ${color}`}>
        {value}
      </div>
      <div className="mt-1 text-[10.5px] uppercase tracking-[0.06em] text-spark-ink-50 font-semibold">
        {label}
      </div>
    </div>
  );
}
