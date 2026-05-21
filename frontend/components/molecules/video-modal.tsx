"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink } from "lucide-react";
import { extractTikTokId, buildTikTokEmbedUrl } from "@/lib/tiktok";

type Ctx = {
  open: (url: string) => void;
};

const VideoModalContext = React.createContext<Ctx | null>(null);

export function useVideoModal(): Ctx {
  const ctx = React.useContext(VideoModalContext);
  if (!ctx) {
    return { open: (url: string) => window.open(url, "_blank", "noreferrer") };
  }
  return ctx;
}

export function VideoModalProvider({ children }: { children: React.ReactNode }) {
  const [activeUrl, setActiveUrl] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!activeUrl) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveUrl(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [activeUrl]);

  return (
    <VideoModalContext.Provider value={{ open: setActiveUrl }}>
      {children}
      {mounted && activeUrl
        ? createPortal(
            <VideoModal url={activeUrl} onClose={() => setActiveUrl(null)} />,
            document.body,
          )
        : null}
    </VideoModalContext.Provider>
  );
}

function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  const id = extractTikTokId(url);
  const embedUrl = id ? buildTikTokEmbedUrl(id) : null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] max-h-[calc(100dvh-1.5rem)] rounded-3xl overflow-hidden bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] animate-in zoom-in-95"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur transition-colors"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {embedUrl ? (
          <div className="relative w-full aspect-[9/16] bg-black">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <div className="p-6 text-center text-white">
            <div className="text-[14px] font-bold">Vídeo indisponível pra embed</div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-spark-brand-soft font-semibold"
            >
              Abrir no TikTok <ExternalLink size={14} strokeWidth={1.7} />
            </a>
          </div>
        )}

        <div className="px-4 py-3 bg-black text-white flex items-center justify-between gap-2 text-[12px]">
          <span className="opacity-75 truncate">Pré-visualização do TikTok</span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-spark-brand-soft font-semibold shrink-0"
          >
            Abrir no app <ExternalLink size={12} strokeWidth={1.7} />
          </a>
        </div>
      </div>
    </div>
  );
}
