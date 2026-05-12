import { vyralFetch } from "./api.js";

/**
 * Vyral's AI-driven insight extractor. Given a raw transcription, it returns
 * the four classic copywriting beats (gancho/problema/solução/CTA) plus a
 * reusable template with [PREÇO]-style placeholders.
 *
 * Endpoint: POST https://api.vyral.codgital.site/dashboard/insights/analyze
 * Status:   201 Created
 * Body:     { "transcription": "<raw text>" }
 */

export type VyralInsightResponse = {
  insight: {
    gancho: string;
    problema: string;
    solucao: string;
    cta: string;
  };
  contexto: string;
  template: string;
};

export async function analyzeInsight(transcription: string): Promise<VyralInsightResponse> {
  return vyralFetch<VyralInsightResponse>({
    host: "api",
    method: "POST",
    path: "/dashboard/insights/analyze",
    body: { transcription },
  });
}
