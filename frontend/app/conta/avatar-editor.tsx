"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, Loader2 } from "lucide-react";
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

  return (
    <div className="relative shrink-0">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />

      <button
        type="button"
        onClick={pick}
        disabled={uploading}
        aria-label="Trocar foto de perfil"
        className={cn(
          "group relative rounded-full text-white flex items-center justify-center font-display bg-brand-grad shadow-lift-brand overflow-hidden transition-transform duration-300 ease-premium hover:scale-105 disabled:opacity-70",
          dim,
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name || email}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{getInitial(name, email)}</span>
        )}

        {/* Overlay hover */}
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
      </button>

      {/* Remover (quando tem avatar) */}
      {avatarUrl && !uploading && (
        <button
          type="button"
          onClick={remove}
          aria-label="Remover foto"
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-spark-surface border-2 border-spark-bg text-spark-ink-50 hover:text-bad hover:bg-bad/10 flex items-center justify-center shadow-lift transition-colors"
        >
          <Trash2 size={12} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}
