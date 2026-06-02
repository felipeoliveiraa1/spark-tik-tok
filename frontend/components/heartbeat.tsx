import { getCurrentUser } from "@/lib/supabase-server";
import { heartbeat } from "@/lib/track";

/**
 * Server Component invisivel que atualiza profiles.last_seen_at sempre
 * que a aluna acessa qualquer rota autenticada. Throttle de 5min e
 * gerenciado em memoria pelo helper heartbeat(); aqui so chamamos.
 *
 * Renderiza null — uso eh "import e plug no layout".
 */
export async function Heartbeat() {
  const user = await getCurrentUser();
  if (user?.id) heartbeat(user.id);
  return null;
}
