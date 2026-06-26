/**
 * OCR pra provas de venda TikTok Shop.
 *
 * Usa OpenAI gpt-4o-mini Vision (custo ~$0.001/print) pra detectar se a
 * imagem eh um print real do TikTok Shop mostrando vendas + extrair valor.
 *
 * Faixas de decisao usadas pelo endpoint:
 *   conf >= 90 && salesValue > 0  -> auto_approved
 *   50 <= conf < 90               -> pending (admin revisa)
 *   conf < 50                     -> pending com flag "fake provavel"
 *
 * Fallback: se OPENAI_API_KEY ausente, retorna confidence=0 e o
 * endpoint cria como pending (admin revisa 100%).
 */

export type OcrAnalysis = {
  text: string;
  confidence: number;
  sales_value: number | null;
  is_tiktok_shop: boolean;
  reasoning: string;
};

const SYSTEM_PROMPT = `Você é um analista de prints de TikTok Shop pra um sistema de gamificação onde alunas comprovam vendas reais pra avançar de jornada.

Sua tarefa: analisar a imagem e retornar JSON ESTRITO (sem comentários, sem markdown) com este schema:

{
  "is_tiktok_shop": boolean,
  "sales_value": number | null,
  "confidence": number,
  "reasoning": "string curta em PT-BR"
}

Onde:
- is_tiktok_shop: true se claramente é print do app/site TikTok Shop ou TikTok Seller Center
- sales_value: valor em REAIS (BRL) das vendas mostradas (soma total se houver várias). Null se não tiver número de venda visível.
- confidence: 0-100 indicando sua certeza. Alto (90+) só se tudo está nítido e claramente TikTok Shop com vendas. Médio (50-90) se há ambiguidade. Baixo (<50) se suspeito de fake, screenshot de outro app, ou imagem irrelevante.
- reasoning: 1 frase curta explicando.

NUNCA explique fora do JSON. NUNCA use markdown. RETORNE APENAS O OBJETO JSON.`;

export async function analyzeProofImage(args: {
  imageBase64: string; // sem o prefixo data:
  mimeType: string; // "image/jpeg" | "image/png" | "image/webp"
}): Promise<OcrAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      text: "OPENAI_API_KEY ausente — sem analise automatica",
      confidence: 0,
      sales_value: null,
      is_tiktok_shop: false,
      reasoning: "Vision API nao configurada; admin precisa revisar manualmente",
    };
  }

  try {
    const dataUrl = `data:${args.mimeType};base64,${args.imageBase64}`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise este print e retorne o JSON do schema.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl, detail: "low" },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[ocr] OpenAI ${res.status}: ${body.slice(0, 200)}`);
      return {
        text: `openai_${res.status}`,
        confidence: 0,
        sales_value: null,
        is_tiktok_shop: false,
        reasoning: "Erro na Vision API; revisao manual",
      };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "{}";

    let parsed: Partial<OcrAnalysis> = {};
    try {
      parsed = JSON.parse(raw) as Partial<OcrAnalysis>;
    } catch {
      parsed = {};
    }

    return {
      text: raw.slice(0, 500),
      confidence: typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(100, parsed.confidence))
        : 0,
      sales_value: typeof parsed.sales_value === "number" && parsed.sales_value > 0
        ? parsed.sales_value
        : null,
      is_tiktok_shop: parsed.is_tiktok_shop === true,
      reasoning: typeof parsed.reasoning === "string"
        ? parsed.reasoning.slice(0, 200)
        : "",
    };
  } catch (err) {
    console.warn("[ocr] fetch error:", err);
    return {
      text: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      confidence: 0,
      sales_value: null,
      is_tiktok_shop: false,
      reasoning: "Falha de rede na Vision API; revisao manual",
    };
  }
}

/**
 * Decide o status final da prova baseado no resultado OCR.
 */
export function decideProofStatus(
  analysis: OcrAnalysis,
): "auto_approved" | "pending" {
  if (
    analysis.is_tiktok_shop &&
    analysis.confidence >= 90 &&
    analysis.sales_value !== null &&
    analysis.sales_value > 0
  ) {
    return "auto_approved";
  }
  return "pending";
}
