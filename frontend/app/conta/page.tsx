import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  LogOut,
  KeyRound,
  Calendar,
  Package,
  Pen,
  GraduationCap,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { FloatingMainNav } from "@/components/layout/floating-main-nav";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SBadge } from "@/components/atoms/s-badge";
import { getCurrentProfile, getSupabaseServer } from "@/lib/supabase-server";
import { logoutAction } from "@/lib/auth";
import { getDisplayStatus, statusLabel } from "@/lib/plan-access";
import { ResetPasswordForm } from "./reset-password-form";
import { ProfileEditor } from "./profile-editor";
import { ChangePasswordForm } from "./change-password-form";
import { AvatarEditor } from "./avatar-editor";
import { ProfileExtrasEditor } from "./profile-extras-editor";
import { LanguageSelector } from "./language-selector";
import { RevenueCard } from "./revenue-card";
import { RankingOptInCard } from "./ranking-opt-in-card";
import { ContaTour } from "./conta-tour";
import { CompleteProfileBanner } from "./complete-profile-banner";

const KIWIFY_PORTAL_URL =
  process.env.NEXT_PUBLIC_KIWIFY_PORTAL_URL ?? "https://dashboard.kiwify.com.br";

type ContaPageProps = {
  searchParams?: Promise<{ reset?: string }>;
};

