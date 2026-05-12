import Link from "next/link";
import { ArrowLeft, ArrowRight, MoreHorizontal } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { AgentTile } from "@/components/atoms/agent-tile";
import { ChatInputBar } from "@/components/layout/chat-input-bar";
import { type AgentId } from "@/lib/agents";

const options: { agent: AgentId; t: string; s: string; href: string }[] = [
  { agent: "info", t: "Analisar um produto", s: "envia foto + link", href: "/chat/new-info" },
  { agent: "viral", t: "Ver o que tá viral", s: "top da semana", href: "/chat/new-viral" },
  { agent: "script", t: "Criar scripts", s: "10 hooks com hook + CTA", href: "/chat/new-script" },
  { agent: "help", t: "Tirar uma dúvida", s: "sobre TikTok Shop", href: "/chat/new-help" },
];

function NewChatBody({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center ${desktop ? "py-16" : "px-6"}`}>
      <div className={`w-[72px] h-[72px] rounded-[22px] flex items-center justify-center mb-[18px] bg-brand-grad-soft`}>
        <SparkMark size={36} />
      </div>
      <div className={`font-bold tracking-[-0.015em] text-center ${desktop ? "text-[28px]" : "text-[20px]"}`}>
        Como posso te ajudar hoje?
      </div>
      <div className="mt-1.5 text-[13px] text-spark-ink-50 text-center">
        Escolhe um caminho ou pergunta direto.
      </div>

      <div className={`mt-[22px] w-full flex flex-col gap-2 ${desktop ? "max-w-[520px]" : ""}`}>
        {options.map((o) => (
          <Link
            key={o.agent}
            href={o.href}
            className="px-3.5 py-3 rounded-[14px] bg-spark-surface border border-spark-hairline flex items-center gap-3 hover:border-spark-ink/30 transition-colors"
          >
            <AgentTile agent={o.agent} size={32} />
            <div className="flex-1">
              <div className="text-[14px] font-bold">{o.t}</div>
              <div className="text-[11.5px] text-spark-ink-50">{o.s}</div>
            </div>
            <ArrowRight size={16} strokeWidth={1.7} className="text-spark-ink-35" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function NewChatMobile() {
  return (
    <>
      <div className="pt-14 px-4 pb-2 flex items-center justify-between">
        <Link href="/" className="w-9 h-9 rounded-full text-spark-ink flex items-center justify-center">
          <ArrowLeft size={18} strokeWidth={1.7} />
        </Link>
        <div className="text-[13px] font-bold text-spark-ink-50">Nova conversa</div>
        <button className="w-9 h-9 rounded-full text-spark-ink flex items-center justify-center">
          <MoreHorizontal size={18} strokeWidth={1.7} />
        </button>
      </div>
      <NewChatBody />
      <ChatInputBar />
    </>
  );
}

function NewChatDesktop() {
  return (
    <>
      <div className="px-6 py-3.5 border-b border-spark-hairline flex items-center gap-2.5">
        <div className="text-[14px] font-bold">Nova conversa</div>
        <div className="flex-1" />
        <button className="w-9 h-9 rounded-full text-spark-ink flex items-center justify-center hover:bg-spark-surface-sunken">
          <MoreHorizontal size={18} strokeWidth={1.7} />
        </button>
      </div>
      <NewChatBody desktop />
      <div className="max-w-[760px] w-full mx-auto px-4">
        <ChatInputBar />
      </div>
    </>
  );
}

export default function NewChatPage() {
  return <ResponsiveShell mobile={<NewChatMobile />} desktop={<NewChatDesktop />} active="chat" />;
}
