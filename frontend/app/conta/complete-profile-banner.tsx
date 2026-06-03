"use client";

import * as React from "react";
import { Target, Trophy, ArrowDown, X } from "lucide-react";
import { SectionReveal } from "@/components/atoms/section-reveal";

/**
 * Banner exibido em /conta quando a aluna NAO cadastrou meta mensal
 * OU NAO ativou o ranking. Faz scroll suave pra secao correspondente
 * quando clica. Some no click em "X" via localStorage (volta se ela
 * cadastrar a meta/ativar ranking).
 */

const LS_KEY = "tts-complete-profile-dismissed-v1";

export function CompleteProfileBanner({
  metaCadastrada,
  rankingAtivado,
}: {
  metaCadastrada: boolean;
  rankingAtivado: boolean;
}) {
  const [dismissed, setDismissed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      setDismissed(window.localStorage.getItem(LS_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Se cadastrou os 2, nada a fazer
  if (metaCadastrada && rankingAtivado) return null;
  if (!mounted || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(LS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight piscando 2x
      el.classList.add("ring-2", "ring-spark-brand", "ring-offset-2");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-spark-brand", "ring-offset-2");
      }, 2000);
    }
  };

  return (
    <SectionReveal direction="down" durationMs={500}>
      <div className="relative p-5 lg:p-6 rounded-spark-2xl bg-brand-grad text-white shadow-hero overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/10 blur-3xl"
        />

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fechar"
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center transition-colors z-10"
        >
          <X size={12} strokeWidth={2.5} />
        </button>

        <div className="relative">
          <div className="text-[10.5px] font-extrabold uppercase tracking-widest opacity-90 mb-1">
            ✦ complete teu perfil
          </div>
          <div
            className="font-display lowercase leading-tight tracking-tight mb-2"
            style={{ fontSize: "clamp(1.25rem, 3vw, 1.625rem)" }}
          >
            falta pouco pra você competir no método.
          </div>
          <p className="text-[13px] leading-relaxed opacity-95 font-semibold mb-4">
            Mulheres que cadastram meta e entram no ranking aparecem MAIS na
            comunidade e recebem dicas extras da Yara no WhatsApp. Bora?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {!metaCadastrada && (
              <button
                type="button"
                onClick={() => scrollTo("meta-mensal-anchor")}
                className="group flex items-center gap-2.5 px-3.5 py-3 rounded-spark-lg bg-white/15 hover:bg-white/25 backdrop-blur transition-all duration-300 text-left"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Target size={15} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-extrabold tracking-tight">
                    Cadastrar meta mensal
                  </div>
                  <div className="text-[10.5px] opacity-85 font-semibold mt-0.5">
                    Pra acompanhar progresso
                  </div>
                </div>
                <ArrowDown
                  size={13}
                  strokeWidth={2.5}
                  className="opacity-70 group-hover:translate-y-0.5 transition-transform"
                />
              </button>
            )}

            {!rankingAtivado && (
              <button
                type="button"
                onClick={() => scrollTo("ranking-anchor")}
                className="group flex items-center gap-2.5 px-3.5 py-3 rounded-spark-lg bg-white/15 hover:bg-white/25 backdrop-blur transition-all duration-300 text-left"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Trophy size={15} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-extrabold tracking-tight">
                    Ativar ranking
                  </div>
                  <div className="text-[10.5px] opacity-85 font-semibold mt-0.5">
                    Aparecer entre as criadoras
                  </div>
                </div>
                <ArrowDown
                  size={13}
                  strokeWidth={2.5}
                  className="opacity-70 group-hover:translate-y-0.5 transition-transform"
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
