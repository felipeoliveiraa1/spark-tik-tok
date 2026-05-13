"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Play } from "lucide-react";
import { isTikTokUrl } from "@/lib/tiktok";
import { useVideoModal } from "@/components/molecules/video-modal";

/**
 * Renderiza o conteúdo (markdown) que o agente devolve com:
 * - links clicáveis (TikTok abre em modal interno, resto abre nova aba)
 * - imagens (thumbnails de virais ou previews)
 * - negrito, itálico, listas, tabelas (Scripts), code inline
 */
export function MessageContent({ children }: { children: string }) {
  const videoModal = useVideoModal();

  if (!children) return null;

  return (
    <div className="message-md text-[14.5px] leading-[1.55] tracking-[-0.005em]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const url = href ?? "";
            const tiktok = isTikTokUrl(url);
            if (tiktok) {
              return (
                <button
                  type="button"
                  onClick={() => videoModal.open(url)}
                  className="inline-flex items-center gap-1 text-spark-brand font-semibold underline decoration-spark-brand/40 underline-offset-2 hover:decoration-spark-brand cursor-pointer"
                >
                  <Play size={12} strokeWidth={2} className="-mt-0.5" />
                  {children}
                </button>
              );
            }
            return (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-spark-brand font-semibold underline decoration-spark-brand/40 underline-offset-2 hover:decoration-spark-brand"
              >
                {children}
                <ExternalLink size={11} strokeWidth={1.7} className="opacity-70" />
              </a>
            );
          },
          img: ({ src, alt }) => {
            if (!src || typeof src !== "string") return null;
            // URLs externas vão pelo proxy /api/img-proxy pra contornar
            // CORS/referrer/expiração de URLs assinadas do GCS/TikTok CDN.
            const isExternal = /^https?:\/\//i.test(src);
            const finalSrc =
              isExternal && !src.includes("/api/img-proxy")
                ? `/api/img-proxy?url=${encodeURIComponent(src)}`
                : src;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={finalSrc}
                alt={typeof alt === "string" ? alt : ""}
                className="my-2 w-full max-w-[260px] aspect-[9/14] rounded-2xl border border-spark-hairline object-cover bg-spark-surface-sunken"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            );
          },
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