type Stats = {
  products: number;
  scripts: number;
  aulasVistas: number;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

async function getStats(userId: string): Promise<Stats> {
  const supabase = await getSupabaseServer();
  const [products, scripts, progress] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("generated_scripts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("education_progress")
      .select("video_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true),
  ]);
  return {
    products: products.count ?? 0,
    scripts: scripts.count ?? 0,
    aulasVistas: progress.count ?? 0,
  };
}

async function ContaBody({
  desktop = false,
  email,
  name,
  niche,
  avatarUrl,
  bio,
  instagramHandle,
  tiktokHandle,
  cidadeUf,
  metaMensalBrl,
  rankingOptIn,
  planActive,
  planStatus,
  planExpiresAt,
  planNextPayment,
  planCanceledAt,
  showReset,
  createdAt,
  planRenewedAt,
  stats,
  whatsapp,
  whatsappOptIn,
}: {
  desktop?: boolean;
  email: string;
  name: string;
  niche: string | null;
  avatarUrl: string | null;
  bio: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  cidadeUf: string | null;
  metaMensalBrl: number | null;
  rankingOptIn: boolean;
  whatsapp: string;
  whatsappOptIn: boolean;
  planActive: boolean;
  planStatus: string | null;
  planExpiresAt: string | null;
  planNextPayment: string | null;
  planCanceledAt: string | null;
  showReset: boolean;
  createdAt: string | null;
  planRenewedAt: string | null;
  stats: Stats;
}) {
  const status = getDisplayStatus({
    plan_active: planActive,
    plan_status: planStatus,
    plan_expires_at: planExpiresAt,
  });
  const { label: statusBadgeLabel, tone: statusTone } = statusLabel(status);
  const badgeTone: "good" | "warn" | "neutral" =
    statusTone === "good" ? "good" : statusTone === "neutral" ? "neutral" : "warn";

  const t = await getTranslations("conta");

  return (
    <div
      className="flex-1 overflow-auto relative"
      style={{ paddingBottom: desktop ? 32 : "calc(env(safe-area-inset-bottom) + 100px)" }}
    >
      {/* Hero */}
      <section
        className="relative overflow-hidden hero-radial"
        style={{
          paddingTop: desktop ? "72px" : "calc(env(safe-area-inset-top) + 64px)",
          paddingBottom: desktop ? "40px" : "24px",
        }}
      >
        <HeroBlob color="rose" variant={1} className="-top-24 -left-24 w-[460px] h-[460px]" />
        <HeroBlob color="peach" variant={2} className="top-10 -right-32 w-[460px] h-[460px]" />
        <SparkleField count={12} seed={232} className="opacity-50" />

        <div className={`relative ${desktop ? "px-12 max-w-[720px] mx-auto" : "px-5"}`}>
          <SectionReveal direction="down" durationMs={500}>
            <div className="text-eyebrow text-spark-brand">{t("header.eyebrow")}</div>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={800}>
            <h1
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
              style={{
                fontSize: desktop ? "clamp(2.5rem, 5vw, 4rem)" : "clamp(2rem, 8vw, 3rem)",
              }}
            >
              {t("header.title")}
            </h1>
          </SectionReveal>

          {/* Avatar + nome card */}
          <SectionReveal direction="up" delay={250}>
            <div data-tutorial-id="conta-avatar" className="mt-7 flex items-center gap-4 p-5 rounded-spark-2xl glass border border-spark-hairline shadow-rest">
              <AvatarEditor
                email={email}
                name={name}
                initialAvatarUrl={avatarUrl}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div
                  className={`font-extrabold ${desktop ? "text-[22px]" : "text-[18px]"} truncate text-spark-ink`}
                >
                  {name || "Criadora"}
                </div>
                <div className="text-[12.5px] text-spark-ink-50 font-mono truncate">
                  {email}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <SBadge tone={badgeTone}>{statusBadgeLabel}</SBadge>
                  {niche &&
                    niche
                      .split(",")
                      .map((n) => n.trim())
                      .filter(Boolean)
                      .map((n) => <SBadge key={n}>{n}</SBadge>)}
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Conteúdo */}
      <section className={`relative ${desktop ? "px-12" : "px-5"} pt-2 space-y-5`}>
        <div className={desktop ? "max-w-[720px] mx-auto space-y-5" : "space-y-5"}>
          {/* BANNER bloqueador — primeiro login com senha temporária */}
          {showReset && (
            <SectionReveal direction="down" durationMs={500}>
              <div className="relative p-5 lg:p-6 rounded-spark-2xl bg-brand-grad text-white shadow-hero overflow-hidden">
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
                  }}
                />
                <div className="relative flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                    <KeyRound size={18} strokeWidth={2.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-widest opacity-90">
                      {t("resetBanner.eyebrow")}
                    </div>
                    <div
                      className="mt-1 font-display lowercase leading-tight tracking-tight"
                      style={{ fontSize: "clamp(1.25rem, 3vw, 1.625rem)" }}
                    >
                      {t("resetBanner.title")}
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed opacity-95 font-semibold">
                      {t("resetBanner.subtitle")}
                    </p>
                  </div>
                </div>
              </div>
            </SectionReveal>
          )}

          {/* Reset senha em destaque — hoist pro topo quando showReset */}
          {showReset && (
            <SectionReveal direction="up" delay={100}>
              <div className="p-6 rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 shadow-lift-brand">
                <div className="flex items-center gap-2 text-[14px] font-extrabold text-spark-brand-deep">
                  <KeyRound size={16} strokeWidth={2.2} />
                  {t("resetForm.sectionTitle")}
                </div>
                <p className="text-[12.5px] text-spark-ink-70 mt-2 leading-relaxed">
                  {t("resetForm.description")}
                </p>
                <div className="mt-4">
                  <ResetPasswordForm />
                </div>
              </div>
            </SectionReveal>
          )}

          {/* Banner: complete o perfil (meta + ranking). Some sozinho
              quando os 2 estiverem feitos. */}
          {!showReset && (
            <CompleteProfileBanner
              metaCadastrada={metaMensalBrl != null && metaMensalBrl > 0}
              rankingAtivado={rankingOptIn}
            />
          )}

          {/* Stats em grid */}
          <SectionReveal direction="up">
            <div data-tutorial-id="conta-stats" className="grid grid-cols-3 gap-3">
              <StatCard emoji="📦" Icon={Package} value={stats.products} label={t("stats.products")} />
              <StatCard emoji="✍️" Icon={Pen} value={stats.scripts} label={t("stats.scripts")} />
              <StatCard
                emoji="🎓"
                Icon={GraduationCap}
                value={stats.aulasVistas}
                label={t("stats.lessons")}
              />
            </div>
          </SectionReveal>

          {/* Conta info */}
          <SectionReveal direction="up" delay={100}>
            <InfoCard label={t("profile.sectionTitle")}>
              <div className="space-y-3">
                <InfoRow
                  Icon={Calendar}
                  label={t("profile.memberSince")}
                  value={`${formatDate(createdAt)} (${daysSince(createdAt)} dias)`}
                />
                {planRenewedAt && (
                  <InfoRow
                    Icon={Calendar}
                    label={t("profile.lastRenewal")}
                    value={formatDate(planRenewedAt)}
                  />
                )}
              </div>
            </InfoCard>
          </SectionReveal>

          {/* Plano detalhado */}
          <SectionReveal direction="up" delay={150}>
            <div data-tutorial-id="conta-plano">
            <InfoCard
              label={t("plan.sectionTitle")}
              trailing={<SBadge tone={badgeTone}>{statusBadgeLabel}</SBadge>}
            >
              <div className="space-y-3">
                {status === "active" && planNextPayment && (
                  <InfoRow
                    Icon={CreditCard}
                    label={t("plan.nextPayment")}
                    value={formatDate(planNextPayment)}
                  />
                )}
                {status === "late" && (
                  <div className="p-3.5 rounded-spark-xl bg-warn/8 border border-warn/20 text-[13px] text-warn leading-snug font-semibold">
                    {t("plan.latePaymentWarning")}
                  </div>
                )}
                {status === "canceled" && planExpiresAt && (
                  <>
                    <InfoRow
                      Icon={Calendar}
                      label={t("plan.accessUntil")}
                      value={formatDate(planExpiresAt)}
                    />
                    {planCanceledAt && (
                      <InfoRow
                        Icon={Calendar}
                        label={t("plan.canceledAt")}
                        value={formatDate(planCanceledAt)}
                      />
                    )}
                  </>
                )}
              </div>
              <a
                href={KIWIFY_PORTAL_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-spark-surface-sunken hover:bg-spark-brand-soft text-[13px] font-extrabold text-spark-ink hover:text-spark-brand-deep transition-all duration-300 ease-premium hover:-translate-y-0.5"
              >
                {t("plan.kiwifyButton")}
                <ExternalLink size={12} strokeWidth={2.5} />
              </a>
            </InfoCard>
            </div>
          </SectionReveal>

          {/* Edição de perfil identidade (nome + nichos) */}
          <div data-tutorial-id="conta-perfil" className="space-y-5">
            <SectionReveal direction="up" delay={200}>
              <ProfileEditor initialName={name} initialNiche={niche ?? ""} />
            </SectionReveal>

            {/* Sobre mim (bio + redes + cidade + meta) */}
            <SectionReveal direction="up" delay={220}>
              <div id="meta-mensal-anchor" className="transition-shadow duration-500 rounded-spark-2xl">
                <ProfileExtrasEditor
                  initialBio={bio ?? ""}
                  initialInstagram={instagramHandle ?? ""}
                  initialTiktok={tiktokHandle ?? ""}
                  initialCidade={cidadeUf ?? ""}
                  initialMeta={metaMensalBrl}
                  initialWhatsapp={whatsapp}
                  initialWhatsappOptIn={whatsappOptIn}
                />
              </div>
            </SectionReveal>
          </div>

          {/* Faturamento mensal + Ranking opt-in juntos */}
          <div data-tutorial-id="conta-revenue" className="space-y-5">
            <SectionReveal direction="up" delay={240}>
              <RevenueCard metaMensalBrl={metaMensalBrl} />
            </SectionReveal>

            {/* Ranking opt-in */}
            <SectionReveal direction="up" delay={260}>
              <div id="ranking-anchor" className="transition-shadow duration-500 rounded-spark-2xl">
                <RankingOptInCard initialOptIn={rankingOptIn} />
              </div>
            </SectionReveal>
          </div>

          {/* Idioma da interface */}
          <SectionReveal direction="up" delay={245}>
            <LanguageSelector />
          </SectionReveal>

          {/* Alterar senha */}
          {!showReset && (
            <SectionReveal direction="up" delay={250}>
              <ChangePasswordForm />
            </SectionReveal>
          )}

          {/* Logout */}
          <SectionReveal direction="up" delay={300}>
            <div data-tutorial-id="conta-logout" className="rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="group w-full px-5 py-4 flex items-center gap-3.5 text-left hover:bg-bad/5 transition-colors duration-300"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{ background: "oklch(0.96 0.05 25)", color: "oklch(0.6 0.22 25)" }}
                  >
                    <LogOut size={16} strokeWidth={2.2} />
                  </div>
                  <div
                    className="flex-1 text-[14px] font-extrabold"
                    style={{ color: "oklch(0.6 0.22 25)" }}
                  >
                    {t("buttons.logout")}
                  </div>
                </button>
              </form>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest">
      <div className="flex items-center justify-between mb-3">
        <div className="text-eyebrow text-spark-brand">{label}</div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function StatCard({
  emoji,
  Icon,
  value,
  label,
}: {
  emoji: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="p-4 rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-lift">
      <div className="text-[20px] leading-none">{emoji}</div>
      <div
        className="mt-2 font-extrabold font-mono tracking-tight text-spark-ink leading-none"
        style={{ fontSize: "clamp(1.5rem, 5vw, 1.625rem)" }}
      >
        {value}
      </div>
      <div className="text-[10.5px] text-spark-ink-50 font-extrabold mt-1.5 inline-flex items-center gap-1 uppercase tracking-wider">
        <Icon size={10} strokeWidth={2.5} /> {label}
      </div>
    </div>
  );
}

function InfoRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-spark-xl bg-spark-surface-sunken text-spark-ink-70 flex items-center justify-center shrink-0">
        <Icon size={14} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-spark-ink-50">
          {label}
        </div>
        <div className="text-[13.5px] font-extrabold text-spark-ink truncate">{value}</div>
      </div>
    </div>
  );
}

