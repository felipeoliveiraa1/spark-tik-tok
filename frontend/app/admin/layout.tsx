import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth-admin";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AdminTopbar } from "./_components/admin-topbar";
import { NavProgress } from "./_components/nav-progress";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh bg-spark-bg">
      <NavProgress />
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <AdminTopbar />
          <main className="flex-1 px-4 lg:px-10 py-6 lg:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
