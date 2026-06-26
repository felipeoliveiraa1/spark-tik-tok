"use client";

import * as React from "react";
import { Upload, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type UploadResult =
  | { ok: true; status: "auto_approved" | "pending"; sales_value: number | null }
  | { ok: false; error: string };

/**
 * Drag-drop area + preview + upload pra rota /api/jornadas/{slug}/proof.
 * Mostra estado: idle / previewing / uploading / done.
 */
export function ProofUploader({
  journeySlug,
  onResult,
}: {
  journeySlug: string;
  onResult: (result: UploadResult) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFile = React.useCallback((f: File) => {
    setError(null);
    if (!ALLOWED.has(f.type)) {
      setError("Formato não suportado. Use JPG, PNG ou WebP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Arquivo grande demais (máx 10MB).");
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/jornadas/${journeySlug}/proof`, {
        method: "POST",
        body: form,
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: "auto_approved" | "pending";
        proof?: { ocr_detected_sales: number | null };
        error?: string;
      };
      if (res.ok && j.ok) {
        onResult({
          ok: true,
          status: j.status ?? "pending",
          sales_value: j.proof?.ocr_detected_sales ?? null,
        });
      } else {
        const msg =
          j.error === "already_submitted"
            ? "Você já enviou uma prova pra essa jornada."
            : j.error === "invalid_type"
              ? "Formato não suportado."
              : j.error === "too_large"
                ? "Arquivo muito grande."
                : "Erro ao enviar. Tenta de novo.";
        setError(msg);
        onResult({ ok: false, error: msg });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro de rede";
      setError(msg);
      onResult({ ok: false, error: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      {!preview ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "rounded-spark-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all",
            isDragging
              ? "border-spark-brand bg-spark-brand-soft/30"
              : "border-spark-hairline hover:border-spark-brand/40 hover:bg-spark-surface-sunken/30",
          )}
        >
          <Upload size={32} className="mx-auto text-spark-brand-deep mb-2" />
          <div className="font-extrabold text-spark-ink text-[14px]">
            Arraste o print aqui ou clique pra escolher
          </div>
          <div className="text-[12px] text-spark-ink-50 mt-1">
            JPG, PNG ou WebP · até 10MB
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
        </div>
      ) : (
        <div className="rounded-spark-xl border border-spark-hairline bg-spark-surface p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview do print"
            className="w-full max-h-[400px] object-contain rounded-spark-lg bg-spark-ink/5"
          />
          <div className="mt-3 flex items-center justify-between gap-2 text-[12.5px] text-spark-ink-70">
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon size={13} />
              {file?.name ?? "print.jpg"}
            </span>
            <button
              onClick={handleReset}
              className="text-spark-brand-deep hover:underline"
              disabled={uploading}
            >
              trocar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-2.5 rounded-spark-lg bg-bad/5 border border-bad/20 text-bad text-[12.5px] inline-flex items-center gap-2">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full px-5 py-3 rounded-full bg-brand-grad text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-lift-brand hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Analisando seu print…
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              Enviar prova
            </>
          )}
        </button>
      )}
    </div>
  );
}
