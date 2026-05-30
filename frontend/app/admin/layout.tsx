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
      <header className="sticky top-0 z-30 border-b border-spark-hairline backdrop-blur-md bg-spark-surface-elev/85 px-4 lg:px-12 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex">
            <SparkWordmark size={32} />
          </Link>
          <span className="text-eyebrow text-spark-brand">
            ✦ admin
          </span>
        </div>
        <nav className="flex items-center gap-1 text-[12.5px] font-extrabold">
          <AdminNavLink href="/admin">Painel</AdminNavLink>
          <AdminNavLink href="/admin/news">News</AdminNavLink>
          <AdminNavLink href="/admin/educacao">Aulas</AdminNavLink>
          <AdminNavLink href="/admin/ao-vivo">Ao vivo</AdminNavLink>
          <AdminNavLink href="/admin/feedback">Feedback</AdminNavLink>
          <Link
            href="/"
            className="ml-2 inline-flex items-center px-3 py-1.5 rounded-full glass border border-spark-hairline text-spark-ink-70 hover:text-spark-ink hover:-translate-y-0.5 transition-all duration-300 ease-premium"
          >
            ← App
          </Link>
        </nav>
      </header>
      <main className="flex-1 overflow-auto p-4 lg:p-10">{children}</main>
    </div>
  );
}

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-full text-spark-ink-70 hover:text-spark-brand-deep hover:bg-spark-brand-soft/60 transition-all duration-300 ease-premium"
    >
      {children}
    </Link>
  );
}
