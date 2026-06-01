/**
 * Captura global do evento beforeinstallprompt (Android Chrome).
 *
 * O Chrome dispara esse evento UMA vez quando a pagina carrega, e se
 * ninguem chamar preventDefault + guardar a referencia, ele evapora.
 * Por isso a captura precisa rodar o quanto antes — idealmente no
 * RootLayout — e nao quando o modal de instalacao abre.
 *
 * Uso:
 *   1. Registrar o listener uma vez globalmente (PwaPromptCapture)
 *   2. Componentes que queiram disparar chamam getDeferredPwaPrompt()
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function captureGlobalPwaPrompt(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    e.preventDefault();
    window.__pwaPrompt = e as BeforeInstallPromptEvent;
  };
  window.addEventListener("beforeinstallprompt", handler);
  // Limpa quando o app é instalado
  const installedHandler = () => {
    window.__pwaPrompt = null;
  };
  window.addEventListener("appinstalled", installedHandler);
  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
    window.removeEventListener("appinstalled", installedHandler);
  };
}

export function getDeferredPwaPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  return window.__pwaPrompt ?? null;
}

export function clearDeferredPwaPrompt(): void {
  if (typeof window === "undefined") return;
  window.__pwaPrompt = null;
}
