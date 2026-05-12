import Link from "next/link";
import { Mail, ArrowRight, Search, Flame, Pen, MessageCircle } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkMark } from "@/components/atoms/spark-mark";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { loginAction } from "@/lib/auth";

function LoginMobile() {
  return (
    <div className="flex flex-col flex-1 px-[22px] justify-between">
      <div className="pt-[90px]" />
      <div>
        <div className="mb-9">
          <SparkMark size={56} />
        </div>
        <h1 className="text-[34px] font-extrabold tracking-[-0.025em] leading-[1.05] text-spark-ink">
          Crie scripts
          <br />
          que vendem
          <br />
          no TikTok Shop.
        </h1>
        <p className="mt-3.5 text-[15px] leading-[1.5] text-spark-ink-50 max-w-[300px]">
          Sua IA pessoal pra analisar produto, achar viral e escrever hook que converte.
        </p>

        <div className="mt-8">
          <div className="text-[12px] text-spark-ink-50 font-semibold mb-2 tracking-[0.04em] uppercase">
            Seu email
          </div>
          <form action={loginAction}>
            <SInput
              name="email"
              defaultValue="maria@criadoras.com"
              placeholder="seu@email.com"
              Icon={Mail}
              type="email"
              autoComplete="email"
            />
            <div className="h-3" />
            <SButton type="submit" variant="primary" size="lg" full IconRight={ArrowRight}>
              Receber link de acesso
            </SButton>
          </form>
        </div>

        <Link
          href="/landing"
          className="mt-4 flex items-center justify-between px-4 py-3.5 rounded-[14px] bg-brand-grad-soft"
        >
          <div>
            <div className="text-[13px] font-bold text-spark-ink">Ainda não tem acesso?</div>
            <div className="text-[12px] text-spark-ink-50 mt-0.5">Compra agora e recebe o link no email</div>
          </div>
          <ArrowRight size={18} strokeWidth={1.7} className="text-spark-brand" />
        </Link>
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

const desktopFeatures = [
  { Icon: Search, t: "Análise", s: "foto → ficha completa" },
  { Icon: Flame, t: "Virais", s: "top da semana" },
  { Icon: Pen, t: "Scripts", s: "hooks com IA" },
  { Icon: MessageCircle, t: "Suporte", s: "tira-dúvidas" },
];

function LoginDesktop() {
  return (
    <div className="flex-1 min-h-dvh flex w-full">
      {/* Brand panel */}
      <div className="flex-1 p-14 relative overflow-hidden text-white bg-brand-grad-hero flex flex-col justify-between">
        <SparkWordmark size={22} white />
        <div>
          <div className="text-[13px] font-bold opacity-85 uppercase tracking-[0.1em]">
            App TikTok Shop
          </div>
          <h1 className="text-[56px] font-extrabold tracking-[-0.03em] leading-[1.02] mt-3 max-w-[480px]">
            Crie scripts
            <br />
            que vendem.
          </h1>
          <p className="mt-4 text-[17px] leading-[1.5] opacity-90 max-w-[440px]">
            Sua IA pessoal pra analisar produto, achar viral e escrever hook que converte. Pensado pra
            criadoras brasileiras.
          </p>
          <div className="mt-9 grid grid-cols-2 gap-3 max-w-[460px]">
            {desktopFeatures.map((it) => (
              <div
                key={it.t}
                className="p-3.5 rounded-[14px] bg-white/15 backdrop-blur flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-[9px] bg-white/20 flex items-center justify-center">
                  <it.Icon size={16} strokeWidth={1.7} />
                </div>
                <div>
                  <div className="text-[13px] font-bold">{it.t}</div>
                  <div className="text-[11px] opacity-75">{it.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[11px] opacity-55 font-mono">v1.4.0 · pwa · onboarded para Kiwify</div>
      </div>

      {/* Form panel */}
      <div className="w-[480px] p-14 bg-spark-bg flex flex-col justify-center">
        <div className="text-[13px] font-bold text-spark-ink-50 uppercase tracking-[0.06em]">Entrar</div>
        <h2 className="text-[32px] font-extrabold tracking-[-0.02em] mt-2 leading-[1.15]">
          Bem-vinda de volta.
        </h2>
        <p className="text-[14px] text-spark-ink-50 mt-2">Mandamos um link mágico no seu email.</p>

        <form action={loginAction} className="mt-7">
          <div className="text-[12px] font-bold text-spark-ink-50 mb-1.5 tracking-[0.04em] uppercase">
            Email
          </div>
          <SInput
            name="email"
            defaultValue="maria@criadoras.com"
            Icon={Mail}
            type="email"
            autoComplete="email"
          />
          <div className="h-3" />
          <SButton type="submit" variant="primary" size="lg" full IconRight={ArrowRight}>
            Receber link de acesso
          </SButton>
        </form>

        <div className="mt-3.5 px-3.5 py-3 rounded-xl bg-spark-surface border border-spark-hairline flex items-center gap-2.5">
          <Mail size={18} strokeWidth={1.7} className="text-spark-brand" />
          <div className="flex-1">
            <div className="text-[13px] font-bold">Confere sua caixa de entrada</div>
            <div className="text-[11px] text-spark-ink-50">O link expira em 15 minutos.</div>
          </div>
        </div>

        <div className="flex-1" />

        <Link
          href="/landing"
          className="mt-7 p-3.5 rounded-[14px] bg-brand-grad-soft text-spark-brand-deep flex items-center justify-between"
        >
          <div>
            <div className="text-[13px] font-bold">Ainda não tem acesso?</div>
            <div className="text-[11px] opacity-80 mt-0.5">Compra agora e recebe o link no email.</div>
          </div>
          <SButton size="sm" variant="dark" IconRight={ArrowRight}>
            Comprar
          </SButton>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <ResponsiveShell mobile={<LoginMobile />} desktop={<LoginDesktop />} fullBleed />;
}
