import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// /admin/leads foi substituido pelo CRM completo em /crm-metodotts.
// Redirect mantem bookmarks/links antigos funcionando.
export default function AdminLeadsRedirect() {
  redirect("/crm-metodotts");
}
