"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renderiza o conteúdo (markdown) que o agente devolve com:
 * - links clicáveis abrindo em nova aba
 * - negrito, itálico
 * - listas (- ou 1.)
 * - tabelas (| col |) via remark-gfm — usado pelo agente Scripts
 * - code inline
 */
export function MessageContent({ children }: { children: string }) {
  if (!children) return null;
  return (
    <div className="message-md text-[14.5px] leading-[1.55] tracking-[-0.005em]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-spark-brand font-semibold underline decoration-spark-brand/40 underline-offset-2 hover:decoration-spark-brand"
            >
              {children}
            </a>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 last:mb-0 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 last:mb-0 ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-extrabold text-spark-ink">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-spark-surface-sunken px-1 py-0.5 rounded font-mono text-[12.5px] text-spark-ink-70">
              {children}
            </code>
          ),
          h1: ({ children }) => <h3 className="font-extrabold text-[16px] mt-3 mb-1.5">{children}</h3>,
          h2: ({ children }) => <h3 className="font-extrabold text-[15px] mt-3 mb-1.5">{children}</h3>,
          h3: ({ children }) => <h3 className="font-bold text-[14.5px] mt-3 mb-1.5">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-spark-hairline pl-3 italic text-spark-ink-70 my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-spark-hairline">
              <table className="w-full text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-spark-surface-sunken">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-2.5 py-2 text-left font-bold border-b border-spark-hairline">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-2 border-b border-spark-hairline align-top">{children}</td>
          ),
          hr: () => <hr className="my-3 border-spark-hairline" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
