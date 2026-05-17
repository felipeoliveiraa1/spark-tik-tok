import { redirect } from "next/navigation";
import Link from "next/link";
import { isCurrentUserAdmin } from "@/lib/auth-admin";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh flex flex-col bg-spark-bg">
      <header className="border-b border-spark-hairline bg-spark-surface-elev px-4 lg:px-12 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex">
            <SparkWordmark size={20} />
          </Link>
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-spark-brand">
            🛠️ Admin
          </span>
        </div>
        <nav className="flex items-center gap-3 text-[13px] font-semibold">
          <Link href="/admin" className="text-spark-ink-70 hover:text-spark-ink">
            Painel
          </Link>
          <Link href="/admin/news" className="text-spark-ink-70 hover:text-spark-ink">
            📰 News
          </Link>
          <Link href="/admin/educacao" className="text-spark-ink-70 hover:text-spark-ink">
            🎓 Aulas
          </Link>
          <Link href="/" className="text-spark-ink-50 hover:text-spark-ink">
            ← App
          </Link>
        </nav>
      </header>
      <main className="flex-1 overflow-auto p-4 lg:p-10">{children}</main>
    </div>
  );
}
