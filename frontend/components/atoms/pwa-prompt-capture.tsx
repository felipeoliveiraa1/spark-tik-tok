"use client";

import * as React from "react";
import { captureGlobalPwaPrompt } from "@/lib/pwa-prompt";

/**
 * Componente client invisivel que registra captura global do
 * beforeinstallprompt assim que o app monta. Monta uma unica vez no
 * RootLayout pra garantir que o evento (que so dispara 1x por sessao
 * no Chrome) seja capturado antes do usuario abrir o menu de instalacao.
 */
export function PwaPromptCapture() {
  React.useEffect(() => {
    return captureGlobalPwaPrompt();
  }, []);
  return null;
}
