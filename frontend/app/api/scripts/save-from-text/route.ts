import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/scripts/save-from-text
 *   body: { text: string, productId?: string | null, title?: string }
 *
 * Parseia roteiros formatados em markdown direto do texto gerado pelo
 * agente Scripts. Endpoint pra botão "Salvar roteiros" que a aluna
 * clica abaixo da mensagem. Não depende de tool calling do modelo.
 *
 * Formato esperado (mesmo do prompt do Scripts):
 *   **ROTEIRO 1 — Estilo: fofoca** (~30s)
 *   🎣 **Gancho** (3s)
 *   <texto>
 *   💡 **Desenvolvimento**
 *   <texto>
 *   ✨ **Benefício**
 *   <texto>
 *   💕 **CTA**
 *   <texto>
 */

type ParsedScript = {
  n: number;
  style: string;
  hook: string;
  development: string;
  benefit: string;
  cta: string;
};

function parseScriptsFromMarkdown(text: string): ParsedScript[] {
  const blockRegex =
    /\*\*\s*ROTEIRO\s+(\d+)\s*[—–-]\s*Estilo:\s*([^*\n(]+?)\s*\*\*[\s\S]*?(?=\*\*\s*ROTEIRO\s+\d+\s*[—–-]|$)/gi;

  const extractByMarker = (block: string, marker: RegExp): string => {
    const matches = [...block.matchAll(marker)];
    if (matches.length === 0) return "";
    const m = matches[0];
    const startIdx = (m.index ?? 0) + m[0].length;
    const rest = block.slice(startIdx);
    const nextMarker = rest.match(/(🎣|💡|✨|💕|─{3,})/);
    const end = nextMarker?.index ?? rest.length;
    return rest.slice(0, end).trim();
  };

  const out: ParsedScript[] = [];
  for (const m of text.matchAll(blockRegex)) {
    const n = parseInt(m[1], 10);
    const style = m[2].trim().toLowerCase();
    const block = m[0];
    const hook = extractByMarker(block, /🎣\s*\*\*[^*]*\*\*[^\n]*\n?/g);
    const development = extractByMarker(block, /💡\s*\*\*[^*]*\*\*[^\n]*\n?/g);
    const benefit = extractByMarker(block, /✨\s*\*\*[^*]*\*\*[^\n]*\n?/g);
    const cta = extractByMarker(block, /💕\s*\*\*[^*]*\*\*[^\n]*\n?/g);
    if (hook && development && benefit && cta) {
      out.push({ n, style, hook, development, benefit, cta });
    }
  }
  return out;
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { text?: string; productId?: string | null; title?: string };
  try {
    body = (await request.json()) as {
      text?: string;
      productId?: string | null;
      title?: string;
    };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "missing_text" }, { status: 400 });
  }

  const parsed = parseScriptsFromMarkdown(body.text);
  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "no_scripts_found", detail: "Nenhum roteiro detectado no texto." },
      { status: 400 },
    );
  }

  // Resolve product_id e title
  let productId = body.productId ?? null;
  let productName: string | null = null;
  if (productId) {
    const { data: p } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", productId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (p) {
      productName = p.name;
    } else {
      productId = null; // produto não pertence à aluna ou não existe
    }
  }

  const title =
    body.title?.trim() ||
    `${parsed.length} roteiros${productName ? ` · ${productName}` : ""}`;

  // Dedup por hash do conteúdo. Se a aluna clicar 2x no mesmo botão de
  // "Salvar roteiros", retorna o registro já criado em vez de duplicar.
  // Hash leva em conta os roteiros parseados (canonicalizados) — pequenas
  // variações de markdown no input não geram nova entrada.
  const hash = createHash("sha1")
    .update(JSON.stringify(parsed))
    .digest("hex")
    .slice(0, 16);

  const { data: existing } = await supabase
    .from("generated_scripts")
    .select("id, title")
    .eq("user_id", user.id)
    .eq("model", `manual-save:${hash}`)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      ok: true,
      id: existing.id,
      title: existing.title,
      url: `/scripts/${existing.id}`,
      count: parsed.length,
      already_existed: true,
    });
  }

  const { data: saved, error } = await supabase
    .from("generated_scripts")
    .insert({
      user_id: user.id,
      product_id: productId,
      title,
      hooks: parsed,
      // Inclui o hash no model pra usar como índice de dedup. Não muda
      // schema — model é text livre.
      model: `manual-save:${hash}`,
    })
    .select("id, title")
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
    title: saved.title,
    url: `/scripts/${saved.id}`,
    count: parsed.length,
  });
}
