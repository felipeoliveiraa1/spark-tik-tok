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
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomNav } from "@/components/layout/bottom-nav";
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
  // SBadge não tem variante "bad" — mapeamos bad → warn (visual amarelo) ou
  // criamos pílula manual mais à frente. Por ora bad vira warn.
  const badgeTone: "good" | "warn" | "neutral" =
    statusTone === "good" ? "good" : statusTone === "neutral" ? "neutral" : "warn";
  return (
    <div className={desktop ? "max-w-[640px]" : ""}>
      {/* Avatar + nome + email + plan */}
      <div className="flex items-center gap-3.5">
        <div
          className={`${desktop ? "w-20 h-20 text-3xl" : "w-16 h-16 text-2xl"} rounded-full text-white flex items-center justify-center font-extrabold bg-brand-grad shrink-0 shadow-[0_8px_22px_-10px_oklch(0.55_0.24_340/0.5)]`}
        >
          {getInitial(name, email)}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-extrabold ${desktop ? "text-[24px]" : "text-[20px]"} truncate`}>
            {name || "Criadora"}
          </div>
          <div className="text-[13px] text-spark-ink-50 font-mono truncate">{email}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
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

      {/* Stats em grid */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <StatCard emoji="📦" Icon={Package} value={stats.products} label="Produtos" />
        <StatCard emoji="✍️" Icon={Pen} value={stats.scripts} label="Scripts" />
        <StatCard emoji="🎓" Icon={GraduationCap} value={stats.aulasVistas} label="Aulas" />
      </div>

      {/* Conta info */}
      <div className="mt-4 bg-spark-surface rounded-[18px] border border-spark-hairline p-4">
        <div className="text-[10.5px] uppercase tracking-[0.08em] font-bold text-spark-ink-50">
          Sua conta
        </div>
        <div className="mt-2.5 space-y-2.5">
          <InfoRow
            Icon={Calendar}
            label="Membro desde"
            value={`${formatDate(createdAt)} (${daysSince(createdAt)} dias)`}
          />
          {planRenewedAt && (
            <InfoRow Icon={Calendar} label="Última renovação" value={formatDate(planRenewedAt)} />
          )}
        </div>
      </div>

      {/* Plano detalhado */}
      <div className="mt-4 bg-spark-surface rounded-[18px] border border-spark-hairline p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10.5px] uppercase tracking-[0.08em] font-bold text-spark-ink-50">
            Plano
          </div>
          <SBadge tone={badgeTone}>{statusBadgeLabel}</SBadge>
        </div>
        <div className="mt-2.5 space-y-2.5">
          {status === "active" && planNextPayment && (
            <InfoRow
              Icon={CreditCard}
              label="Próxima cobrança"
              value={formatDate(planNextPayment)}
            />
          )}
          {status === "late" && (
            <div className="p-3 rounded-xl bg-warn/10 border border-warn/20 text-[13px] text-warn leading-snug">
              ⚠️ A última cobrança ficou pendente. Atualize seu cartão pelo Kiwify pra não perder acesso.
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
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full bg-spark-surface-sunken hover:bg-spark-surface-sunken/80 text-[13px] font-semibold text-spark-ink transition-colors"
        >
          Gerenciar pelo Kiwify <ExternalLink size={12} strokeWidth={2} />
        </a>
      </div>

      {/* Edição de perfil */}
      <ProfileEditor initialName={name} initialNiche={niche ?? ""} />

      {/* Reset senha em destaque (apenas se entrou com senha temporária) */}
      {showReset && (
        <div className="mt-6 p-4 rounded-[18px] bg-spark-brand-soft border border-spark-brand/20">
          <div className="flex items-center gap-2 text-[13px] font-bold text-spark-brand-deep">
            <KeyRound size={16} strokeWidth={1.7} />
            Defina uma senha sua
          </div>
          <p className="text-[12.5px] text-spark-ink-70 mt-1.5">
            Você entrou com a senha temporária. Cria uma nova agora pra ninguém usar a antiga.
          </p>
          <div className="mt-3">
            <ResetPasswordForm />
          </div>
        </div>
      )}

      {/* Alterar senha — disponível sempre */}
      {!showReset && <ChangePasswordForm />}

      {/* Logout */}
      <div className="mt-6 bg-spark-surface rounded-[18px] border border-spark-hairline overflow-hidden">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-spark-surface-sunken transition-colors"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.96 0.05 25)", color: "oklch(0.6 0.22 25)" }}
            >
              <LogOut size={16} strokeWidth={1.7} />
            </div>
            <div className="flex-1 text-[14px] font-semibold" style={{ color: "oklch(0.6 0.22 25)" }}>
              Sair
            </div>
          </button>
        </form>
      </div>
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
    <div className="p-3 rounded-2xl bg-spark-surface border border-spark-hairline">
      <div className="text-[18px] leading-none">{emoji}</div>
      <div className="mt-1.5 font-extrabold font-mono tracking-tight text-[22px] text-spark-ink">
        {value}
      </div>
      <div className="text-[11px] text-spark-ink-50 font-semibold mt-0.5 inline-flex items-center gap-1">
        <Icon size={10} strokeWidth={1.7} /> {label}
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
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-spark-surface-sunken text-spark-ink-70 flex items-center justify-center shrink-0">
        <Icon size={14} strokeWidth={1.7} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] uppercase tracking-[0.08em] font-bold text-spark-ink-50">
          {label}
        </div>
        <div className="text-[13px] font-semibold text-spark-ink truncate">{value}</div>
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

  return (
    <ResponsiveShell
      mobile={
        <>
          <MobileHeader title="Minha conta 💖" back={{ href: "/" }} />
          <div className="flex-1 overflow-auto px-4 pt-2 pb-6">
            <ContaBody
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
          </div>
          <BottomNav active="conta" />
        </>
      }
      desktop={
        <div className="flex-1 overflow-auto py-8 px-12">
          <div className="text-[13px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase">
            💖 Conta
          </div>
          <h1 className="text-[36px] font-extrabold tracking-[-0.02em] mt-1 mb-7">Minha conta 💖</h1>
          <ContaBody
            desktop
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
        </div>
      }
      active="conta"
    />
  );
}
