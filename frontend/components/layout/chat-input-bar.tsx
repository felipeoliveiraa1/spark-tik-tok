"use client";

import * as React from "react";
import { Paperclip, Send, Sparkle } from "lucide-react";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  onSend?: (text: string) => void;
};

export function ChatInputBar({
  placeholder = "Pergunta qualquer coisa…",
  defaultValue = "",
  onSend,
}: Props) {
  const [text, setText] = React.useState(defaultValue);
  const send = () => {
    if (!text.trim()) return;
    onSend?.(text.trim());
    setText("");
  };

  return (
    <div className="px-3 pt-2 pb-[14px] border-t border-spark-hairline bg-white/95 backdrop-blur-md safe-bottom">
      <div className="flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-full bg-spark-surface-sunken border border-spark-hairline">
        <button type="button" aria-label="Anexar" className="text-spark-ink-50 shrink-0">
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
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[14px] text-spark-ink placeholder:text-spark-ink-50 outline-none"
        />
        <button
          type="button"
          aria-label="Enviar"
          onClick={send}
          className="w-9 h-9 rounded-full text-white flex items-center justify-center bg-brand-grad shrink-0 active:scale-95 transition-transform"
        >
          <Send size={16} strokeWidth={1.7} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-spark-ink-35">
        <span className="inline-flex items-center gap-1">
          <Sparkle size={11} strokeWidth={1.7} /> Auto · IA escolhe agente
        </span>
        <span className="font-mono">@ pra escolher</span>
      </div>
    </div>
  );
}
