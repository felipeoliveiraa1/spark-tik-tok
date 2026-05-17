"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Menu, X, Paperclip, Send, Sparkle, ImagePlus, AlertCircle } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { ConversationSidebar } from "@/components/layout/conversation-sidebar";
import { LoadingSplash } from "@/components/atoms/loading-splash";
import { UserBubble } from "@/components/molecules/user-bubble";
import { AgentBubble } from "@/components/molecules/agent-bubble";
import { AgentCharacter } from "@/components/molecules/agent-character";
import { MentionPicker, type MentionItem } from "@/components/molecules/mention-picker";

export type ChatMention = { kind: "product" | "viral"; id: string; label: string };
import { AGENTS, type AgentId } from "@/lib/agents";
import {
  useConversationStore,
  useConversationMessages,
  type ChatMessage,
} from "@/lib/conversation-store";

const STATUS_MESSAGES: Record<AgentId, string[]> = {
  info: [
    "Olhando o produto…",
    "Buscando preço atual no BR…",
    "Identificando concorrentes…",
    "Cruzando reviews e regulamentação…",
    "Montando a ficha…",
  ],
  viral: [
    "Acessando nossa base de virais…",
    "Garimpando os top da semana…",
    "Coletando métricas (views, GMV)…",
    "Filtrando os melhores pra você…",
    "Quase lá, organizando os cards…",
  ],
  script: [
    "Pensando nos ganchos…",
    "Aplicando neurociência…",
    "Calibrando humor brasileiro…",
    "Testando gatilhos cerebrais…",
    "Polindo a tabela final…",
  ],
  help: [
    "Consultando o painel…",
    "Confirmando a regra atual…",
    "Buscando boas práticas…",
    "Organizando a resposta…",
  ],
};

function TypingStatus({ agent }: { agent: AgentId }) {
  const messages = STATUS_MESSAGES[agent];
  const [idx, setIdx] = React.useState(0);
  const color = AGENTS[agent].fg;

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % messages.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="inline-flex items-center gap-2.5 py-1.5" aria-live="polite">
      <span className="inline-flex items-center gap-1.5" aria-label="Pensando">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full animate-typing-dot"
            style={{ background: color, animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      <span
        key={idx}
        className="text-[13.5px] text-spark-ink-50 italic animate-in fade-in slide-in-from-bottom-1"
      >
        {messages[idx]}
      </span>
    </div>
  );
}

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
          <UserBubble key={m.id} attachments={m.attachments}>
            {m.content}
          </UserBubble>
        ) : (
          <AgentBubble key={m.id} agent={agent}>
            {m.content || (streaming ? <TypingStatus agent={agent} /> : "")}
          </AgentBubble>
        ),
      )}
    </>
  );
}

type PendingAttachment = { url: string; mime: string };

