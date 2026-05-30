/**
 * Sistema de tutorial guiado (tour) com spotlight + tooltip.
 *
 * Persistencia: campo `tutorials_seen text[]` no profile via API
 * /api/me/tutorials. localStorage serve como cache pra resposta instantanea
 * (evita piscar o tour no auto-start enquanto o GET assenta) e fallback
 * offline.
 *
 * Uso:
 *   1. Define TutorialStep[] com target = valor do atributo data-tutorial-id
 *   2. Adiciona data-tutorial-id="foo" nos elementos alvo
 *   3. Renderiza <TutorialOverlay steps={...} storageKey="home" />
 *   4. Auto-start verifica localStorage + server; se nao viu, abre.
 *      Pra refazer, basta abrir externalmente (open=true) — o save no banco
 *      eh idempotente, nao precisa "resetar".
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
const SEEN_LIST_CACHE = "tts-tutorial-v1-__list__";

// =================================================================
// CACHE LOCAL (sincrono — usado pelo auto-start pra evitar piscar)
// =================================================================

/**
 * Checa local cache imediato. Use isso no useEffect inicial pra decidir
 * se ja DA pra rejeitar abrir o tour sem esperar fetch. Combinar com
 * hasSeenTutorialRemote(key) pra verificar o server depois.
 */
export function hasSeenTutorialLocal(key: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(`${PREFIX}${key}`) === "1";
  } catch {
    return true;
  }
}

function setLocalSeen(key: string, seen: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (seen) window.localStorage.setItem(`${PREFIX}${key}`, "1");
    else window.localStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    /* ignore */
  }
}

function setSeenListCache(list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_LIST_CACHE, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

// =================================================================
// SERVER (assincrono — fonte de verdade)
// =================================================================

/**
 * Busca lista completa de tours vistos no servidor. Atualiza cache local
 * com tudo que vier (pra próximos auto-starts serem instantâneos).
 * Retorna [] se nao autenticada ou erro.
 */
export async function fetchSeenTutorials(): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/me/tutorials", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { seen?: unknown };
    const seen = Array.isArray(data.seen)
      ? data.seen.filter((k): k is string => typeof k === "string")
      : [];
    // Sync local cache pra cada key
    setSeenListCache(seen);
    for (const k of seen) setLocalSeen(k, true);
    return seen;
  } catch {
    return [];
  }
}

/**
 * Marca tour como visto no servidor + cache local. Idempotente.
 */
export async function markTutorialSeen(key: string): Promise<void> {
  setLocalSeen(key, true);
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/me/tutorials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  } catch {
    /* fallback fica so no local */
  }
}

/**
 * Remove tour da lista de vistos (refaz auto-start). Idempotente.
 */
export async function resetTutorial(key: string): Promise<void> {
  setLocalSeen(key, false);
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/me/tutorials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  } catch {
    /* fallback fica so no local */
  }
}
