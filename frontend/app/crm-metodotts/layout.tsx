import { redirect } from "next/navigation";
import { getCurrentCrmRole } from "@/lib/auth-crm";

export const dynamic = "force-dynamic";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentCrmRole();
  if (!role) {
    redirect("/login?next=/crm-metodotts");
  }

  return (
    <div className="min-h-screen bg-spark-bg text-spark-ink">
      {children}
    </div>
  );
}
