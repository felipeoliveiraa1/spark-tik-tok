"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react";
import { ProofUploader, type UploadResult } from "@/components/journey/ProofUploader";
import { BadgeUnlockModal, type AwardedBadge } from "@/components/journey/BadgeUnlockModal";
import { XPDelta } from "@/components/journey/XPDelta";
import { trackJourneyEvent } from "@/lib/journey/track";

export default function ProvaJornadaPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [result, setResult] = React.useState<UploadResult | null>(null);
  const [showXp, setShowXp] = React.useState<number | null>(null);
  const [awardedBadges, setAwardedBadges] = React.useState<AwardedBadge[]>([]);

  const handleResult = (r: UploadResult) => {
    setResult(r);
    if (r.ok) {
      trackJourneyEvent("proof_uploaded", {
        journey_slug: params.slug as string,
        status: r.status,
        sales_value: r.sales_value,
      });
    }
    if (r.ok && r.status === "auto_approved") {
      setShowXp(50);
    }
  };

  return (
    <div className="min-h-dvh hero-radial pb-20">
      <header className="px-6 pt-6 max-w-[640px] mx-auto">
        <Link
          href={`/jornadas/${params.slug}`}
          className="text-[12.5px] font-extrabold text-spark-ink-70 hover:text-spark-ink inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={13} /> Voltar
        </Link>
      </header>

      <div className="px-6 max-w-[640px] mx-auto mt-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎯</div>
          <h1 className="font-display text-[28px] md:text-[34px] text-spark-ink leading-tight">
            Hora da prova!
          </h1>
          <p className="text-[14px] text-spark-ink-70 mt-2 max-w-[44ch] mx-auto">
            Manda um print do seu TikTok Shop mostrando vendas reais. A gente
            valida e te libera pra próxima jornada.
          </p>
        </div>

        {!result && (
          <>
            <ProofUploader journeySlug={params.slug as string} onResult={handleResult} />
            <div className="mt-6 rounded-spark-lg bg-spark-surface-sunken/40 border border-spark-hairline p-4 text-[12.5px] text-spark-ink-70 leading-relaxed">
              <div className="font-extrabold text-spark-ink mb-1">💡 O que vale como prova:</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Print do TikTok Shop ou TikTok Seller Center</li>
                <li>Tem que mostrar valor de venda (em reais)</li>
                <li>Sua conta — não vale screenshot de outra pessoa</li>
                <li>Se o sistema não detectar vendas claramente, um humano revisa em 24h</li>
              </ul>
            </div>
          </>
        )}

        {result?.ok && result.status === "auto_approved" && (
          <div className="rounded-spark-xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center">
            <CheckCircle2 size={48} className="text-emerald-600 mx-auto mb-3" />
            <h2 className="font-display text-[26px] text-spark-ink">Aprovada! 🎉</h2>
            <p className="text-[14px] text-spark-ink-70 mt-2">
              Sistema detectou suas vendas e validou na hora.
              {result.sales_value && (
                <span className="block mt-1 font-extrabold text-spark-brand-deep">
                  R$ {result.sales_value.toFixed(2).replace(".", ",")} detectados
                </span>
              )}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[12.5px] font-extrabold">
              <Sparkles size={12} />
              +50 XP
            </div>
            <Link
              href={`/jornadas`}
              className="mt-6 block w-full px-5 py-2.5 rounded-full bg-brand-grad text-white text-[14px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all"
            >
              Ver minha evolução →
            </Link>
          </div>
        )}

        {result?.ok && result.status === "pending" && (
          <div className="rounded-spark-xl border-2 border-yellow-300 bg-yellow-50 p-6 text-center">
            <Clock size={48} className="text-yellow-600 mx-auto mb-3" />
            <h2 className="font-display text-[26px] text-spark-ink">Em análise</h2>
            <p className="text-[14px] text-spark-ink-70 mt-2">
              A gente vai revisar manualmente em até 24h. Você recebe notificação
              quando estiver pronto.
            </p>
            <Link
              href={`/jornadas`}
              className="mt-6 inline-block px-5 py-2.5 rounded-full bg-brand-grad text-white text-[14px] font-extrabold shadow-lift-brand hover:-translate-y-0.5 transition-all"
            >
              Voltar pras jornadas
            </Link>
          </div>
        )}

        {result && !result.ok && (
          <div className="rounded-spark-xl border-2 border-red-300 bg-red-50 p-6 text-center">
            <AlertCircle size={32} className="text-red-600 mx-auto mb-2" />
            <h2 className="font-display text-[22px] text-spark-ink">Ops</h2>
            <p className="text-[13px] text-spark-ink-70 mt-1">{result.error}</p>
            <button
              onClick={() => setResult(null)}
              className="mt-4 px-5 py-2 rounded-full bg-brand-grad text-white text-[13px] font-extrabold"
            >
              Tentar de novo
            </button>
          </div>
        )}
      </div>

      {showXp !== null && (
        <XPDelta amount={showXp} onDone={() => setShowXp(null)} />
      )}
      {awardedBadges.length > 0 && (
        <BadgeUnlockModal
          badges={awardedBadges}
          onClose={() => {
            setAwardedBadges([]);
            router.push("/jornadas");
          }}
        />
      )}
    </div>
  );
}
