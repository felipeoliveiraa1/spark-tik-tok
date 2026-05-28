import { redirect } from "next/navigation";

/**
 * /rotina → /rotina/hoje
 *
 * A entrada da Rotina TTS é sempre o check-in do dia. As páginas de
 * evolução e referência ficam em sub-rotas.
 */
export default function RotinaIndexPage() {
  redirect("/rotina/hoje");
}
