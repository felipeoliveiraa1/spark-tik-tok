"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { MobileHeader } from "@/components/layout/mobile-header";
import { AgentCharacter } from "@/components/molecules/agent-character";
import { AGENTS, VISIBLE_AGENTS, type AgentId } from "@/lib/agents";
import { useConversationStore } from "@/lib/conversation-store";

/**
 * Galeria de especialistas — ponto de entrada do chat.
 *
 * Substitui a antiga tela "Nova conversa" por uma vitrine onde a aluna
 * escolhe com qual dos 4 agentes quer começar. Ao clicar, criamos uma
 * conversation local e levamos pra /chat/[id].
 */

const SPECIALTIES: Record<AgentId, string[]> = {
  info: [
    "Sobe a foto ou link do produto",
    "Recebe ficha completa: dor, público, preço, concorrentes",
    "Cruza com tendências do mercado",
  ],
  viral: [
    "Top vídeos vendendo agora no BR + USA",
    "Receita estimada e hooks transcritos",
    "Filtros por nicho, país e período",
  ],
  script: [
    "10 hooks com gatilho cerebral identificado",
    "Tom brasileiro, humor da expert",
    "Variações: humor, curiosidade, FOMO",
  ],
  help: [
    "Regras do TikTok Shop BR",
    "Frete, comissão, conta de criador",
    "O que tá performando essa semana",
  ],
};

const TAGLINES: Record<AgentId, string> = {
  info: "A analista de produto",
  viral: "A caçadora de virais",
  script: "A roteirista de hooks",
  help: "A mentora TikTok Shop",
};

function GalleryBody() {
  const router = useRouter();
  const store = useConversationStore();
  const [creating, setCreating] = React.useState<AgentId | null>(null);

  const start = async (agent: AgentId) => {
    if (creating) return;
    setCreating(agent);
    try {
      // Fetch direto: o store local pode não estar populado ainda quando
      // a aluna clica rápido (race com /api/conversations). Sem esse fetch,
      // o filtro vinha vazio e a gente criava conversa nova todo clique.
      const res = await fetch("/api/conversations", { cache: "no-store" }).catch(
        () => null,
      );
      if (res?.ok) {
        const data = (await res.json()) as {
          conversations: Array<{ id: string; agent: AgentId; updated_at: string }>;
        };
        const existing = data.conversations
          .filter((c) => c.agent === agent)
          .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))[0];
        if (existing) {
          router.push(`/chat/${existing.id}`);
          return;
        }
      }
      const id = await store.createConversation({
        agent,
        title: `Conversa com ${AGENTS[agent].label}`,
      });
      router.push(`/chat/${id}`);
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto pb-10">
      <div className="px-4 lg:px-12 pt-5 lg:pt-10">
        {/* Hero só no desktop — mobile usa o header gradient como hero */}
        <div className="hidden lg:block">
          <div className="text-[13px] font-bold text-spark-brand tracking-[0.06em] uppercase">
            ✨ Especialistas Método TTS
          </div>
          <h1 className="mt-1.5 text-[42px] font-extrabold tracking-tight leading-[1.1]">
            Com quem você quer
            <br />
            falar agora? 💕
          </h1>
        </div>
        <p className="text-[14px] lg:text-[16px] text-spark-ink-70 max-w-[560px] lg:mt-2.5 leading-relaxed">
          Cada especialista é treinada pra uma parte do funil. Escolhe uma — as conversas ficam salvas e organizadas em pastinhas. 💅
        </p>
      </div>

      {/* Cards de especialistas */}
      <div className="mt-5 lg:mt-8 px-4 lg:px-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {VISIBLE_AGENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => start(a.id)}
            className="text-left rounded-3xl overflow-hidden relative active:scale-[0.99] transition-all border shadow-[0_8px_24px_-16px_rgba(20,20,40,0.18)] hover:shadow-[0_18px_40px_-22px_rgba(20,20,40,0.28)]"
            style={{
              background: `linear-gradient(135deg, ${a.bg} 0%, oklch(0.98 0.01 0) 100%)`,
              borderColor: a.bg,
            }}
          >
            {/* Decorative blob no canto */}
            <div
              aria-hidden
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-50 blur-2xl pointer-events-none"
              style={{ background: a.fg }}
            />

            <div className="relative p-4 flex items-center gap-4">
              <div
                className="shrink-0 rounded-2xl flex items-center justify-center"
                style={{
                  width: 96,
                  height: 96,
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <AgentCharacter agent={a.id} size={88} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: a.fg }}
                >
                  {TAGLINES[a.id]}
                </div>
                <div className="mt-0.5 text-[20px] font-extrabold tracking-tight leading-tight text-spark-ink">
                  {a.label}
                </div>
                <div className="mt-1 text-[12.5px] text-spark-ink-70 leading-snug line-clamp-2">
                  {a.description}
                </div>
              </div>
            </div>

            <div className="relative px-4 pb-4">
              <ul className="flex flex-col gap-1">
                {SPECIALTIES[a.id].map((sp) => (
                  <li
                    key={sp}
                    className="flex gap-2 text-[12.5px] text-spark-ink-70 leading-snug"
                  >
                    <span style={{ color: a.fg }} className="font-bold shrink-0">
                      ·
                    </span>
                    {sp}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="relative px-4 py-3.5 flex items-center justify-between text-[13px] font-extrabold text-white"
              style={{
                background: `linear-gradient(90deg, ${a.fg} 0%, ${a.fg} 100%)`,
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                ✨ Conversar
              </span>
              <ArrowRight size={16} strokeWidth={2.2} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function NewChatMobile() {
  return (
    <>
      <MobileHeader title="Especialistas ✨" back={{ href: "/" }} />
      <GalleryBody />
    </>
  );
}

function NewChatDesktop() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 lg:px-12 py-3.5 border-b border-spark-hairline flex items-center gap-2.5">
        <SparkMark size={32} />
        <div className="text-[14px] font-bold">Galeria de especialistas</div>
      </div>
      <GalleryBody />
    </div>
  );
}

export default function NewChatPage() {
  return <ResponsiveShell mobile={<NewChatMobile />} desktop={<NewChatDesktop />} active="chat" />;
}
