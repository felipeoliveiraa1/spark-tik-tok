"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, AlertCircle, Check } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { createBrowserClient } from "@supabase/ssr";

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
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "INITIAL_SESSION" && session)) {
        setHasSession(true);
      }
    });
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
    setTimeout(() => router.push("/agentes"), 1500);
  }

  if (hasSession === false) {
    return (
      <div className="rounded-spark-2xl bg-bad/5 border border-bad/20 p-6 shadow-rest">
        <div className="flex items-center gap-2 text-[14px] font-extrabold text-bad">
          <AlertCircle size={16} strokeWidth={2.5} />
          Link inválido ou expirado
        </div>
        <p className="mt-3 text-[13px] text-spark-ink-70 leading-relaxed">
          Esse link de recuperação não funciona mais. Pede um novo abaixo.
        </p>
        <div className="mt-5">
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
      <div className="rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 p-6 shadow-lift-brand">
        <div className="w-12 h-12 rounded-full bg-good text-white flex items-center justify-center shadow-lift">
          <Check size={22} strokeWidth={2.5} />
        </div>
        <div className="mt-4 font-display lowercase text-spark-ink leading-tight text-[26px]">
          senha alterada 💕
        </div>
        <p className="mt-2 text-[13.5px] text-spark-ink-70 leading-relaxed">
          Sua senha foi atualizada com sucesso. Te levando pro app...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="text-eyebrow text-spark-ink-50 mb-2">Nova senha</div>
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
      <div className="h-3" />
      <div className="text-eyebrow text-spark-ink-50 mb-2">Confirma a nova senha</div>
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
        <div className="mt-4 px-4 py-3 rounded-spark-xl bg-bad/5 border border-bad/20 text-bad text-[13px] inline-flex items-center gap-2 w-full font-extrabold">
          <AlertCircle size={14} strokeWidth={2.5} />
          {error}
        </div>
      )}
      <div className="h-4" />
      <SButton
        type="submit"
        variant="primary"
        size="lg"
        full
        IconRight={ArrowRight}
        disabled={pending || hasSession === null}
      >
        {pending ? "Salvando..." : hasSession === null ? "Validando link..." : "Salvar nova senha"}
      </SButton>
    </form>
  );
}

function Mobile() {
  return (
    <div className="flex flex-col flex-1 relative overflow-auto hero-radial">
      <HeroBlob color="rose" variant={1} className="-top-24 -left-32 w-[460px] h-[460px]" />
      <HeroBlob color="peach" variant={2} className="top-1/3 -right-32 w-[460px] h-[460px]" />
      <SparkleField count={12} seed={567} className="opacity-50" />

      <div className="relative flex flex-col flex-1 px-6 justify-between">
        <div className="pt-[80px]" />
        <div>
          <SectionReveal direction="down" durationMs={600}>
            <SparkMark size={100} />
          </SectionReveal>
          <SectionReveal direction="up" delay={150} durationMs={800}>
            <div className="mt-8 text-eyebrow text-spark-brand">✦ nova senha</div>
            <h1
              className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
              style={{ fontSize: "clamp(2.25rem, 9vw, 3rem)" }}
            >
              cria sua <span className="text-grad-brand">nova senha.</span>
            </h1>
          </SectionReveal>
          <SectionReveal direction="up" delay={300}>
            <p className="mt-4 text-fluid-lead text-spark-ink-70 max-w-[28ch] leading-snug font-semibold">
              Escolhe uma senha que você lembre fácil — mínimo 8 caracteres.
            </p>
          </SectionReveal>

          <SectionReveal direction="up" delay={450}>
            <div className="mt-8">
              <ResetForm />
            </div>
          </SectionReveal>
        </div>
        <div className="pb-10 pt-8 text-[11px] text-spark-ink-50 text-center flex justify-center gap-3.5 font-extrabold uppercase tracking-wider">
          <span>Termos</span>
          <span>·</span>
          <span>Privacidade</span>
          <span>·</span>
          <span>Suporte</span>
        </div>
      </div>
    </div>
  );
}

function Desktop() {
  return (
    <div className="flex-1 min-h-dvh flex w-full">
      <div className="flex-1 p-14 relative overflow-hidden text-white bg-brand-grad-hero flex flex-col justify-between">
        <SparkleField count={18} seed={888} color="rgba(255,255,255,0.55)" className="opacity-60" />
        <div className="relative">
          <SparkWordmark size={36} white />
        </div>
        <div className="relative">
          <SectionReveal direction="up" durationMs={700}>
            <div className="text-[12px] font-extrabold opacity-90 uppercase tracking-widest">
              ✦ nova senha
            </div>
            <h1
              className="font-display lowercase tracking-tight leading-[0.92] mt-4 max-w-[600px]"
              style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}
            >
              quase
              <br />
              <span className="opacity-95">lá.</span>
            </h1>
          </SectionReveal>
          <SectionReveal direction="up" delay={200}>
            <p className="mt-6 text-fluid-lead opacity-90 max-w-[460px] leading-snug font-semibold">
              Escolhe uma senha forte que você consiga lembrar. Depois você entra direto.
            </p>
          </SectionReveal>
        </div>
        <div className="relative text-[11px] opacity-60 font-mono">
          © {new Date().getFullYear()} Método TTS
        </div>
      </div>

      <div className="w-[480px] p-14 bg-spark-bg flex flex-col justify-center relative overflow-hidden">
        <HeroBlob color="rose" variant={1} className="-top-32 -right-32 w-[400px] h-[400px]" />
        <SparkleField count={8} seed={444} className="opacity-50" />

        <div className="relative">
          <SectionReveal direction="down" durationMs={500}>
            <div className="text-eyebrow text-spark-brand">✦ redefinir senha</div>
          </SectionReveal>
          <SectionReveal direction="up" delay={100} durationMs={700}>
            <h2
              className="mt-2 font-display lowercase tracking-tight text-spark-ink leading-[0.92]"
              style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)" }}
            >
              cria sua <span className="text-grad-brand">nova senha.</span>
            </h2>
          </SectionReveal>
          <SectionReveal direction="up" delay={250}>
            <p className="text-[14px] text-spark-ink-70 mt-3 font-semibold leading-snug">
              Mínimo 8 caracteres. Depois você entra direto no app.
            </p>
          </SectionReveal>

          <SectionReveal direction="up" delay={400}>
            <div className="mt-8">
              <ResetForm />
            </div>
          </SectionReveal>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ResponsiveShell mobile={<Mobile />} desktop={<Desktop />} fullBleed />;
}
