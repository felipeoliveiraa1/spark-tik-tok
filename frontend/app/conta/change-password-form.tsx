"use client";

import * as React from "react";
import { Lock, AlertCircle, Check, ChevronDown, KeyRound, X } from "lucide-react";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { useToast } from "@/components/molecules/dialog-provider";
import { changePasswordAction } from "@/lib/auth";

export function ChangePasswordForm() {
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [confirmValue, setConfirmValue] = React.useState("");
  const [confirmErr, setConfirmErr] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const password = formData.get("password") as string | null;
    if (password !== confirmValue) {
      setConfirmErr("As senhas não batem.");
      return;
    }
    setConfirmErr(null);
    setPending(true);
    const result = await changePasswordAction(formData);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.success("Senha alterada 💕");
    setOpen(false);
    setConfirmValue("");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group w-full bg-spark-surface rounded-spark-2xl border border-spark-hairline px-5 py-4 flex items-center gap-3.5 text-left hover:bg-spark-brand-soft/30 hover:border-spark-brand/30 shadow-rest hover:shadow-lift transition-all duration-300 ease-premium hover:-translate-y-0.5"
      >
        <div className="w-10 h-10 rounded-full bg-spark-brand-soft text-spark-brand-deep flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
          <KeyRound size={16} strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-extrabold text-spark-ink">Alterar senha</div>
          <div className="text-[11.5px] text-spark-ink-50 mt-0.5">Mínimo 8 caracteres</div>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={2.2}
          className="text-spark-ink-50 shrink-0 transition-transform duration-300 group-hover:translate-y-0.5"
        />
      </button>
    );
  }

  return (
    <div className="bg-spark-surface rounded-spark-2xl border border-spark-brand/30 p-5 shadow-lift-brand">
      <div className="flex items-center justify-between mb-4">
        <div className="text-eyebrow text-spark-brand">✦ nova senha</div>
        <button
          type="button"
          aria-label="Cancelar"
          onClick={() => {
            setOpen(false);
            setError(null);
            setConfirmErr(null);
            setConfirmValue("");
          }}
          className="w-8 h-8 rounded-full text-spark-ink-50 hover:text-spark-ink active:scale-95 transition-transform flex items-center justify-center"
        >
          <X size={16} strokeWidth={1.7} />
        </button>
      </div>
      <form action={onSubmit} className="space-y-2.5">
        <div>
          <div className="text-[11px] font-semibold text-spark-ink-70 mb-1">Nova senha</div>
          <SInput
            name="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            Icon={Lock}
            required
            minLength={8}
          />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-spark-ink-70 mb-1">Confirmar</div>
          <SInput
            name="confirm"
            type="password"
            placeholder="Digita de novo"
            Icon={Lock}
            value={confirmValue}
            onChange={(e) => {
              setConfirmValue(e.target.value);
              if (confirmErr) setConfirmErr(null);
            }}
            required
            minLength={8}
          />
          {confirmErr && (
            <div className="mt-1.5 text-[12px] text-bad font-semibold inline-flex items-center gap-1.5">
              <AlertCircle size={12} strokeWidth={2} />
              {confirmErr}
            </div>
          )}
        </div>
        {error && (
          <div className="text-[12px] text-bad font-semibold inline-flex items-center gap-1.5">
            <AlertCircle size={12} strokeWidth={2} />
            {error}
          </div>
        )}
        <div className="pt-1">
          <SButton type="submit" variant="primary" size="md" full IconRight={Check} disabled={pending}>
            {pending ? "Salvando…" : "Salvar nova senha"}
          </SButton>
        </div>
      </form>
    </div>
  );
}
