import { redirect } from "next/navigation";

/**
 * /chat/[id] → /agentes (backward compat).
 *
 * Conversas antigas redirecionam pra nova vitrine de agentes externos.
 */
export default function ChatConversationLegacyPage() {
  redirect("/agentes");
}
