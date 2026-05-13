import { MoreHorizontal, LogOut } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SBadge } from "@/components/atoms/s-badge";
import { getSessionEmail, logoutAction } from "@/lib/auth";

function deriveName(email: string | null): { full: string; initial: string } {
  if (!email) return { full: "Criadora", initial: "C" };
  const local = email.split("@")[0] ?? "criadora";
  const parts = local.split(/[._-]/).filter(Boolean);
  const full = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ") || "Criadora";
  return { full, initial: full.charAt(0).toUpperCase() };
}

function AccountBody({ desktop = false, email, name }: { desktop?: boolean; email: string; name: { full: string; initial: string } }) {
  return (
    <div className={desktop ? "max-w-[560px]" : ""}>
      <div className="flex items-center gap-3.5">
        <div className={`${desktop ? "w-20 h-20 text-3xl" : "w-16 h-16 text-2xl"} rounded-full text-white flex items-center justify-center font-extrabold bg-brand-grad`}>
          {name.initial}
        </div>
        <div>
          <div className={`font-extrabold ${desktop ? "text-[24px]" : "text-[20px]"}`}>{name.full}</div>
          <div className="text-[13px] text-spark-ink-50 font-mono">{email}</div>
          <div className="mt-1.5">
            <SBadge tone="brand">Spark</SBadge>
          </div>
        </div>
      </div>

      <div className="mt-7 bg-spark-surface rounded-[18px] border border-spark-hairline overflow-hidden">
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

async function AccountMobile() {
  const email = (await getSessionEmail()) ?? "demo@spark.com";
  const name = deriveName(email);
  return (
    <>
      <AppHeader TrailingIcon={MoreHorizontal} showAvatar={false} />
      <div className="flex-1 overflow-auto px-4">
        <AccountBody email={email} name={name} />
      </div>
      <BottomNav active="conta" />
    </>
  );
}

async function AccountDesktop() {
  const email = (await getSessionEmail()) ?? "demo@spark.com";
  const name = deriveName(email);
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <div className="text-[13px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase">Conta</div>
      <h1 className="text-[36px] font-extrabold tracking-[-0.02em] mt-1 mb-7">Minha conta</h1>
      <AccountBody desktop email={email} name={name} />
    </div>
  );
}

export default async function ContaPage() {
  return <ResponsiveShell mobile={await AccountMobile()} desktop={await AccountDesktop()} active="conta" />;
}
