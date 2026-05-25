import { google } from "@ai-sdk/google";

/**
 * Modelos Gemini por agente. Trade-off custo × qualidade:
 *
 * Pricing (USD por 1M tokens):
 *   PRO        = $1.25 in / $10.00 out  — reasoning + criatividade
 *   FLASH      = $0.30 in / $2.50  out  — vision + Q&A estruturado (4x mais barato)
 *   FLASH_LITE = $0.10 in / $0.40  out  — Q&A simples, classificação (25x mais barato)
 *
 * Decisão por agente:
 * - Info: Flash (vision OK, schema rico funciona com Flash, economia grande)
 * - Scripts: Pro (criatividade dos roteiros é o produto — output é o que vende)
 * - Help: Flash-Lite (Q&A direto, sem reasoning pesado)
 *
 * Pra reverter algum: troca a const no models{} abaixo.
 */

const PRO = "gemini-2.5-pro";
const FLASH = "gemini-flash-latest";
const FLASH_LITE = "gemini-flash-lite-latest";

export const models = {
  default: google(FLASH),

  /** Análise de produto: vision + estruturação JSON rica. Flash dá conta. */
  info: google(FLASH),

  /** Virais (oculto). Mantido caso reativem. */
  viral: google(FLASH),

  /** Scripts: criatividade dos 5 roteiros é o produto que a aluna paga. Pro. */
  script: google(PRO),

  /** Tira-dúvidas: Q&A direto sobre TikTok Shop. Flash-Lite suficiente. */
  help: google(FLASH_LITE),
};

export type SparkModel = keyof typeof models;
