import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase-server";
import { logoutAction } from "@/lib/auth";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SButton } from "@/components/atoms/s-button";
import { getDisplayStatus, hasActiveAccess, statusLabel } from "@/lib/plan-access";
import { LogOut, ExternalLink, RefreshCw, KeyRound } from "lucide-react";

export const dynamic = "force-dynamic";

const KIWIFY_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL ?? "https://pay.kiwify.com.br/YOR83Pu";

const STATUS_COPY: Record<string, { title: React.ReactNode; description: string }> = {
  inactive: {
    title: (
      <>
        sua assinatura tá <span className="text-grad-brand">inativa.</span>
      </>
    ),
    description:
      "Pra acessar o Método TTS você precisa de uma assinatura ativa. Bora reativar?",
  },
  trial: {
    title: (
      <>
        seu trial <span className="text-grad-brand">acabou 💕</span>
      </>
    ),
    description:
      "Os dias de teste terminaram. Pra continuar, é só assinar — toda sua conta (produtos, scripts, rotina) fica salva e volta na hora.",
  },
  canceled: {
    title: (
      <>
        seu plano foi <span className="text-grad-brand">cancelado.</span>
      </>
    ),
    description:
      "O período pago acabou. Suas fichas de produto e scripts continuam guardadinhos — quando renovar, tudo volta como estava.",
  },
  refunded: {
    title: (
      <>
        seu plano foi <span className="text-grad-brand">reembolsado.</span>
      </>
    ),
    description:
      "Processamos seu reembolso e o acesso ao app foi encerrado. Se mudou de ideia, pode assinar de novo a qualquer momento.",
  },
  chargeback: {
    title: (
      <>
        acesso <span className="text-grad-brand">bloqueado.</span>
      </>
    ),
    description:
      "Identificamos uma contestação bancária na sua compra. Pra resolver, fala com a gente respondendo qualquer email do Método TTS.",
  },
};

export default async function PlanoInativoPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  if (hasActiveAccess(profile)) {
    redirect("/");
  }

  const status = getDisplayStatus(profile);
  const copy = STATUS_COPY[status] ?? STATUS_COPY.inactive;
  const { label, tone } = statusLabel(status);

  const toneBg =
    tone === "bad"
      ? "bg-bad/10 text-bad border-bad/20"
      : tone === "warn"
        ? "bg-warn/10 text-warn border-warn/20"
        : "bg-spark-surface-sunken text-spark-ink-50 border-spark-hairline";

  return (
    <ResponsiveShell
      fullBleed
      mobile={
        <div className="flex-1 flex flex-col bg-spark-bg relative overflow-auto hero-radial">
          <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[460px] h-[460px]" />
          <HeroBlob color="peach" variant={2} className="top-1/3 -right-32 w-[460px] h-[460px]" />
          <SparkleField count={12} seed={567} className="opacity-50" />
          <PlanoInativoBody
            status={status}
            label={label}
            toneBg={toneBg}
            title={copy.title}
            description={copy.description}
            email={profile.email}
          />
        </div>
      }
      desktop={
        <div className="flex-1 flex flex-col items-center justify-center bg-spark-bg p-12 relative overflow-auto hero-radial">
          <HeroBlob color="rose" variant={1} className="-top-32 -left-32 w-[560px] h-[560px]" />
          <HeroBlob color="peach" variant={2} className="bottom-0 -right-32 w-[560px] h-[560px]" />
          <SparkleField count={16} seed={678} className="opacity-50" />
          <div className="w-full max-w-[560px] relative">
            <PlanoInativoBody
              status={status}
              label={label}
              toneBg={toneBg}
              title={copy.title}
              description={copy.description}
              email={profile.email}
            />
          </div>
        </div>
      }
    />
  );
}

function PlanoInativoBody({
  status,
  label,
  toneBg,
  title,
  description,
  email,
}: {
  status: string;
  label: string;
  toneBg: string;
  title: React.ReactNode;
  description: string;
  email: string;
}) {
  return (
    <div
      className="flex-1 flex flex-col justify-between px-6 pb-8 relative"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 48px)" }}
    >
      <div>
        <SectionReveal direction="down" durationMs={500}>
          <div className="flex justify-center">
            <SparkWordmark size={56} />
          </div>
        </SectionReveal>

        <SectionReveal direction="up" delay={150}>
          <div
            className={`mt-10 inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full border text-[10.5px] font-extrabold uppercase tracking-wider ${toneBg}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {label}
          </div>
        </SectionReveal>

        <SectionReveal direction="up" delay={250} durationMs={800}>
          <h1
            className="mt-4 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
            style={{ fontSize: "clamp(2rem, 6vw, 3.25rem)" }}
          >
            {title}
          </h1>
        </SectionReveal>

        <SectionReveal direction="up" delay={400}>
          <p className="mt-5 text-fluid-lead text-spark-ink-70 leading-snug font-semibold">
            {description}
          </p>
        </SectionReveal>

        {status !== "chargeback" && (
          <SectionReveal direction="up" delay={550}>
            <div className="mt-7 p-5 rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 shadow-lift-brand">
              <div className="text-eyebrow text-spark-brand">✦ o que volta com você</div>
              <ul className="mt-3 space-y-2 text-[13.5px] text-spark-ink-70 font-semibold">
                <li>📦 Suas fichas de produto completas</li>
                <li>✍️ Todos os roteiros gerados</li>
                <li>💬 Histórico de conversas com as IAs</li>
                <li>🎓 Progresso nas aulas</li>
              </ul>
            </div>
          </SectionReveal>
        )}

        <SectionReveal direction="up" delay={700}>
          <div className="mt-6 text-[12px] text-spark-ink-50 font-mono">{email}</div>
        </SectionReveal>
      </div>

      <SectionReveal direction="up" delay={850}>
        <div className="space-y-3 mt-8">
          {status !== "chargeback" && (
            <a
              href={KIWIFY_CHECKOUT_URL}
              target="_blank"
              rel="noreferrer"
              className="block w-full"
            >
              <SButton variant="primary" size="lg" full IconRight={ExternalLink}>
                Reativar pelo Kiwify
              </SButton>
            </a>
          )}

          <Link href="/conta" className="block w-full">
            <SButton variant="ghost" size="md" full Icon={KeyRound}>
              Minha conta
            </SButton>
          </Link>

          <form action={logoutAction}>
            <SButton type="submit" variant="ghost" size="md" full Icon={LogOut}>
              Sair
            </SButton>
          </form>

          <div className="flex justify-center pt-2">
            <Link
              href="/plano-inativo"
              className="inline-flex items-center gap-1.5 text-[12px] text-spark-ink-50 hover:text-spark-ink-70 font-extrabold uppercase tracking-wider transition-colors duration-300"
            >
              <RefreshCw size={11} strokeWidth={2.5} />
              Acabei de pagar — atualizar
            </Link>
          </div>
        </div>
      </SectionReveal>
    </div>
  );
}
