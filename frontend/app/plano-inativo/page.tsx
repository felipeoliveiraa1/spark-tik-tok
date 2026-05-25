import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase-server";
import { logoutAction } from "@/lib/auth";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";
import { SButton } from "@/components/atoms/s-button";
import { getDisplayStatus, hasActiveAccess, statusLabel } from "@/lib/plan-access";
import { LogOut, ExternalLink, RefreshCw, KeyRound } from "lucide-react";

export const dynamic = "force-dynamic";

// URL do checkout Kiwify pra renovação. Felipe troca quando tiver o produto
// real configurado no painel.
const KIWIFY_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL ?? "https://pay.kiwify.com.br/YOR83Pu";

const STATUS_COPY: Record<string, { title: string; description: string }> = {
  inactive: {
    title: "Sua assinatura está inativa 💕",
    description:
      "Pra acessar o Método TTS você precisa de uma assinatura ativa. Bora reativar?",
  },
  canceled: {
    title: "Seu plano foi cancelado 💕",
    description:
      "O período pago acabou. Suas fichas de produto e scripts continuam guardadinhos — quando renovar, tudo volta como estava.",
  },
  refunded: {
    title: "Seu plano foi reembolsado",
    description:
      "Processamos seu reembolso e o acesso ao app foi encerrado. Se mudou de ideia, pode assinar de novo a qualquer momento.",
  },
  chargeback: {
    title: "Acesso bloqueado",
    description:
      "Identificamos uma contestação bancária na sua compra. Pra resolver, fala com a gente respondendo qualquer email do Método TTS.",
  },
};

export default async function PlanoInativoPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  // Se ainda tem acesso, manda pra home (não deveria estar aqui).
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
        <div className="flex-1 flex flex-col bg-spark-bg">
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
        <div className="flex-1 flex flex-col items-center justify-center bg-spark-bg p-12">
          <div className="w-full max-w-[520px]">
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
  title: string;
  description: string;
  email: string;
}) {
  return (
    <div
      className="flex-1 flex flex-col justify-between px-5 pb-8"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)" }}
    >
      <div>
        <div className="flex justify-center">
          <SparkWordmark size={56} />
        </div>

        <div
          className={`mt-8 inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-[0.08em] ${toneBg}`}
        >
          ● {label}
        </div>

        <h1 className="mt-3 text-[26px] font-extrabold tracking-tight leading-[1.1] text-spark-ink">
          {title}
        </h1>
        <p className="mt-3 text-[14.5px] text-spark-ink-70 leading-relaxed">
          {description}
        </p>

        {status !== "chargeback" && (
          <div className="mt-6 p-4 rounded-2xl bg-spark-brand-soft border border-spark-brand/20">
            <div className="text-[11px] uppercase tracking-[0.08em] font-bold text-spark-brand-deep">
              O que volta com você
            </div>
            <ul className="mt-2 space-y-1.5 text-[13.5px] text-spark-ink-70">
              <li>📦 Suas fichas de produto completas</li>
              <li>✍️ Todos os roteiros gerados</li>
              <li>💬 Histórico de conversas com as IAs</li>
              <li>🎓 Progresso nas aulas</li>
            </ul>
          </div>
        )}

        <div className="mt-6 text-[12px] text-spark-ink-50 font-mono">{email}</div>
      </div>

      <div className="space-y-2.5 mt-8">
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
            className="inline-flex items-center gap-1.5 text-[12px] text-spark-ink-50 hover:text-spark-ink-70"
          >
            <RefreshCw size={11} strokeWidth={2} />
            Acabei de pagar — atualizar
          </Link>
        </div>
      </div>
    </div>
  );
}
