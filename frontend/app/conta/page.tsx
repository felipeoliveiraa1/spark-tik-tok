import { redirect } from "next/navigation";
import { MoreHorizontal, LogOut, KeyRound } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SBadge } from "@/components/atoms/s-badge";
import { getCurrentProfile } from "@/lib/supabase-server";
import { logoutAction } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

type ContaPageProps = {
  searchParams?: Promise<{ reset?: string }>;
};

function getInitial(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email;
  return source.charAt(0).toUpperCase();
}

function ContaBody({
  desktop = false,
  email,
  name,
  niche,
  planActive,
  showReset,
}: {
  desktop?: boolean;
  email: string;
  name: string;
  niche: string | null;
  planActive: boolean;
  showReset: boolean;
}) {
  return (
    <div className={desktop ? "max-w-[560px]" : ""}>
      <div className="flex items-center gap-3.5">
        <div className={`${desktop ? "w-20 h-20 text-3xl" : "w-16 h-16 text-2xl"} rounded-full text-white flex items-center justify-center font-extrabold bg-brand-grad`}>
          {getInitial(name, email)}
        </div>
        <div>
          <div className={`font-extrabold ${desktop ? "text-[24px]" : "text-[20px]"}`}>{name || "Criadora"}</div>
          <div className="text-[13px] text-spark-ink-50 font-mono">{email}</div>
          <div className="mt-1.5 flex gap-1.5">
            <SBadge tone={planActive ? "good" : "warn"}>{planActive ? "Plano ativo ✨" : "Plano inativo"}</SBadge>
            {niche && <SBadge>{niche}</SBadge>}
          </div>
        </div>
      </div>

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

      <div className="mt-6 bg-spark-surface rounded-[18px] border border-spark-hairline overflow-hidden">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-spark-surface-sunken transition-colors"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
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

export default async function ContaPage({ searchParams }: ContaPageProps) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const showReset = params.reset === "1" || profile.must_reset_password === true;

  return (
    <ResponsiveShell
      mobile={
        <>
          <AppHeader TrailingIcon={MoreHorizontal} showAvatar={false} />
          <div className="flex-1 overflow-auto px-4">
            <ContaBody
              email={profile.email}
              name={profile.name ?? ""}
              niche={profile.niche}
              planActive={profile.plan_active}
              showReset={showReset}
            />
          </div>
          <BottomNav active="conta" />
        </>
      }
      desktop={
        <div className="flex-1 overflow-auto py-8 px-12">
          <div className="text-[13px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase">💖 Conta</div>
          <h1 className="text-[36px] font-extrabold tracking-[-0.02em] mt-1 mb-7">Minha conta 💖</h1>
          <ContaBody
            desktop
            email={profile.email}
            name={profile.name ?? ""}
            niche={profile.niche}
            planActive={profile.plan_active}
            showReset={showReset}
          />
        </div>
      }
      active="conta"
    />
  );
}
