"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowUpRight } from "lucide-react";
import { useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type Props = {
  initialOptIn: boolean;
};

export function RankingOptInCard({ initialOptIn }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [optIn, setOptIn] = React.useState(initialOptIn);
  const [saving, setSaving] = React.useState(false);

  const toggle = async () => {
    const next = !optIn;
    setOptIn(next); // optimistic
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ranking_opt_in: next }),
      });
      if (res.ok) {
        toast.success(next ? "Você tá no ranking! 🏆" : "Você saiu do ranking");
        router.refresh();
      } else {
        setOptIn(!next);
        toast.error("Não consegui salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
      <div className="text-eyebrow text-spark-brand flex items-center gap-1.5 mb-3">
        <Trophy size={11} strokeWidth={2.5} />
        ✦ ranking
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-extrabold text-spark-ink leading-tight">
            Aparecer no ranking de criadoras
          </div>
          <p className="mt-1.5 text-[12.5px] text-spark-ink-70 leading-relaxed">
            Seu nome, foto e cidade ficam visíveis pra outras alunas. Score é calculado por
            <strong> GMV + consistência</strong> da rotina.
          </p>
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={toggle}
          disabled={saving}
          aria-pressed={optIn}
          aria-label={optIn ? "Sair do ranking" : "Entrar no ranking"}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-all duration-300 ease-premium",
            optIn ? "bg-brand-grad shadow-lift-brand" : "bg-spark-surface-sunken",
            saving && "opacity-60",
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-white shadow-lift transition-all duration-300 ease-premium absolute top-1",
              optIn ? "left-6" : "left-1",
            )}
          />
        </button>
      </div>

      {optIn && (
        <Link
          href="/ranking"
          className="mt-4 group inline-flex w-full items-center justify-between gap-2 px-4 py-2.5 rounded-full glass border border-spark-hairline text-spark-ink text-[12.5px] font-extrabold hover:bg-spark-brand-soft hover:text-spark-brand-deep hover:-translate-y-0.5 transition-all duration-300 ease-premium shadow-rest"
        >
          <span className="inline-flex items-center gap-1.5">
            <Trophy size={12} strokeWidth={2.5} />
            Ver minha posição no ranking
          </span>
          <ArrowUpRight
            size={13}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
