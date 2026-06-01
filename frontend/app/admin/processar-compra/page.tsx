"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { cn } from "@/lib/cn";

type Result = {
  ok: boolean;
  mode?: "created" | "reactivated";
  email_sent?: boolean;
  email_error?: string | null;
  error?: string;
};

type LogEntry = {
  name: string;
  email: string;
  result: Result;
  ts: number;
};

export default function ProcessarCompraPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [cpf, setCpf] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [log, setLog] = React.useState<LogEntry[]>([]);

  const reset = () => {
    setName("");
    setEmail("");
    setWhatsapp("");
    setCpf("");
  };

  const submit = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/create-paid-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
          cpf: cpf.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Result;
      const result: Result = res.ok
        ? data
        : { ok: false, error: data.error ?? `HTTP ${res.status}` };
      setLog((arr) => [
        { name: name.trim() || "—", email: email.trim(), result, ts: Date.now() },
        ...arr,
      ]);
      if (result.ok) reset();
    } catch (err) {
      setLog((arr) => [
        {
          name: name.trim() || "—",
          email: email.trim(),
          result: {
            ok: false,
            error: err instanceof Error ? err.message : "erro de rede",
          },
          ts: Date.now(),
        },
        ...arr,
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <section className="relative overflow-hidden hero-radial rounded-spark-3xl mb-8 px-6 lg:px-10 py-10 lg:py-12">
        <HeroBlob color="rose" variant={1} className="-top-20 -left-20 w-[360px] h-[360px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-32 w-[360px] h-[360px]" />
        <SparkleField count={10} seed={8181} className="opacity-50" />

        <div className="relative">
          <SectionReveal direction="down" durationMs={500}>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-full text-spark-ink-70 hover:text-spark-ink hover:bg-spark-surface-sunken/60 text-[12.5px] font-extrabold transition-colors duration-300"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar pro painel
            </Link>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={700}>
            <div className="mt-5 text-eyebrow text-spark-brand-deep">✦ processar compra</div>
            <h1
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.9]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              criar conta + <span className="text-grad-brand">welcome.</span>
            </h1>
            <p className="mt-3 text-fluid-body text-spark-ink-70 leading-snug max-w-[58ch] font-semibold">
              Pra quando o webhook do Kiwify não chegou. Mesmo fluxo de uma compra real:
              cria a conta (ou reativa se já existir), salva no histórico financeiro e
              envia o email de boas-vindas com senha temporária.
            </p>
          </SectionReveal>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
        {/* Form */}
        <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest p-5 lg:p-7 space-y-4">
          <div className="text-eyebrow text-spark-brand">✦ dados da aluna</div>

          <Field label="Nome completo">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Naiara Cristina de Oliveira"
              disabled={submitting}
              className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand transition-colors disabled:opacity-60"
            />
          </Field>

          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: aluna@email.com"
              disabled={submitting}
              autoComplete="off"
              className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand transition-colors disabled:opacity-60"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="WhatsApp">
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+55 16 99999-9999"
                disabled={submitting}
                className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand transition-colors disabled:opacity-60 font-mono"
              />
            </Field>

            <Field label="CPF">
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                disabled={submitting}
                className="w-full px-3.5 py-3 rounded-xl border-2 border-spark-hairline bg-spark-surface text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand transition-colors disabled:opacity-60 font-mono"
              />
            </Field>
          </div>

          <div className="rounded-spark-xl bg-spark-surface-sunken/60 border border-spark-hairline px-4 py-3 text-[11.5px] text-spark-ink-50 leading-snug font-mono">
            ✦ Plano default: R$ 49,00/mês com próxima cobrança em 30 dias.
            Se a aluna já tem conta, o plano é REATIVADO (mesmo profile,
            histórico preservado). Se não, cria conta nova + envia welcome
            com senha temporária.
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={reset}
              disabled={submitting}
              className="text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink px-4 py-2.5 rounded-full transition-colors disabled:opacity-50"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !email.trim()}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-3 rounded-full text-[13.5px] font-extrabold transition-all duration-300 ease-premium",
                submitting || !email.trim()
                  ? "bg-spark-surface text-spark-ink-50 border border-spark-hairline cursor-not-allowed"
                  : "bg-brand-grad text-white shadow-lift-brand hover:-translate-y-0.5",
              )}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Send size={14} strokeWidth={2.5} />
                  Criar conta + enviar welcome
                </>
              )}
            </button>
          </div>
        </div>

        {/* Log */}
        <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest overflow-hidden">
          <div className="px-5 py-4 border-b border-spark-hairline flex items-center justify-between">
            <div className="text-eyebrow text-spark-brand">✦ processadas nesta sessão</div>
            <div className="text-[11px] text-spark-ink-50 font-mono">{log.length}</div>
          </div>
          {log.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-[28px] mb-2">✨</div>
              <div className="text-[13px] text-spark-ink-50 font-semibold">
                Preencha os dados e clique em criar. O resultado aparece aqui.
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-spark-hairline max-h-[520px] overflow-y-auto">
              {log.map((entry, i) => (
                <li key={`${entry.ts}-${i}`} className="px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    {entry.result.ok ? (
                      <CheckCircle2
                        size={18}
                        strokeWidth={2.5}
                        className="text-good shrink-0 mt-0.5"
                      />
                    ) : (
                      <XCircle
                        size={18}
                        strokeWidth={2.5}
                        className="text-bad shrink-0 mt-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-extrabold text-spark-ink tracking-tight truncate">
                        {entry.name}
                      </div>
                      <div className="text-[11.5px] text-spark-ink-50 font-mono mt-0.5 truncate">
                        {entry.email}
                      </div>
                      {entry.result.ok ? (
                        <div className="mt-1.5 text-[11px] font-extrabold uppercase tracking-wider text-good inline-flex items-center gap-2">
                          {entry.result.mode === "reactivated"
                            ? "🔄 reativada"
                            : "✨ criada"}
                          {entry.result.email_sent ? (
                            <span className="text-good/70">· email enviado</span>
                          ) : (
                            <span className="text-warn">
                              · falha email{entry.result.email_error ? `: ${entry.result.email_error}` : ""}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1.5 text-[11px] font-extrabold uppercase tracking-wider text-bad">
                          ❌ {entry.result.error}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-extrabold text-spark-ink uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-bad ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

void Plus;
