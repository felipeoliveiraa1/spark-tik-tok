"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, AlertCircle, Check } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Página de finalização do reset de senha. O link do email leva pra cá com
 * o token no hash da URL (#access_token=...). O cliente Supabase lê o hash
 * automaticamente no `onAuthStateChange` event 'PASSWORD_RECOVERY' e cria
 * uma sessão temporária pra autorizar o updateUser.
 */

function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}

function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [hasSession, setHasSession] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const supabase = getSupabaseBrowser();
    // Quando o user chega pelo link do email, o Supabase cria sessão
    // temporária com event PASSWORD_RECOVERY. Se já tinha sessão, ok também.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "INITIAL_SESSION" && session)) {
        setHasSession(true);
      }
    });
    // Fallback: tenta pegar sessão direto (pra usuários já com sessão temporária do hash)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true);
      else setHasSession((prev) => prev ?? false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Senha precisa ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não batem.");
      return;
    }
    setPending(true);
    const supabase = getSupabaseBrowser();
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateErr) {
      setError(updateErr.message || "Não consegui salvar. Tenta de novo.");
      return;
    }
    setDone(true);
    // Aguarda 1.5s pro user ver a mensagem, depois manda pro chat (já logado).
    setTimeout(() => router.push("/chat"), 1500);
  }

  if (hasSession === false) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
        <div className="flex items-center gap-2 text-[14px] font-bold text-red-700">
          <AlertCircle size={16} strokeWidth={2} />
          Link inválido ou expirado
        </div>
        <p className="mt-2 text-[13px] text-red-700/80 leading-relaxed">
          Esse link de recuperação não funciona mais. Pede um novo abaixo.
        </p>
        <div className="mt-4">
          <Link href="/forgot-password" className="block">
            <SButton variant="primary" size="md" full IconRight={ArrowRight}>
              Pedir um novo link
            </SButton>
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-spark-brand-soft border border-spark-brand/20 p-5">
        <div className="w-10 h-10 rounded-full bg-good text-white flex items-center justify-center">
          <Check size={20} strokeWidth={2.5} />
        </div>
        <div className="mt-3 text-[16px] font-extrabold text-spark-ink">
          Senha alterada 💕
        </div>
        <p className="mt-1.5 text-[13.5px] text-spark-ink-70 leading-relaxed">
          Sua senha foi atualizada com sucesso. Te levando pro app…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="text-[12px] text-spark-ink-50 font-semibold mb-1.5 tracking-[0.04em] uppercase">
        Nova senha
      </div>
      <SInput
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mínimo 8 caracteres"
        Icon={Lock}
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <div className="h-2.5" />
      <div className="text-[12px] text-spark-ink-50 font-semibold mb-1.5 tracking-[0.04em] uppercase">
        Confirma a nova senha
      </div>
      <SInput
        name="confirm"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Digita de novo"
        Icon={Lock}
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      {error && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] inline-flex items-center gap-2 w-full">
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </div>
      )}
      <div className="h-3" />
      <SButton
        type="submit"
        variant="primary"
        size="lg"
        full
        IconRight={ArrowRight}
        disabled={pending || hasSession === null}
      >
        {pending ? "Salvando…" : hasSession === null ? "Validando link…" : "Salvar nova senha"}
      </SButton>
    </form>
  );
}

function Mobile() {
  return (
    <div className="flex flex-col flex-1 px-[22px] justify-between">
      <div className="pt-[90px]" />
      <div>
        <div className="mb-9">
          <SparkMark size={120} />
        </div>
        <h1 className="text-[34px] font-extrabold tracking-tight leading-[1.05] text-spark-ink">
          Cria sua nova senha 🔒
        </h1>
        <p className="mt-3.5 text-[15px] leading-[1.5] text-spark-ink-50 max-w-[300px]">
          Escolhe uma senha que você lembre fácil — mínimo 8 caracteres.
        </p>

        <div className="mt-8">
          <ResetForm />
        </div>
      </div>
      <div className="pb-10 text-[11px] text-spark-ink-35 text-center flex justify-center gap-3.5">
        <span>Termos</span>
        <span>·</span>
        <span>Privacidade</span>
        <span>·</span>
        <span>Suporte</span>
      </div>
    </div>
  );
}

function Desktop() {
  return (
    <div className="flex-1 min-h-dvh flex w-full">
      <div className="flex-1 p-14 relative overflow-hidden text-white bg-brand-grad-hero flex flex-col justify-between">
        <SparkWordmark size={36} white />
        <div>
          <div className="text-[13px] font-bold opacity-85 uppercase tracking-[0.1em]">
            🔒 Nova senha
          </div>
          <h1 className="text-[52px] font-extrabold tracking-[-0.03em] leading-[1.05] mt-3 max-w-[480px]">
            Quase lá. 💕
          </h1>
          <p className="mt-4 text-[17px] leading-[1.5] opacity-90 max-w-[440px]">
            Escolhe uma senha forte que você consiga lembrar. Depois você entra direto.
          </p>
        </div>
        <div className="text-[11px] opacity-55 font-mono">© {new Date().getFullYear()} Método TTS</div>
      </div>

      <div className="w-[480px] p-14 bg-spark-bg flex flex-col justify-center">
        <div className="text-[13px] font-bold text-spark-ink-50 uppercase tracking-[0.06em]">
          Redefinir senha
        </div>
        <h2 className="text-[32px] font-extrabold tracking-[-0.02em] mt-2 leading-[1.15]">
          Cria sua nova senha 🌹
        </h2>
        <p className="text-[14px] text-spark-ink-50 mt-2">
          Mínimo 8 caracteres. Depois você entra direto no app.
        </p>

        <div className="mt-7">
          <ResetForm />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ResponsiveShell mobile={<Mobile />} desktop={<Desktop />} fullBleed />;
}
