/**
 * Sistema de tutorial guiado (tour) com spotlight + tooltip.
 *
 * Uso:
 *   1. Define TutorialStep[] com target = valor do atributo data-tutorial-id
 *   2. Adiciona data-tutorial-id="foo" nos elementos alvo
 *   3. Renderiza <TutorialOverlay steps={...} storageKey="home" />
 *   4. Auto-start verifica localStorage; se nao viu, abre. Pra re-abrir, chama
 *      resetTutorial("home") e re-renderiza.
 */

export type TutorialPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "auto"
  | "center";

export type TutorialStep = {
  id: string;
  /** Valor do data-tutorial-id do elemento alvo. Omitir pra step de boas-vindas no centro. */
  target?: string;
  title: string;
  description: string;
  placement?: TutorialPlacement;
  /** Padding ao redor do spotlight em pixels. Default 10. */
  padding?: number;
  /** Border radius do spotlight em pixels. Default 16. */
  radius?: number;
};

const PREFIX = "tts-tutorial-v1-";

export function hasSeenTutorial(key: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(`${PREFIX}${key}`) === "1";
  } catch {
    return true;
  }
}

export function markTutorialSeen(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, "1");
  } catch {
    /* ignore */
  }
}

export function resetTutorial(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    /* ignore */
  }
}
