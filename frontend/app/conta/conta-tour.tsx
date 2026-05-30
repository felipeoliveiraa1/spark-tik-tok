"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { TutorialOverlay } from "@/components/molecules/tutorial-overlay";
import { type TutorialStep } from "@/lib/tutorial";

/**
 * ContaTour — wrapper client component pro tour da tela /conta.
 *
 * /conta eh server component, entao o tour fica isolado aqui pra ser
 * marcado como "use client". Renderiza o botao flutuante top-right e o
 * TutorialOverlay com os steps do passo a passo da conta.
 */
function buildContaSteps(desktop: boolean): TutorialStep[] {
  const navStep: TutorialStep = desktop
    ? {
        id: "nav",
        target: "desktop-nav",
        title: "Sua navegação principal",
        description:
          "Sidebar lateral com tudo: agentes, produtos, scripts, rotina, educação, ranking, news e conta.",
        padding: 8,
        radius: 32,
      }
    : {
        id: "nav",
        target: "mobile-nav",
        title: "Sua navegação principal",
        description:
          "Barra fixa com 4 atalhos rápidos. O botão Mais abre a grade completa.",
        padding: 6,
        radius: 32,
      };

  return [
    {
      id: "welcome",
      title: "bem-vinda à sua conta!",
      description:
        "Aqui você ajusta seu perfil, controla seu plano, registra faturamento e decide se entra ou não no ranking. Em 30s te mostro tudo.",
    },
    {
      id: "avatar",
      target: "conta-avatar",
      title: "Sua identidade no app",
      description:
        "Foto, nome, email e nichos. Clica na foto pra trocar — fica visível pras outras criadoras se você entrar no ranking. Nichos ajudam os agentes a entender quem é você.",
    },
    {
      id: "stats",
      target: "conta-stats",
      title: "Seus números do método",
      description:
        "Total de produtos cadastrados, scripts salvos e aulas concluídas. É o resumo objetivo do quanto você já construiu por aqui.",
    },
    {
      id: "plano",
      target: "conta-plano",
      title: "Seu plano",
      description:
        "Status atual (ativa, atrasada, cancelada), próxima cobrança e botão pra abrir o portal do Kiwify e gerenciar cartão, cancelamento ou trocar de plano.",
    },
    {
      id: "perfil",
      target: "conta-perfil",
      title: "Edita teu perfil",
      description:
        "Nome, nichos, bio, Instagram, TikTok e cidade. Quanto mais completo, mais os agentes conseguem te ajudar e mais legal teu card fica pras outras criadoras.",
    },
    {
      id: "revenue",
      target: "conta-revenue",
      title: "Faturamento + ranking",
      description:
        "Registra teu faturamento mensal aqui e decide se quer aparecer no ranking de criadoras. Sem ativar o opt-in, ninguém vê teus números.",
    },
    {
      id: "logout",
      target: "conta-logout",
      title: "Sair da conta",
      description:
        "Botão pra deslogar. Tua senha pode ser alterada na seção logo acima. Se esqueceu, faz logout e usa 'esqueci senha' no login.",
    },
    navStep,
    {
      id: "done",
      title: "pronto! teu cantinho 💕",
      description:
        "Mantém o perfil atualizado e o faturamento em dia. Pra refazer o tour, clica no ✨ Tour no canto superior.",
    },
  ];
}

export function ContaTour() {
  const [desktopMode, setDesktopMode] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktopMode(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDesktopMode(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const steps = React.useMemo(() => buildContaSteps(desktopMode), [desktopMode]);

  const [tourOpen, setTourOpen] = React.useState(false);
  const reopenTour = React.useCallback(() => setTourOpen(true), []);

  return (
    <>
      {/* Botao flutuante top-right (igual outras telas, em fixed pra evitar
          mexer no JSX server-side do hero) */}
      <button
        type="button"
        onClick={reopenTour}
        className="fixed z-40 group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass border border-spark-hairline text-spark-ink-70 hover:text-spark-brand-deep hover:bg-spark-brand-soft hover:-translate-y-0.5 text-[11.5px] font-extrabold uppercase tracking-widest shadow-rest transition-all duration-300 ease-premium"
        style={{
          top: "calc(env(safe-area-inset-top) + 16px)",
          right: "16px",
        }}
        aria-label="Refazer tour da conta"
      >
        <HelpCircle
          size={13}
          strokeWidth={2.5}
          className="transition-transform duration-300 group-hover:scale-110"
        />
        <span className="hidden sm:inline">Tour</span>
      </button>

      <TutorialOverlay
        steps={steps}
        storageKey="conta"
        autoStart={!tourOpen}
        open={tourOpen || undefined}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}
