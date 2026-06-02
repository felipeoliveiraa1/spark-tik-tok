"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type Props = {
  email: string;
  name: string;
  initialAvatarUrl: string | null;
  size?: "md" | "lg";
};

function getInitial(name: string, email: string): string {
  const src = name?.trim() || email;
  return src.charAt(0).toUpperCase();
}

export function AvatarEditor({ email, name, initialAvatarUrl, size = "lg" }: Props) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = React.useState(false);

  const dim = size === "lg" ? "w-24 h-24 text-[36px]" : "w-16 h-16 text-2xl";

  const pick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem precisa ter menos de 2MB");
      e.target.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use JPG, PNG ou WebP");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/me/avatar", { method: "POST", body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(j.message ?? "Falhou o upload");
        return;
      }
      const data = (await res.json()) as { avatar_url: string };
      setAvatarUrl(data.avatar_url);
      toast.success("Foto atualizada 💕");
      router.refresh();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = async () => {
    if (!avatarUrl) return;
    setUploading(true);
    try {
      const res = await fetch("/api/me/avatar", { method: "DELETE" });
      if (res.ok) {
        setAvatarUrl(null);
        toast.success("Foto removida");
        router.refresh();
      } else {
        toast.error("Não consegui remover");
      }
    } finally {
      setUploading(false);
    }
  };

  const hasAvatar = !!avatarUrl;

  return (
    <div className="relative shrink-0 flex flex-col items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />

      <div className="relative">
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          aria-label={hasAvatar ? "Trocar foto de perfil" : "Adicionar foto de perfil"}
          className={cn(
            "group relative rounded-full text-white flex items-center justify-center font-display overflow-hidden transition-all duration-300 ease-premium hover:scale-105 disabled:opacity-70",
            dim,
            hasAvatar
              ? "bg-brand-grad shadow-lift-brand"
              : "bg-brand-grad-soft border-[3px] border-dashed border-spark-brand/50 text-spark-brand-deep animate-pulse-soft",
          )}
        >
          {hasAvatar ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl!}
                alt={name || email}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              {/* Overlay hover/uploading */}
              <div
                className={cn(
                  "absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300",
                  uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
              >
                {uploading ? (
                  <Loader2 size={20} strokeWidth={2.5} className="animate-spin" />
                ) : (
                  <Camera size={20} strokeWidth={2.4} />
                )}
              </div>
            </>
          ) : (
            // Sem foto: mostra inicial pequena + Camera grande no centro
            <div className="flex flex-col items-center gap-0.5">
              {uploading ? (
                <Loader2 size={28} strokeWidth={2.5} className="animate-spin" />
              ) : (
                <Camera size={28} strokeWidth={2.2} />
              )}
              <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-80">
                adicionar
              </span>
            </div>
          )}
        </button>

        {/* Badge CAMERA sempre visivel quando tem avatar — sinaliza que da
            pra clicar pra trocar (especialmente importante no mobile sem hover) */}
        {hasAvatar && !uploading && (
          <button
            type="button"
            onClick={pick}
            aria-label="Trocar foto"
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-spark-ink text-white border-[3px] border-spark-bg flex items-center justify-center shadow-lift hover:scale-110 transition-transform duration-300"
          >
            <Camera size={13} strokeWidth={2.5} />
          </button>
        )}

        {/* Sem avatar: ainda mostra badge + pra reforçar */}
        {!hasAvatar && !uploading && (
          <div
            aria-hidden
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-grad text-white border-[3px] border-spark-bg flex items-center justify-center shadow-lift-brand"
          >
            <Plus size={14} strokeWidth={2.8} />
          </div>
        )}
      </div>

      {/* Label visivel chamando a acao */}
      {!hasAvatar && !uploading && (
        <button
          type="button"
          onClick={pick}
          className="text-[11px] font-extrabold uppercase tracking-widest text-spark-brand-deep hover:text-spark-brand transition-colors"
        >
          Adicionar foto
        </button>
      )}

      {/* Remover (so com avatar e size lg) */}
      {hasAvatar && !uploading && size === "lg" && (
        <button
          type="button"
          onClick={remove}
          aria-label="Remover foto"
          className="text-[10.5px] font-extrabold uppercase tracking-widest text-spark-ink-50 hover:text-bad inline-flex items-center gap-1 transition-colors"
        >
          <Trash2 size={10} strokeWidth={2.5} />
          remover
        </button>
      )}
    </div>
  );
}
