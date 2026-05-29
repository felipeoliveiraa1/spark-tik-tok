"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Gift, AlertCircle, Send, ArrowLeft, Sparkles } from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
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
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden hero-radial -mx-4 lg:-mx-10 px-4 lg:px-10 pt-6 lg:pt-10 pb-10 rounded-spark-3xl">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-24 w-[420px] h-[420px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-20 w-[420px] h-[420px]" />
        <SparkleField count={10} seed={303} className="opacity-50" />

        <div className="relative max-w-[820px] mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Voltar pro painel
          </Link>

          <div className="mt-6 inline-flex items-center gap-2 text-eyebrow text-spark-brand">
            <Gift size={13} strokeWidth={2.5} />
            ✦ liberar acesso
          </div>
          <h1
            className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
          >
            conceder trial <span className="text-grad-brand">em lote.</span>
          </h1>
          <p className="mt-5 text-fluid-lead text-spark-ink-70 max-w-[60ch] leading-snug font-semibold">
            Cria contas pra essas alunas com acesso gratuito de N dias. Cada uma recebe email
            com senha temporária.
          </p>
          <p className="mt-3 text-[13px] text-spark-ink-50 max-w-[60ch] leading-relaxed">
            Quando o trial expirar, elas caem em{" "}
            <code className="font-mono text-[12px] bg-spark-surface-sunken px-1.5 py-0.5 rounded-md border border-spark-hairline">
              /plano-inativo
            </code>{" "}
            e podem comprar via Kiwify (que reativa a conta existente, sem criar nova).
          </p>
        </div>
      </section>

      <div className="max-w-[820px] mx-auto mt-8 space-y-6">
        {/* Form */}
        <SectionReveal direction="up">
          <div className="p-6 lg:p-8 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
            <label className="block">
              <div className="text-eyebrow text-spark-ink-50 mb-2">
                Emails (1 por linha, ou separados por vírgula/espaço)
              </div>
              <textarea
                value={emailsRaw}
                onChange={(e) => setEmailsRaw(e.target.value)}
                placeholder={"aluna1@exemplo.com\naluna2@exemplo.com\n…"}
                className="w-full min-h-[160px] px-4 py-3 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] font-mono transition-all duration-200"
              />
              {parsedEmails.length > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-spark-brand-deep font-extrabold">
                  <Sparkles size={11} strokeWidth={2.5} />
                  {parsedEmails.length} email{parsedEmails.length === 1 ? "" : "s"} detectado
                  {parsedEmails.length === 1 ? "" : "s"}
                </div>
              )}
            </label>

            <label className="block mt-5">
              <div className="text-eyebrow text-spark-ink-50 mb-2">Dias de acesso</div>
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10) || 30)}
                className="w-36 px-4 py-2.5 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[16px] font-mono font-extrabold transition-all duration-200"
              />
            </label>

            {error && (
              <div className="mt-5 px-4 py-3 rounded-spark-xl bg-bad/5 border border-bad/20 text-bad text-[13px] inline-flex items-center gap-2 font-extrabold">
                <AlertCircle size={14} strokeWidth={2.5} />
                {error}
              </div>
            )}

            <div className="mt-6">
              <SButton
                type="button"
                variant="primary"
                size="md"
                Icon={Send}
                onClick={submit}
                disabled={pending || parsedEmails.length === 0}
              >
                {pending
                  ? "Criando contas..."
                  : `Liberar ${parsedEmails.length} conta${parsedEmails.length === 1 ? "" : "s"}`}
              </SButton>
            </div>
          </div>
        </SectionReveal>

        {/* Resultado */}
        {result && (
          <SectionReveal direction="up">
            <div className="p-6 lg:p-8 rounded-spark-2xl glass border border-spark-hairline shadow-rest">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={14} strokeWidth={2.5} className="text-spark-brand-deep" />
                <span className="text-eyebrow text-spark-brand">resultado</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <Stat label="Total" value={result.total} />
                <Stat label="Criadas" value={result.created} tone="good" />
                <Stat label="Já existiam" value={result.exists} tone="warn" />
                <Stat
                  label="Erros"
                  value={result.errors}
                  tone={result.errors > 0 ? "bad" : "neutral"}
                />
              </div>

              <div className="text-[12.5px] text-spark-ink-70 mb-5 font-semibold">
                Acesso liberado por <strong>{result.daysGranted} dias</strong>. Expira em{" "}
                <strong>{new Date(result.expiresAt).toLocaleDateString("pt-BR")}</strong>.
              </div>

              <div className="border-t border-spark-hairline pt-4 space-y-2">
                {result.results.map((r) => (
                  <div
                    key={r.email}
                    className="flex items-center gap-3 text-[13px] py-1.5 px-2 rounded-lg hover:bg-spark-surface-sunken/50 transition-colors"
                  >
                    {r.status === "created" ? (
                      <Check size={14} strokeWidth={2.5} className="text-good shrink-0" />
                    ) : r.status === "exists" ? (
                      <Check size={14} strokeWidth={2.5} className="text-warn shrink-0" />
                    ) : (
                      <AlertCircle size={14} strokeWidth={2.5} className="text-bad shrink-0" />
                    )}
                    <span className="font-mono text-[12.5px] text-spark-ink">{r.email}</span>
                    <span className="text-[11px] text-spark-ink-50 ml-auto text-right">
                      {r.status === "created" &&
                        (r.emailSent ? "criada + email enviado ✨" : "criada (email falhou)")}
                      {r.status === "exists" && "já existia — trial estendido"}
                      {r.status === "error" && `erro: ${r.error}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SectionReveal>
        )}
      </div>
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
  const bg =
    tone === "good"
      ? "bg-good/5 border-good/15"
      : tone === "warn"
        ? "bg-warn/5 border-warn/15"
        : tone === "bad"
          ? "bg-bad/5 border-bad/15"
          : "bg-spark-surface-sunken border-spark-hairline";
  return (
    <div className={`p-4 rounded-spark-xl border ${bg}`}>
      <div
        className={`font-mono tracking-tight leading-none font-extrabold ${color}`}
        style={{ fontSize: "clamp(1.5rem, 2vw, 1.75rem)" }}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10.5px] uppercase tracking-wider text-spark-ink-50 font-extrabold">
        {label}
      </div>
    </div>
  );
}
