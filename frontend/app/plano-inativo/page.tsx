import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
import { EmailCallout } from "./_email-callout";

export const dynamic = "force-dynamic";

const KIWIFY_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL ?? "https://pay.kiwify.com.br/YOR83Pu";

const STATUS_KEYS = [
  "inactive",
  "trial",
  "canceled",
  "refunded",
  "chargeback",
] as const;

type StatusKey = (typeof STATUS_KEYS)[number];

function isStatusKey(s: string): s is StatusKey {
  return (STATUS_KEYS as readonly string[]).includes(s);
}

export default async function PlanoInativoPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  if (hasActiveAccess(profile)) {
    redirect("/");
  }

  const status = getDisplayStatus(profile);
  const tNs = await getTranslations("errors.planInactive");
  const tA = await getTranslations("errors.planInactive.actions");
  const tStatus = await getTranslations("errors.planInactive.status");

  // Status pode vir como qualquer string — mapeia 'late' pra 'inactive' (sem
  // copia propria) e tudo que nao for um dos 5 cai em 'inactive' tambem.
  const copyKey: StatusKey = isStatusKey(status) ? status : "inactive";
  const tStatusCopy = await getTranslations(`errors.planInactive.${copyKey}`);

  const title = tStatusCopy("title");
  const titleHighlight = tStatusCopy("titleHighlight");
  const description = tStatusCopy("description");

  // Email pre-preenchido no checkout Kiwify: garante que o webhook
  // matche o profile existente (em vez de criar conta duplicada).
  const checkoutUrl = `${KIWIFY_CHECKOUT_URL}?email=${encodeURIComponent(profile.email)}`;
  const emailHeadline = tNs("sameEmail.headline");
  const emailSubtitle = tNs("sameEmail.subtitle");
  const emailCopy = tNs("sameEmail.copy");
  const emailCopied = tNs("sameEmail.copied");

  const { tone } = statusLabel(status);
  // Label vem do nosso i18n (mesmo nome de status que statusLabel usa)
  const label = isStatusKey(status) || status === "active" || status === "late"
    ? tStatus(status)
    : tStatus("inactive");

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
            title={title}
            titleHighlight={titleHighlight}
            description={description}
            email={profile.email}
            checkoutUrl={checkoutUrl}
            comebackEyebrow={tNs("comeback.eyebrow")}
            comebackProducts={tNs("comeback.products")}
            comebackScripts={tNs("comeback.scripts")}
            comebackHistory={tNs("comeback.history")}
            comebackLessons={tNs("comeback.lessons")}
            emailHeadline={emailHeadline}
            emailSubtitle={emailSubtitle}
            emailCopy={emailCopy}
            emailCopied={emailCopied}
            actReactivate={tA("reactivate")}
            actMyAccount={tA("myAccount")}
            actLogout={tA("logout")}
            actRefresh={tA("refresh")}
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
              title={title}
              titleHighlight={titleHighlight}
              description={description}
              email={profile.email}
              checkoutUrl={checkoutUrl}
              comebackEyebrow={tNs("comeback.eyebrow")}
              comebackProducts={tNs("comeback.products")}
              comebackScripts={tNs("comeback.scripts")}
              comebackHistory={tNs("comeback.history")}
              comebackLessons={tNs("comeback.lessons")}
              emailHeadline={emailHeadline}
              emailSubtitle={emailSubtitle}
              emailCopy={emailCopy}
              emailCopied={emailCopied}
              actReactivate={tA("reactivate")}
              actMyAccount={tA("myAccount")}
              actLogout={tA("logout")}
              actRefresh={tA("refresh")}
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
  titleHighlight,
  description,
  email,
  checkoutUrl,
  comebackEyebrow,
  comebackProducts,
  comebackScripts,
  comebackHistory,
  comebackLessons,
  emailHeadline,
  emailSubtitle,
  emailCopy,
  emailCopied,
  actReactivate,
  actMyAccount,
  actLogout,
  actRefresh,
}: {
  status: string;
  label: string;
  toneBg: string;
  title: string;
  titleHighlight: string;
  description: string;
  email: string;
  checkoutUrl: string;
  comebackEyebrow: string;
  comebackProducts: string;
  comebackScripts: string;
  comebackHistory: string;
  comebackLessons: string;
  emailHeadline: string;
  emailSubtitle: string;
  emailCopy: string;
  emailCopied: string;
  actReactivate: string;
  actMyAccount: string;
  actLogout: string;
  actRefresh: string;
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
            {title} <span className="text-grad-brand">{titleHighlight}</span>
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
              <div className="text-eyebrow text-spark-brand">{comebackEyebrow}</div>
              <ul className="mt-3 space-y-2 text-[13.5px] text-spark-ink-70 font-semibold">
                <li>{comebackProducts}</li>
                <li>{comebackScripts}</li>
                <li>{comebackHistory}</li>
                <li>{comebackLessons}</li>
              </ul>
            </div>
          </SectionReveal>
        )}

      </div>

      <SectionReveal direction="up" delay={850}>
        <div className="space-y-4 mt-8">
          {status !== "chargeback" && (
            <>
              <EmailCallout
                email={email}
                headline={emailHeadline}
                subtitle={emailSubtitle}
                copyLabel={emailCopy}
                copiedLabel={emailCopied}
              />
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full"
              >
                <SButton variant="primary" size="lg" full IconRight={ExternalLink}>
                  {actReactivate}
                </SButton>
              </a>
            </>
          )}

          <Link href="/conta" className="block w-full">
            <SButton variant="ghost" size="md" full Icon={KeyRound}>
              {actMyAccount}
            </SButton>
          </Link>

          <form action={logoutAction}>
            <SButton type="submit" variant="ghost" size="md" full Icon={LogOut}>
              {actLogout}
            </SButton>
          </form>

          <div className="flex justify-center pt-2">
            <Link
              href="/plano-inativo"
              className="inline-flex items-center gap-1.5 text-[12px] text-spark-ink-50 hover:text-spark-ink-70 font-extrabold uppercase tracking-wider transition-colors duration-300"
            >
              <RefreshCw size={11} strokeWidth={2.5} />
              {actRefresh}
            </Link>
          </div>
        </div>
      </SectionReveal>
    </div>
  );
}
