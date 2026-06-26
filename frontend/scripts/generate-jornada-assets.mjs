#!/usr/bin/env node
/**
 * Gera os assets pixel art da feature Jornadas via OpenAI gpt-image-1.
 *
 * Sai: 7 PNGs em frontend/public/sprites/
 *   - map/overworld.png            (1536x1024 — mapa principal das 3 jornadas)
 *   - map/journey-1-bg.png         (1024x1024 — cenario praia bebê)
 *   - map/journey-2-bg.png         (1024x1024 — cenario vila adolescente)
 *   - map/journey-3-bg.png         (1024x1024 — cenario cidade adulta)
 *   - characters/bebe/idle.png     (1024x1024 — sprite personagem bebê)
 *   - characters/adolescente/idle.png
 *   - characters/adulta/idle.png
 *
 * Custo estimado: ~$0.50-1.00 total (gpt-image-1 standard quality).
 *
 * USO:
 *   cd frontend
 *   OPENAI_API_KEY=sk-... node scripts/generate-jornada-assets.mjs
 *
 *   # so um especifico:
 *   OPENAI_API_KEY=sk-... node scripts/generate-jornada-assets.mjs map
 *   OPENAI_API_KEY=sk-... node scripts/generate-jornada-assets.mjs bebe
 *   OPENAI_API_KEY=sk-... node scripts/generate-jornada-assets.mjs adolescente adulta
 *
 *   # forca regenerar mesmo se ja existe:
 *   OPENAI_API_KEY=sk-... FORCE=1 node scripts/generate-jornada-assets.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error("❌ OPENAI_API_KEY nao definida. Set pelo env e tenta de novo.");
  process.exit(1);
}

const FORCE = process.env.FORCE === "1";
const SPRITES_DIR = path.join(process.cwd(), "public", "sprites");

// Paleta canônica do design system Spark
const COLORS = "soft pastel palette: rose pink #fdb4c2, peach #ffd6a8, lilac purple #d4a8ff, cream white #fff8f3";
const STYLE_BASE = `16-bit pixel art, retro game sprite style like Stardew Valley and Pokémon Gold/Silver, ${COLORS}, no text or letters, no smoothing, crisp pixel edges`;

const ASSETS = {
  map: {
    file: "map/overworld.png",
    size: "1536x1024",
    background: "opaque",
    prompt: `Top-down pixel art overworld map showing a continuous journey path through three themed areas, connected by a winding cobblestone road with small flags at checkpoints.

Left third (Jornada 1 - "Praia da Iniciante"): pastel pink sand beach with palm trees, seashells scattered, soft blue tile water, a small wooden cradle/playpen icon, cozy and welcoming. Tag: BEBÊ area.

Middle third (Jornada 2 - "Vila Adolescente"): small purple-lavender town with 2-3 cute pixel houses, a flower garden, a phone/store shop with bright pink awning, a small stage for performance. Tag: ADOLESCENTE area.

Right third (Jornada 3 - "Cidade Adulta"): modern small skyline with 2-3 buildings, a coffee shop with steaming cup, a laptop store, ambitious sunset sky with golden orange clouds. Tag: ADULTA area.

The path connects all three, with small numbered milestone flags (1, 2, 3) at the entry of each area. Soft sparkles in the air. Slight 3/4 top-down perspective. ${STYLE_BASE}. Scene should feel like a Stardew Valley map, cohesive and inviting.`,
  },

  journey1bg: {
    file: "map/journey-1-bg.png",
    size: "1024x1024",
    background: "opaque",
    prompt: `Top-down pixel art scene of a charming pastel beach for a baby character's first journey. Pink sand, palm trees, seashells, baby blue tile water, soft waves. Cozy and welcoming, like a tutorial area in Stardew Valley. A small wooden cradle in the center. Stone path winding through. ${STYLE_BASE}. No characters present, just the background scene.`,
  },

  journey2bg: {
    file: "map/journey-2-bg.png",
    size: "1024x1024",
    background: "opaque",
    prompt: `Top-down pixel art scene of a small lavender-purple town for a teenager's journey. 2-3 cute pixel houses with pink roofs, a flower garden, a phone shop with bright pink TikTok-pink awning, a small wooden stage. Lilac and pink palette dominant. Stone path winding through. ${STYLE_BASE}. No characters present, just the background scene.`,
  },

  journey3bg: {
    file: "map/journey-3-bg.png",
    size: "1024x1024",
    background: "opaque",
    prompt: `Top-down pixel art scene of a modern small city for an adult woman's journey. 2-3 modest pixel skyscrapers with peach-orange sunset sky, a cute coffee shop with steaming cup, a laptop store. Ambitious vibe, golden hour lighting. Pink and peach palette accents. Stone path winding through. ${STYLE_BASE}. No characters present, just the background scene.`,
  },

  bebe: {
    file: "characters/bebe/idle.png",
    size: "1024x1024",
    background: "transparent",
    prompt: `Single pixel art character sprite, centered on transparent background. A cute baby girl character in chibi proportions (3 heads tall). Wearing a pink onesie with hood, tiny pacifier in mouth. Soft pink and peach colors. Big sparkly eyes, slight blush on cheeks, happy curious expression. Front-facing pose, arms slightly out for balance. ${STYLE_BASE}. Just the character on transparent bg, no scene, no shadow ground decoration. Single sprite, not multiple poses.`,
  },

  adolescente: {
    file: "characters/adolescente/idle.png",
    size: "1024x1024",
    background: "transparent",
    prompt: `Single pixel art character sprite, centered on transparent background. A cute teenage girl character in chibi proportions (3 heads tall). Wearing an oversized lilac purple hoodie, ripped jeans, white sneakers. Phone in right hand, headphones around neck. Confident "I got this" smirk, hair in messy bun. ${STYLE_BASE}. Just the character on transparent bg, no scene, no shadow ground decoration. Single sprite, not multiple poses.`,
  },

  adulta: {
    file: "characters/adulta/idle.png",
    size: "1024x1024",
    background: "transparent",
    prompt: `Single pixel art character sprite, centered on transparent background. A confident young adult woman character in chibi proportions (3 heads tall). Wearing cropped blazer in golden peach, high-waist black pants, ankle boots. Holding a laptop under one arm, coffee mug in the other hand. Calm "boss lady" expression, hair styled neatly, slight smile. ${STYLE_BASE}. Just the character on transparent bg, no scene, no shadow ground decoration. Single sprite, not multiple poses.`,
  },
};

async function generateOne(key, spec) {
  const outPath = path.join(SPRITES_DIR, spec.file);

  if (!FORCE) {
    try {
      await fs.access(outPath);
      console.log(`⏭️  ${spec.file} ja existe — pula (set FORCE=1 pra regerar)`);
      return;
    } catch {
      // nao existe, segue
    }
  }

  console.log(`🎨 Gerando ${key} (${spec.size}, bg=${spec.background})...`);
  const t0 = Date.now();

  const body = {
    model: "gpt-image-1",
    prompt: spec.prompt,
    n: 1,
    size: spec.size,
    background: spec.background,
    quality: "medium", // low | medium | high
  };

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`❌ ${key}: HTTP ${res.status} — ${text.slice(0, 300)}`);
    return;
  }

  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`❌ ${key}: resposta sem b64_json`);
    return;
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, Buffer.from(b64, "base64"));

  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  const kb = (Buffer.byteLength(Buffer.from(b64, "base64")) / 1024).toFixed(0);
  console.log(`✅ ${key} ${dt}s ${kb}KB → ${spec.file}`);
}

async function main() {
  const args = process.argv.slice(2);
  const keys = args.length > 0 ? args : Object.keys(ASSETS);

  console.log(`📦 Vou gerar: ${keys.join(", ")}`);
  console.log(`📁 Output: ${SPRITES_DIR}\n`);

  for (const key of keys) {
    const spec = ASSETS[key];
    if (!spec) {
      console.warn(`⚠️  Key "${key}" desconhecida. Disponiveis: ${Object.keys(ASSETS).join(", ")}`);
      continue;
    }
    await generateOne(key, spec);
  }

  console.log("\n🎉 Pronto. Confere em frontend/public/sprites/");
  console.log("   git add public/sprites && git commit -m 'feat: pixel art assets'");
}

main().catch((err) => {
  console.error("💥 Erro fatal:", err);
  process.exit(1);
});
