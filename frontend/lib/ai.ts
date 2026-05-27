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
 * - Help: Flash (suporte real exige seguir prompt longo + tools — Flash-Lite
 *   alucinava em dúvidas complexas e ignorava o knowledge base)
 *
 * Pra reverter algum: troca a const no models{} abaixo.
 */

const PRO = "gemini-2.5-pro";
const FLASH = "gemini-flash-latest";

export const models = {
  default: google(FLASH),

  /** Análise de produto: vision + estruturação JSON rica. Flash dá conta. */
  info: google(FLASH),

  /** Virais (oculto). Mantido caso reativem. */
  viral: google(FLASH),

  /** Scripts: PRO. Tentamos Flash mas qualidade dos roteiros caiu —
   *  voltamos pra Pro. Criatividade do output (5 roteiros completos com
   *  framework Yara) é o produto que a aluna paga, vale o custo extra. */
  script: google(PRO),

  /** Tira-dúvidas: precisa seguir prompt longo + chamar tools de leitura
   *  (lista produtos/scripts/virais/conta). Flash-Lite alucinava — Flash. */
  help: google(FLASH),
};

export type SparkModel = keyof typeof models;
