import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { models } from "@/lib/ai";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/products/save-from-text
 *   body: { text: string }
 *
 * Pega o texto da ficha gerada pela Info no chat e extrai os 14 campos
 * estruturados usando Gemini Flash em modo `generateObject` (schema Zod
 * estrito). Independe de tool calling. Salva direto via supabase.
 *
 * Endpoint pra botão "Salvar produto" que aparece abaixo da mensagem
 * da Info quando ela gera ficha.
 */

const ProductSchema = z.object({
  name: z.string().min(1).max(200).describe("Nome do produto."),
  category: z.string().describe("Categoria principal."),
  target_audience: z
    .string()
    .describe("Público-alvo em 1-2 frases (idade, gênero, perfil)."),
  pain_points: z.array(z.string()).min(1).max(8).describe("Dores que resolve."),
  strengths: z.array(z.string()).min(1).max(8).describe("Pontos fortes."),
  price_range: z.string().describe("Faixa de preço estimada BR."),
  competitors: z.array(z.string()).min(1).max(8).describe("Concorrentes."),
  differentiators: z
    .array(z.string())
    .min(1)
    .max(8)
    .describe("Diferenciais únicos."),
  objections: z.array(z.string()).min(1).max(8).describe("Objeções a quebrar."),
  emotional_triggers: z
    .array(z.string())
    .min(1)
    .max(8)
    .describe("Gatilhos emocionais."),
  usage_moments: z.array(z.string()).min(1).max(6).describe("Momentos de uso."),
  content_angles: z
    .array(z.string())
    .min(1)
    .max(8)
    .describe("Ângulos de conteúdo."),
  hook_ideas: z.array(z.string()).min(1).max(8).describe("Hooks prontos."),
  seasonality: z.string().describe("Sazonalidade em 1 frase."),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { text?: string };
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text || text.length < 80) {
    return NextResponse.json(
      { error: "text_too_short", detail: "A ficha precisa ter conteúdo." },
      { status: 400 },
    );
  }

  // Usa Gemini Flash com generateObject (schema Zod estrito). Esse path NÃO
  // depende de tool calling — o SDK força o modelo a retornar JSON que valida
  // contra o schema. Confiável pra extração estruturada.
  let extracted: z.infer<typeof ProductSchema>;
  try {
    const result = await generateObject({
      model: models.info,
      schema: ProductSchema,
      system:
        "Você extrai dados estruturados de uma ficha de produto que foi gerada por outro agente. Use APENAS o que está no texto. Se algum campo não estiver explícito, INFIRA com base no nome + categoria + mercado BR. Todos os campos são obrigatórios. Português brasileiro.",
      prompt: `Texto da ficha:\n\n${text}`,
      temperature: 0.2,
    });
    extracted = result.object;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "extract_failed";
    console.error("[save-from-text/product] extract falhou", msg);
    return NextResponse.json(
      { error: "extract_failed", detail: msg },
      { status: 500 },
    );
  }

  // Dedup: se já existe produto com o mesmo nome (case-insensitive), retorna
  // o existente em vez de duplicar.
  const nameTrim = extracted.name.trim().slice(0, 200);
  const { data: existing } = await supabase
    .from("products")
    .select("id, name")
    .eq("user_id", user.id)
    .ilike("name", nameTrim)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      ok: true,
      id: existing.id,
      name: existing.name,
      url: `/produtos/${existing.id}`,
      already_existed: true,
    });
  }

  const { data: saved, error } = await supabase
    .from("products")
    .insert({
      user_id: user.id,
      name: nameTrim,
      category: extracted.category,
      target_audience: extracted.target_audience,
      pain_points: extracted.pain_points,
      strengths: extracted.strengths,
      price_range: extracted.price_range,
      competitors: extracted.competitors,
      differentiators: extracted.differentiators,
      objections: extracted.objections,
      emotional_triggers: extracted.emotional_triggers,
      usage_moments: extracted.usage_moments,
      content_angles: extracted.content_angles,
      hook_ideas: extracted.hook_ideas,
      seasonality: extracted.seasonality,
      raw_analysis: extracted,
    })
    .select("id, name")
    .single();

  if (error || !saved) {
    return NextResponse.json(
      { error: error?.message ?? "insert_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    id: saved.id,
    name: saved.name,
    url: `/produtos/${saved.id}`,
  });
}
