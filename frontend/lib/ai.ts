import { google } from "@ai-sdk/google";

/**
 * Shared Gemini model handles for the four Spark agents.
 *
 * We default everything to the latest Flash (cheap, fast, multimodal, PT-BR
 * fluent). When the Scripts agent's output ever feels too generic, swap its
 * binding here to `gemini-2.5-pro` — that's the only knob.
 *
 * Using `gemini-flash-latest` (a moving alias) instead of a pinned 2.0/2.5
 * lets us inherit Google's incremental improvements without a code change,
 * and matches the model name that ships with the free tier on most projects.
 */

const FLASH_MODEL_ID = "gemini-flash-latest";

export const models = {
  /** Catch-all default — used by every agent that didn't override. */
  default: google(FLASH_MODEL_ID),

  /** Agente Informação (vision-enabled product analysis). */
  info: google(FLASH_MODEL_ID),
  /** Agente Virais (parsing of transcriptions + filters). */
  viral: google(FLASH_MODEL_ID),
  /** Agente Scripts (neuromarketing hooks — keep flagged for upgrade). */
  script: google(FLASH_MODEL_ID),
  /** Agente Tira-dúvidas (TikTok Shop Q&A). */
  help: google(FLASH_MODEL_ID),
};

export type SparkModel = keyof typeof models;
