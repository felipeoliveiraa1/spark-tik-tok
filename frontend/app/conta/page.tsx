import Link from "next/link";
import { MoreHorizontal, DollarSign, Gauge, MessageCircle, Lock, LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SectionHead } from "@/components/atoms/section-head";
import { SInput } from "@/components/atoms/s-input";
import { SBadge } from "@/components/atoms/s-badge";
import { USER } from "@/lib/mock";
import { logoutAction } from "@/lib/auth";

const menuItems = [
  { Icon: DollarSign, l: "Plano e cobrança", d: "Pro · R$ 49,90", href: "/conta/plano" },
  { Icon: Gauge, l: "Uso e quotas", d: "32 / 50 scripts", href: "/conta/uso" },
  { Icon: MessageCircle, l: "Ajuda e suporte", d: "", href: "#" },
  { Icon: Lock, l: "Privacidade", d: "", href: "#" },
];

function AccountBody({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className={desktop ? "max-w-[720px]" : ""}>
      <div className="flex items-center gap-3.5">
        <div className={`${desktop ? "w-20 h-20 text-3xl" : "w-16 h-16 text-2xl"} rounded-full text-white flex items-center justify-center font-extrabold bg-brand-grad`}>
          {USER.initial}
        </div>
        <div>
          <div className={`font-extrabold ${desktop ? "text-[24px]" : "text-[20px]"}`}>{USER.fullName}</div>
          <div className="text-[13px] text-spark-ink-50 font-mono">{USER.email}</div>
          <div className="mt-1.5">
            <SBadge tone="brand">Plano Pro</SBadge>
          </div>
        </div>
      </div>

      <div className="mt-[22px]">
        <SectionHead className="px-0">Dados</SectionHead>
      </div>
      <div className={`flex flex-col gap-2.5 ${desktop ? "lg:grid lg:grid-cols-2 lg:gap-3.5" : ""}`}>
        <div>
          <div className="text-[11px] text-spark-ink-50 font-semibold mb-1.5 uppercase tracking-[0.04em]">
            Nome
          </div>
          <SInput defaultValue={USER.fullName} />
        </div>
        <div>
          <div className="text-[11px] text-spark-ink-50 font-semibold mb-1.5 uppercase tracking-[0.04em]">
            Nicho principal
          </div>
          <div className="flex items-center justify-between px-3.5 h-[50px] rounded-[14px] bg-spark-surface border border-spark-border text-[14px] font-semibold">
            {USER.niche}
            <ChevronDown size={16} strokeWidth={1.7} className="text-spark-ink-50" />
          </div>
        </div>
      </div>

      <div className="mt-[22px]">
        <SectionHead className="px-0">Outros</SectionHead>
      </div>
      <div className="bg-spark-surface rounded-[18px] border border-spark-hairline overflow-hidden">
        {menuItems.map((row, i) => (
          <Link
            key={row.l}
            href={row.href}
            className={`px-4 py-3.5 flex items-center gap-3 hover:bg-spark-surface-sunken transition-colors ${i < menuItems.length ? "border-b border-spark-hairline" : ""}`}
          >
            <div className="w-8 h-8 rounded-lg bg-spark-surface-sunken text-spark-ink-70 flex items-center justify-center">
              <row.Icon size={16} strokeWidth={1.7} />
            </div>
            <div className="flex-1 text-[14px] font-semibold">{row.l}</div>
            <div className="text-[12px] text-spark-ink-50 font-mono">{row.d}</div>
            <ChevronRight size={14} strokeWidth={1.7} className="text-spark-ink-35" />
          </Link>
        ))}
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

      <div className="mt-[18px] py-3 text-center text-[11px] text-spark-ink-35 font-mono">
        v1.4.0 · build 2026.05.07
      </div>
    </div>
  );
}

function AccountMobile() {
  return (
    <>
      <AppHeader TrailingIcon={MoreHorizontal} showAvatar={false} />
      <div className="flex-1 overflow-auto px-4">
        <AccountBody />
        <div className="h-3" />
      </div>
      <BottomNav active="conta" />
    </>
  );
}

function AccountDesktop() {
  return (
    <div className="flex-1 overflow-auto py-8 px-12">
      <div className="text-[13px] font-bold text-spark-ink-50 tracking-[0.06em] uppercase">Conta</div>
      <h1 className="text-[36px] font-extrabold tracking-[-0.02em] mt-1 mb-7">Minha conta</h1>
      <AccountBody desktop />
    </div>
  );
}

export default function ContaPage() {
  return <ResponsiveShell mobile={<AccountMobile />} desktop={<AccountDesktop />} active="conta" />;
}
