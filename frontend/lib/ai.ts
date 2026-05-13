import { google } from "@ai-sdk/google";

/**
 * Modelos Gemini por agente. Trade-off custo × qualidade:
 *
 * - **gemini-flash-latest** (≈ 2.5 Flash): rápido, barato, suficiente
 *   pra tool routing simples + cospe markdown. Usado quando o servidor
 *   já injeta determinismo (formatted_response do Virais, ou Q&A direto).
 *
 * - **gemini-2.5-pro**: reasoning + tool calling muito melhor que Flash.
 *   ~5-10× mais caro. Usado onde criatividade ou raciocínio importam:
 *   - Info: precisa decidir quando chamar google_search e cruzar info
 *   - Script: precisa gerar hooks brasileiros com gatilho cerebral —
 *     output é o produto, não pode ser genérico
 *
 * Se algum agente quiser baixar custo, troca pra "gemini-flash-latest"
 * aqui — só esse arquivo muda.
 */

const FLASH = "gemini-flash-latest";
const PRO = "gemini-2.5-pro";

export const models = {
  default: google(FLASH),

  /** Agente Informação: vision + web search → reasoning beneficia */
  info: google(PRO),
  /** Agente Virais: tool forçado + markdown determinístico → Flash basta */
  viral: google(FLASH),
  /** Agente Scripts: gera hooks de neuromarketing → criatividade importa */
  script: google(PRO),
  /** Agente Tira-dúvidas: Q&A simples → Flash suficiente */
  help: google(FLASH),
};

export type SparkModel = keyof typeof models;
