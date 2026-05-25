import { createClient } from "@supabase/supabase-js";
import { type AgentId } from "@/lib/agents";

/**
 * Tracking de uso da Gemini API por aluna/agente.
 * Insere na tabela ai_usage cada call que termina, com tokens e custo
 * estimado em USD. Usado pra:
 *   - Dashboard admin (/admin/usage) — quem gastou quanto
 *   - Calcular margem por plano
 *   - Identificar abuso (aluna que gera 1000 scripts/dia)
 *
 * Chamado no `onFinish` do streamText. Erros são logados mas não quebram
 * o chat — tracking é best-effort.
 */

// Pricing Gemini API (USD por 1M tokens). Atualizar quando Google mexer.
const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
  "gemini-flash-latest": { input: 0.3, output: 2.5 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-flash-lite-latest": { input: 0.1, output: 0.4 },
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type RecordUsageInput = {
  userId: string;
  agent: AgentId;
  model: string;
  promptTokens: number;
  completionTokens: number;
};

/**
 * Calcula custo em USD baseado em tokens + tabela de pricing.
 * Retorna 0 se modelo desconhecido (log de aviso).
 */
function calcCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const price = PRICING[model];
  if (!price) {
    console.warn(`[ai-usage] modelo desconhecido pra pricing: ${model}`);
    return 0;
  }
  const inputCost = (promptTokens / 1_000_000) * price.input;
  const outputCost = (completionTokens / 1_000_000) * price.output;
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Registra uma chamada da IA. Best-effort: erros são logados, não jogam.
 */
export async function recordUsage(input: RecordUsageInput): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;

  const costUsd = calcCostUsd(input.model, input.promptTokens, input.completionTokens);

  try {
    const { error } = await supabase.from("ai_usage").insert({
      user_id: input.userId,
      agent: input.agent,
      model: input.model,
      prompt_tokens: input.promptTokens,
      completion_tokens: input.completionTokens,
      cost_usd: costUsd,
    });
    if (error) {
      console.warn("[ai-usage] insert falhou", error.message);
    }
  } catch (err) {
    console.warn("[ai-usage] erro inesperado", err);
  }
}
