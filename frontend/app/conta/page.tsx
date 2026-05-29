import { redirect } from "next/navigation";
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

function getInitial(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email;
  return source.charAt(0).toUpperCase();
}

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

function ContaBody({
  desktop = false,
  email,
  name,
  niche,
  planActive,
  planStatus,
  planExpiresAt,
  planNextPayment,
  planCanceledAt,
  showReset,
  createdAt,
  planRenewedAt,
  stats,
}: {
  desktop?: boolean;
  email: string;
  name: string;
  niche: string | null;
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
            <div className="text-eyebrow text-spark-brand">✦ meu perfil</div>
          </SectionReveal>

          <SectionReveal direction="up" delay={100} durationMs={800}>
            <h1
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
              style={{
                fontSize: desktop ? "clamp(2.5rem, 5vw, 4rem)" : "clamp(2rem, 8vw, 3rem)",
              }}
            >
              minha <span className="text-grad-brand">conta.</span>
            </h1>
          </SectionReveal>

          {/* Avatar + nome card */}
          <SectionReveal direction="up" delay={250}>
            <div className="mt-7 flex items-center gap-4 p-5 rounded-spark-2xl glass border border-spark-hairline shadow-rest">
              <div
                className={`${desktop ? "w-20 h-20 text-3xl" : "w-16 h-16 text-2xl"} rounded-full text-white flex items-center justify-center font-display bg-brand-grad shrink-0 shadow-lift-brand`}
              >
                {getInitial(name, email)}
              </div>
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
          {/* Stats em grid */}
          <SectionReveal direction="up">
            <div className="grid grid-cols-3 gap-3">
              <StatCard emoji="📦" Icon={Package} value={stats.products} label="Produtos" />
              <StatCard emoji="✍️" Icon={Pen} value={stats.scripts} label="Scripts" />
              <StatCard
                emoji="🎓"
                Icon={GraduationCap}
                value={stats.aulasVistas}
                label="Aulas"
              />
            </div>
          </SectionReveal>

          {/* Conta info */}
          <SectionReveal direction="up" delay={100}>
            <InfoCard label="✦ sua conta">
              <div className="space-y-3">
                <InfoRow
                  Icon={Calendar}
                  label="Membro desde"
                  value={`${formatDate(createdAt)} (${daysSince(createdAt)} dias)`}
                />
                {planRenewedAt && (
                  <InfoRow
                    Icon={Calendar}
                    label="Última renovação"
                    value={formatDate(planRenewedAt)}
                  />
                )}
              </div>
            </InfoCard>
          </SectionReveal>

          {/* Plano detalhado */}
          <SectionReveal direction="up" delay={150}>
            <InfoCard
              label="✦ plano"
              trailing={<SBadge tone={badgeTone}>{statusBadgeLabel}</SBadge>}
            >
              <div className="space-y-3">
                {status === "active" && planNextPayment && (
                  <InfoRow
                    Icon={CreditCard}
                    label="Próxima cobrança"
                    value={formatDate(planNextPayment)}
                  />
                )}
                {status === "late" && (
                  <div className="p-3.5 rounded-spark-xl bg-warn/8 border border-warn/20 text-[13px] text-warn leading-snug font-semibold">
                    ⚠️ A última cobrança ficou pendente. Atualize seu cartão pelo Kiwify pra
                    não perder acesso.
                  </div>
                )}
                {status === "canceled" && planExpiresAt && (
                  <>
                    <InfoRow
                      Icon={Calendar}
                      label="Acesso até"
                      value={formatDate(planExpiresAt)}
                    />
                    {planCanceledAt && (
                      <InfoRow
                        Icon={Calendar}
                        label="Cancelado em"
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
                Gerenciar pelo Kiwify
                <ExternalLink size={12} strokeWidth={2.5} />
              </a>
            </InfoCard>
          </SectionReveal>

          {/* Edição de perfil */}
          <SectionReveal direction="up" delay={200}>
            <ProfileEditor initialName={name} initialNiche={niche ?? ""} />
          </SectionReveal>

          {/* Reset senha em destaque */}
          {showReset && (
            <SectionReveal direction="up" delay={250}>
              <div className="p-6 rounded-spark-2xl bg-brand-grad-soft border border-spark-brand/20 shadow-lift-brand">
                <div className="flex items-center gap-2 text-[14px] font-extrabold text-spark-brand-deep">
                  <KeyRound size={16} strokeWidth={2.2} />
                  Defina uma senha sua
                </div>
                <p className="text-[12.5px] text-spark-ink-70 mt-2 leading-relaxed">
                  Você entrou com a senha temporária. Cria uma nova agora pra ninguém usar a
                  antiga.
                </p>
                <div className="mt-4">
                  <ResetPasswordForm />
                </div>
              </div>
            </SectionReveal>
          )}

          {/* Alterar senha */}
          {!showReset && (
            <SectionReveal direction="up" delay={250}>
              <ChangePasswordForm />
            </SectionReveal>
          )}

          {/* Logout */}
          <SectionReveal direction="up" delay={300}>
            <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline overflow-hidden shadow-rest">
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
                    Sair
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
    </>
  );
}