function ChatComposer({
  onSend,
  disabled,
}: {
  onSend: (text: string, attachments: PendingAttachment[], mentions: ChatMention[]) => void;
  disabled: boolean;
}) {
  const [text, setText] = React.useState("");
  const [attachments, setAttachments] = React.useState<PendingAttachment[]>([]);
  // mentions ficam em state paralelo. NÃO modificamos o texto digitado —
  // o input mostra "@Nome" puro, e a lista de mentions é enviada como metadata.
  const [mentions, setMentions] = React.useState<ChatMention[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textRef = React.useRef<HTMLInputElement>(null);

  // Mentions: ativa popup ao detectar @ no input
  const [mentionRange, setMentionRange] = React.useState<{ start: number; end: number } | null>(
    null,
  );
  const mentionQuery = mentionRange ? text.slice(mentionRange.start + 1, mentionRange.end) : "";

  const onTextChange = (val: string, caret: number) => {
    setText(val);
    // Quando o texto encurta (ex: deletar), drop mentions órfãs (cujo label não
    // aparece mais como @label no texto). Tolerante a edição parcial.
    setMentions((prev) =>
      prev.filter((m) => val.includes(`@${m.label.split(/\s+/)[0]}`)),
    );
    // detecta @ aberto
    const before = val.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at < 0) {
      setMentionRange(null);
      return;
    }
    const between = before.slice(at + 1);
    if (/\s/.test(between) || between.length > 30) {
      setMentionRange(null);
      return;
    }
    setMentionRange({ start: at, end: caret });
  };

  const insertMention = (item: MentionItem) => {
    if (!mentionRange) return;
    const before = text.slice(0, mentionRange.start);
    const after = text.slice(mentionRange.end);
    const label = item.title;
    const visible = `@${label}`;
    const next = `${before}${visible} ${after}`;
    setText(next);
    setMentions((prev) => {
      // evita duplicar
      const filtered = prev.filter((m) => !(m.kind === item.kind && m.id === item.id));
      return [...filtered, { kind: item.kind, id: item.id, label }];
    });
    setMentionRange(null);
    requestAnimationFrame(() => {
      textRef.current?.focus();
      const pos = (before + visible + " ").length;
      textRef.current?.setSelectionRange(pos, pos);
    });
  };

  const canSend = !disabled && !uploading && (text.trim().length > 0 || attachments.length > 0);

  const send = () => {
    if (!canSend) return;
    onSend(text.trim(), attachments, mentions);
    setText("");
    setAttachments([]);
    setMentions([]);
    setMentionRange(null);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { url: string; mime: string };
      setAttachments((prev) => [...prev, { url: data.url, mime: data.mime }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "erro no upload";
      setUploadError(humanizeUploadError(msg));
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="relative px-3 pt-2 pb-[14px] border-t border-spark-hairline bg-white/95 backdrop-blur-md safe-bottom">
      {mentionRange && (
        <MentionPicker
          query={mentionQuery}
          onPick={insertMention}
          onClose={() => setMentionRange(null)}
        />
      )}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 px-1">
          {attachments.map((a, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt="anexo"
                className="w-14 h-14 rounded-xl object-cover border border-spark-hairline"
              />
              <button
                type="button"
                aria-label="Remover anexo"
                onClick={() => removeAttachment(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-spark-ink text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-full bg-spark-surface-sunken border border-spark-hairline">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={onFileChange}
          className="hidden"
        />
        <button
          type="button"
          aria-label="Anexar foto"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="text-spark-ink-50 hover:text-spark-ink shrink-0 disabled:opacity-50"
        >
          {uploading ? (
            <Sparkle size={20} strokeWidth={1.7} className="animate-pulse text-spark-brand" />
          ) : (
            <ImagePlus size={20} strokeWidth={1.7} />
          )}
        </button>
        <input
          ref={textRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
          onKeyDown={(e) => {
            // Picker aberto: Enter/setas ficam por conta do window listener do picker
            if (e.key === "Enter" && !e.shiftKey && !mentionRange) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={
            uploading
              ? "Subindo foto…"
              : disabled
                ? "Aguarda a resposta…"
                : attachments.length > 0
                  ? "Algo a dizer? (opcional)"
                  : "Pergunta qualquer coisa… (use @ pra mencionar produto ou viral)"
          }
          disabled={disabled}
          className="flex-1 bg-transparent text-[14px] text-spark-ink placeholder:text-spark-ink-50 outline-none disabled:opacity-60"
        />
        <button
          type="button"
          aria-label="Enviar"
          onClick={send}
          disabled={!canSend}
          className="w-9 h-9 rounded-full text-white flex items-center justify-center bg-brand-grad shrink-0 active:scale-95 transition-transform disabled:opacity-50"
        >
          <Send size={16} strokeWidth={1.7} />
        </button>
      </div>

      {uploadError ? (
        <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-bad">
          <AlertCircle size={11} strokeWidth={2} />
          {uploadError}
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-center px-1 text-[11px] text-spark-ink-35">
          <span className="inline-flex items-center gap-1">
            <Sparkle size={11} strokeWidth={1.7} /> Gemini · respostas podem ter erro
          </span>
        </div>
      )}
    </div>
  );
}

function humanizeUploadError(raw: string): string {
  if (raw === "too_large") return "Imagem grande demais (máx 8MB)";
  if (raw === "invalid_type") return "Formato não suportado — use JPG, PNG ou WebP";
  if (raw === "no_file") return "Selecione uma imagem";
  if (raw === "unauthorized") return "Você precisa estar logada";
  return raw;
}

function useChatSender(conversationId: string) {
  const { messages, appendLocal, updateLastLocal } = useConversationMessages(conversationId);
  const store = useConversationStore();
  const [streaming, setStreaming] = React.useState(false);

  const send = React.useCallback(
    async (text: string, attachments: PendingAttachment[] = [], mentions: ChatMention[] = []) => {
      if (streaming) return;
      const trimmed = text.trim();
      if (!trimmed && attachments.length === 0) return;

      appendLocal({
        role: "user",
        content: trimmed,
        attachments: attachments.length > 0 ? attachments : null,
      });
      appendLocal({ role: "assistant", content: "" });

      const conv = store.conversations.find((c) => c.id === conversationId);
      const previewSrc =
        trimmed || (attachments.length > 0 ? "📷 Foto enviada" : "");
      store.touchConversation(conversationId, {
        preview: previewSrc.slice(0, 200),
        messageCount: (conv?.messageCount ?? 0) + 1,
        title:
          conv && conv.title === "Nova conversa"
            ? (trimmed || "Análise de foto").slice(0, 60)
            : conv?.title,
      });

      setStreaming(true);
      try {
        const apiMessages = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: trimmed || "(foto anexada — analisa)" },
        ];

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            messages: apiMessages,
            attachments,
            mentions,
          }),
        });

        if (!res.ok || !res.body) {
          const errMsg = await res.text().catch(() => `HTTP ${res.status}`);
          throw new Error(errMsg.slice(0, 300));
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

        // Fallback se o stream terminou vazio (modelo rodou tools sem retornar texto)
        if (!acc.trim()) {
          acc =
            "_Hmm, fiquei sem resposta dessa vez. Tenta reformular a pergunta ou manda de novo — eu te respondo._";
          updateLastLocal({ content: acc });
        }

        store.touchConversation(conversationId, {
          preview: acc.slice(0, 200),
          messageCount: (conv?.messageCount ?? 0) + 2,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "erro desconhecido";
        updateLastLocal({ content: `⚠️ Erro: ${msg}` });
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
        mobile={<LoadingSplash message="Abrindo conversa" />}
        desktop={<LoadingSplash message="Abrindo conversa" size="lg" />}
        customSidebar
      />
    );
  }

  return (
    <ResponsiveShell
      mobile={<ChatMobile conversationId={conv.id} agent={conv.agent} title={conv.title} />}
      desktop={<ChatDesktop conversationId={conv.id} agent={conv.agent} title={conv.title} />}
      customSidebar
    />
  );
}
