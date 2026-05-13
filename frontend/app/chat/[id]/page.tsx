"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Menu, X, Paperclip, Send, Sparkle } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { ConversationSidebar } from "@/components/layout/conversation-sidebar";
import { UserBubble } from "@/components/molecules/user-bubble";
import { AgentBubble } from "@/components/molecules/agent-bubble";
import { AgentCharacter } from "@/components/molecules/agent-character";
import { AGENTS, type AgentId } from "@/lib/agents";
import {
  useConversationStore,
  useConversationMessages,
  type ChatMessage,
} from "@/lib/conversation-store";

function ChatStream({
  agent,
  messages,
  streaming,
}: {
  agent: AgentId;
  messages: ChatMessage[];
  streaming: boolean;
}) {
  return (
    <>
      {messages.length === 0 && (
        <div className="px-4 py-6 flex flex-col items-center text-center">
          <AgentCharacter agent={agent} size={88} />
          <div className="mt-3 text-[15px] font-bold">{AGENTS[agent].label}</div>
          <div className="mt-1 text-[13px] text-spark-ink-50 max-w-[360px]">
            {AGENTS[agent].description}
          </div>
        </div>
      )}
      {messages.map((m) =>
        m.role === "user" ? (
          <UserBubble key={m.id}>{m.content}</UserBubble>
        ) : (
          <AgentBubble key={m.id} agent={agent}>
            {m.content || (streaming ? <span className="text-spark-ink-50">…</span> : "")}
          </AgentBubble>
        ),
      )}
    </>
  );
}

function ChatComposer({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = React.useState("");
  const send = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
  };
  return (
    <div className="px-3 pt-2 pb-[14px] border-t border-spark-hairline bg-white/95 backdrop-blur-md safe-bottom">
      <div className="flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-full bg-spark-surface-sunken border border-spark-hairline">
        <button type="button" aria-label="Anexar" className="text-spark-ink-50 shrink-0" disabled>
          <Paperclip size={20} strokeWidth={1.7} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={disabled ? "Aguarda a resposta…" : "Pergunta qualquer coisa…"}
          disabled={disabled}
          className="flex-1 bg-transparent text-[14px] text-spark-ink placeholder:text-spark-ink-50 outline-none disabled:opacity-60"
        />
        <button
          type="button"
          aria-label="Enviar"
          onClick={send}
          disabled={disabled || !text.trim()}
          className="w-9 h-9 rounded-full text-white flex items-center justify-center bg-brand-grad shrink-0 active:scale-95 transition-transform disabled:opacity-50"
        >
          <Send size={16} strokeWidth={1.7} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-center px-1 text-[11px] text-spark-ink-35">
        <span className="inline-flex items-center gap-1">
          <Sparkle size={11} strokeWidth={1.7} /> Gemini · respostas podem ter erro
        </span>
      </div>
    </div>
  );
}

function useChatSender(conversationId: string) {
  const { messages, appendLocal, updateLastLocal } = useConversationMessages(conversationId);
  const store = useConversationStore();
  const [streaming, setStreaming] = React.useState(false);

  const send = React.useCallback(
    async (text: string) => {
      if (streaming) return;
      appendLocal({ role: "user", content: text });
      appendLocal({ role: "assistant", content: "" });

      const conv = store.conversations.find((c) => c.id === conversationId);
      store.touchConversation(conversationId, {
        preview: text.slice(0, 200),
        messageCount: (conv?.messageCount ?? 0) + 1,
        title: conv && conv.title === "Nova conversa" ? text.slice(0, 60) : conv?.title,
      });

      setStreaming(true);
      try {
        const apiMessages = [...messages, { role: "user" as const, content: text }].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ conversation_id: conversationId, messages: apiMessages }),
        });

        if (!res.ok || !res.body) {
          const errMsg = await res.text().catch(() => `HTTP ${res.status}`);
          throw new Error(errMsg.slice(0, 200));
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          updateLastLocal({ content: acc });
        }
        updateLastLocal({ content: acc });
        store.touchConversation(conversationId, {
          preview: acc.slice(0, 200),
          messageCount: (conv?.messageCount ?? 0) + 2,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "erro desconhecido";
        updateLastLocal({ content: `⚠️ ${msg}` });
      } finally {
        setStreaming(false);
      }
    },
    [appendLocal, conversationId, messages, store, streaming, updateLastLocal],
  );

  return { messages, send, streaming };
}

