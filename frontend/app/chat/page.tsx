import { redirect } from "next/navigation";

/**
 * /chat → /agentes (backward compat).
 *
 * O chat interno foi removido. Os agentes agora rodam direto no
 * ChatGPT/Gemini. Essa rota legada redireciona pra nova /agentes.
 */
export default function ChatLegacyPage() {
  redirect("/agentes");
}