export default async function ContaPage({ searchParams }: ContaPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const showReset = params.reset === "1" || profile.must_reset_password === true;
  const stats = await getStats(profile.id);

  const body = (desktop: boolean) => (
    <ContaBody
      desktop={desktop}
      email={profile.email}
      name={profile.name ?? ""}
      niche={profile.niche}
      avatarUrl={profile.avatar_url ?? null}
      bio={profile.bio ?? null}
      instagramHandle={profile.instagram_handle ?? null}
      tiktokHandle={profile.tiktok_handle ?? null}
      cidadeUf={profile.cidade_uf ?? null}
      metaMensalBrl={
        profile.meta_mensal_brl != null ? Number(profile.meta_mensal_brl) : null
      }
      rankingOptIn={profile.ranking_opt_in ?? false}
      whatsapp={profile.whatsapp ?? ""}
      whatsappOptIn={profile.whatsapp_opt_in ?? true}
      planActive={profile.plan_active}
      planStatus={profile.plan_status ?? null}
      planExpiresAt={profile.plan_expires_at ?? null}
      planNextPayment={profile.plan_next_payment ?? null}
      planCanceledAt={profile.plan_canceled_at ?? null}
      showReset={showReset}
      createdAt={profile.created_at}
      planRenewedAt={profile.plan_renewed_at}
      stats={stats}
    />
  );

  return (
    <>
      <ResponsiveShell
        mobile={body(false)}
        desktop={body(true)}
        active="conta"
        customSidebar
      />
      <FloatingMainNav active="conta" />
      <ContaTour />
    </>
  );
}