function ChatMobile({
  conversationId,
  agent,
  title,
}: {
  conversationId: string;
  agent: AgentId;
  title: string;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { messages, send, streaming } = useChatSender(conversationId);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (drawerOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [drawerOpen]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <div className="pt-14 pl-2 pr-3 pb-2.5 flex items-center gap-1.5 border-b border-spark-hairline">
        <button
          onClick={() => router.push("/chat")}
          className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink"
        >
          <ArrowLeft size={20} strokeWidth={1.7} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold truncate">{title}</div>
          <div className="text-[11px] text-spark-ink-50 font-mono">{AGENTS[agent].label}</div>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink"
        >
          <Menu size={20} strokeWidth={1.7} />
        </button>
      </div>

      <div className="flex-1 overflow-auto pt-4 pb-2">
        <ChatStream agent={agent} messages={messages} streaming={streaming} />
        <div ref={bottomRef} />
      </div>

      <ChatComposer onSend={send} disabled={streaming} />

      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in"
          />
          <div className="fixed top-0 right-0 bottom-0 w-[300px] z-50 bg-spark-surface-elev border-l border-spark-hairline shadow-[0_0_40px_-10px_rgba(20,20,40,0.3)] flex flex-col animate-in slide-in-from-right">
            <div className="px-3 pt-4 pb-1 flex items-center justify-between">
              <div className="text-[13px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase">
                Conversas
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full text-spark-ink-50 flex items-center justify-center hover:text-spark-ink"
              >
                <X size={16} strokeWidth={1.7} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ConversationSidebar onSelectConversation={() => setDrawerOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ChatDesktop({
  conversationId,
  agent,
  title,
}: {
  conversationId: string;
  agent: AgentId;
  title: string;
}) {
  const { messages, send, streaming } = useChatSender(conversationId);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex min-h-0">
      <aside className="w-[280px] shrink-0 border-r border-spark-hairline">
        <ConversationSidebar />
      </aside>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-6 py-3.5 border-b border-spark-hairline flex items-center gap-2.5">
          <AgentCharacter agent={agent} size={36} />
          <div>
            <div className="text-[14px] font-bold">{title}</div>
            <div className="text-[11px] text-spark-ink-50 font-mono">{AGENTS[agent].label}</div>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-spark-ink hover:bg-spark-surface-sunken"
          >
            <MoreHorizontal size={18} strokeWidth={1.7} />
          </button>
        </div>

        <div className="flex-1 overflow-auto py-5">
          <div className="max-w-[760px] mx-auto px-4">
            <ChatStream agent={agent} messages={messages} streaming={streaming} />
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="max-w-[760px] w-full mx-auto px-4 pb-4">
          <ChatComposer onSend={send} disabled={streaming} />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const { conversations, loading } = useConversationStore();

  const conv = conversations.find((c) => c.id === id);

  React.useEffect(() => {
    if (!loading && !conv) {
      router.replace("/chat");
    }
  }, [loading, conv, router]);

  if (!conv) {
    return (
      <ResponsiveShell
        mobile={<div className="flex-1 flex items-center justify-center text-spark-ink-50 text-[14px]">Carregando…</div>}
        desktop={<div className="flex-1 flex items-center justify-center text-spark-ink-50 text-[14px]">Carregando…</div>}
      />
    );
  }

  return (
    <ResponsiveShell
      mobile={<ChatMobile conversationId={conv.id} agent={conv.agent} title={conv.title} />}
      desktop={<ChatDesktop conversationId={conv.id} agent={conv.agent} title={conv.title} />}
    />
  );
}
