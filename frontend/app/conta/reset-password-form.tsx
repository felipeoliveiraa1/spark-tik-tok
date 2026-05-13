"use client";

import * as React from "react";
import { Lock, AlertCircle, Check } from "lucide-react";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { resetPasswordAction } from "@/lib/auth";

export function ResetPasswordForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await resetPasswordAction(formData);
    setPending(false);
    if (result && "error" in result) {
      setError(result.error);
    }
  }

  return (
    <form action={onSubmit}>
      <SInput
        name="password"
        type="password"
        placeholder="Nova senha (mín. 8 caracteres)"
        Icon={Lock}
        required
        minLength={8}
      />
      {error && (
        <div className="mt-2 text-[12px] text-red-600 inline-flex items-center gap-1.5">
          <AlertCircle size={12} strokeWidth={2} />
          {error}
        </div>
      )}
      <div className="mt-2.5">
        <SButton type="submit" variant="primary" size="md" full IconRight={Check} disabled={pending}>
          {pending ? "Salvando…" : "Salvar nova senha"}
        </SButton>
      </div>
    </form>
  );
}
