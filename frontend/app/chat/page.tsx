"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MoreHorizontal, Sparkle, Clock } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SButton } from "@/components/atoms/s-button";
import { AgentCharacter } from "@/components/molecules/agent-character";
import { AGENTS, AGENT_LIST, type AgentId } from "@/lib/agents";
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

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function GalleryBody() {
  const router = useRouter();
  const store = useConversationStore();
  const [creating, setCreating] = React.useState<AgentId | null>(null);
  const recent = [...store.conversations]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 4);

  const start = async (agent: AgentId) => {
    if (creating) return;
    setCreating(agent);
    try {
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
      <div className="px-4 lg:px-12 pt-6 lg:pt-10">
        <div className="text-[12px] lg:text-[13px] font-bold text-spark-brand tracking-[0.06em] uppercase">
          Especialistas Spark
        </div>
        <h1 className="mt-1.5 text-[28px] lg:text-[42px] font-extrabold tracking-[-0.025em] leading-[1.1]">
          Com quem você quer
          <br />
          falar agora?
        </h1>
        <p className="mt-2.5 text-[14px] lg:text-[16px] text-spark-ink-50 max-w-[560px]">
          Cada especialista é treinado pra uma parte do funil. Escolhe um pra começar — as conversas
          ficam salvas e organizadas em pastas.
        </p>
      </div>

      {/* 4 cards de especialistas */}
      <div className="mt-6 lg:mt-8 px-4 lg:px-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {AGENT_LIST.map((a) => (
          <button
            key={a.id}
            onClick={() => start(a.id)}
            className="text-left rounded-[22px] bg-spark-surface border border-spark-hairline overflow-hidden hover:border-spark-ink/30 transition-all hover:shadow-[0_18px_40px_-22px_rgba(20,20,40,0.25)] active:scale-[0.99]"
          >
            <div className="p-5 pb-3 flex items-start gap-4">
              <AgentCharacter agent={a.id} size={84} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-spark-ink-50 uppercase tracking-[0.08em]">
                  {TAGLINES[a.id]}
                </div>
                <div className="mt-1 text-[20px] font-extrabold tracking-[-0.015em] leading-tight">
                  {a.label}
                </div>
                <div className="mt-1 text-[12.5px] text-spark-ink-70 leading-snug">
                  {a.description}
                </div>
              </div>
            </div>
            <div className="px-5 pb-4">
              <ul className="flex flex-col gap-1">
                {SPECIALTIES[a.id].map((sp) => (
                  <li key={sp} className="flex gap-2 text-[12.5px] text-spark-ink-70 leading-snug">
                    <span style={{ color: a.fg }} className="font-bold">·</span>
                    {sp}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="px-5 py-3.5 border-t border-spark-hairline flex items-center justify-between text-[13px] font-bold"
              style={{ color: a.fg }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkle size={14} strokeWidth={1.7} /> Conversar
              </span>
              <ArrowRight size={16} strokeWidth={1.7} />
            </div>
          </button>
        ))}
      </div>

      {/* Conversas recentes */}
      {recent.length > 0 && (
        <div className="mt-10 px-4 lg:px-12">
          <div className="text-[12px] font-bold text-spark-ink-50 tracking-[0.08em] uppercase mb-3">
            Continue de onde parou
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
            {recent.map((c) => {
              const a = AGENTS[c.agent];
              return (
                <Link
                  key={c.id}
                  href={`/chat/${c.id}`}
                  className="rounded-2xl bg-spark-surface border border-spark-hairline p-3.5 hover:border-spark-ink/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <AgentCharacter agent={c.agent} size={42} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-bold truncate">{c.title}</div>
                      <div className="text-[11px] text-spark-ink-50 mt-0.5 inline-flex items-center gap-1">
                        <Clock size={10} strokeWidth={2} />
                        {timeAgo(c.updatedAt)} · {c.messageCount} msgs
                      </div>
                    </div>
                  </div>
                  {c.preview && (
                    <div className="mt-2 text-[12px] text-spark-ink-70 line-clamp-2 leading-snug">
                      {c.preview}
                    </div>
                  )}
                  <div
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold"
                    style={{ color: a.fg }}
                  >
                    {a.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NewChatMobile() {
  return (
    <>
      <div className="pt-14 px-4 pb-2 flex items-center justify-between">
        <Link
          href="/"
          className="w-9 h-9 rounded-full text-spark-ink flex items-center justify-center"
        >
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold text-spark-ink-50">Especialistas</div>
        <button className="w-9 h-9 rounded-full text-spark-ink flex items-center justify-center">
          <MoreHorizontal size={18} strokeWidth={1.7} />
        </button>
      </div>
      <GalleryBody />
    </>
  );
}

function NewChatDesktop() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 lg:px-12 py-3.5 border-b border-spark-hairline flex items-center gap-2.5">
        <SparkMark size={22} />
        <div className="text-[14px] font-bold">Galeria de especialistas</div>
      </div>
      <GalleryBody />
    </div>
  );
}

export default function NewChatPage() {
  return <ResponsiveShell mobile={<NewChatMobile />} desktop={<NewChatDesktop />} active="chat" />;
}
