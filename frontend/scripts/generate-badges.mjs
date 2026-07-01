#!/usr/bin/env node
/**
 * Gera os 21 badges/selos das Jornadas via OpenAI gpt-image-1.
 *
 * Sai: PNGs 1024x1024 em frontend/public/sprites/badges/
 *   iniciante.png, criadora.png, consistente.png, afiliada.png,
 *   vendedora.png, elite-tts.png, primeira-aula.png, primeira-jornada.png,
 *   trilogia.png, primeira-venda.png, vendedora-100.png, vendedora-1000.png,
 *   comentarista.png, popular.png, madrugadora.png, coruja.png,
 *   maratonista.png, streak-7-dias.png, adolescente.png, adulta.png,
 *   pioneira.png
 *
 * Custo estimado: ~$0.84 total (21 × $0.04 gpt-image-1 standard).
 *
 * USO:
 *   cd frontend
 *   OPENAI_API_KEY=sk-... node scripts/generate-badges.mjs
 *
 *   # so alguns especificos:
 *   OPENAI_API_KEY=sk-... node scripts/generate-badges.mjs iniciante criadora
 *
 *   # forca regenerar mesmo se ja existe:
 *   OPENAI_API_KEY=sk-... FORCE=1 node scripts/generate-badges.mjs
 *
 * Depois: rodar o SQL que o script imprime no final pra fazer
 * UPDATE badges SET icon_url = '/sprites/badges/<slug>.png'.
 */
import fs from "node:fs/promises";
import path from "node:path";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error("❌ OPENAI_API_KEY nao definida. Set pelo env e tenta de novo.");
  process.exit(1);
}

const FORCE = process.env.FORCE === "1";
const BADGES_DIR = path.join(process.cwd(), "public", "sprites", "badges");

// Estilo base — coerente com sprite pack existente da feature Jornadas
const COLORS =
  "soft pastel palette: rose pink #fdb4c2, peach #ffd6a8, lilac purple #d4a8ff, cream white #fff8f3";
const STYLE_BASE = `16-bit pixel art, retro game sprite achievement medal style, circular medal/coin shape with metallic rim, glossy shine highlights, ${COLORS}, transparent PNG background (or subtle radial glow), no text or letters on the medal, centered composition, chunky pixel edges no smoothing`;

// Rarity ring colors — visual hierarchy
const RARITY_RING = {
  common: "silver-gray metallic rim",
  rare: "bright blue metallic rim with cyan highlights",
  epic: "deep purple metallic rim with lilac highlights",
  legendary: "gold metallic rim with amber shimmer and multi-color rainbow sparkles around the edge",
};

// Def dos 21 selos: tema visual + rarity
const BADGES = {
  iniciante: {
    rarity: "common",
    theme: "a small green seedling sprout with two tiny leaves emerging from soil, symbolizing new beginnings and first step",
  },
  criadora: {
    rarity: "epic",
    theme: "an artist palette with a paintbrush crossed diagonally, colorful paint dabs in pink/peach/lilac tones",
  },
  consistente: {
    rarity: "rare",
    theme: "a strong flexed muscular arm/bicep in classic cartoon style, symbolizing consistency and discipline",
  },
  afiliada: {
    rarity: "rare",
    theme: "two hands meeting in a handshake, symbolizing partnership and joining the affiliate program",
  },
  vendedora: {
    rarity: "epic",
    theme: "a golden money bag with a dollar/cash symbol, sparkles around it, symbolizing first sale",
  },
  "elite-tts": {
    rarity: "legendary",
    theme: "a shining five-pointed star surrounded by smaller stars, halo of light, symbolizing elite status",
  },
  "primeira-aula": {
    rarity: "common",
    theme: "an open storybook with a soft glow between the pages, symbolizing knowledge and learning",
  },
  "primeira-jornada": {
    rarity: "rare",
    theme: "a red bullseye target with an arrow hitting the center",
  },
  trilogia: {
    rarity: "legendary",
    theme: "three golden crowns arranged in triangle formation, glowing regal aura, symbolizing completing all three journeys",
  },
  "primeira-venda": {
    rarity: "rare",
    theme: "a party popper/confetti burst with colorful streamers, celebration vibe",
  },
  "vendedora-100": {
    rarity: "epic",
    theme: "the number 100 stylized as a bold golden medal engraving surrounded by dollar sign accents",
  },
  "vendedora-1000": {
    rarity: "legendary",
    theme: "a large golden trophy cup with 1K engraving, glowing majestic aura, symbolizing thousand-real seller",
  },
  comentarista: {
    rarity: "common",
    theme: "a cute chat speech bubble with three dots inside, soft rounded corners",
  },
  popular: {
    rarity: "rare",
    theme: "a glowing red heart with sparkles and small hearts orbiting around it",
  },
  madrugadora: {
    rarity: "common",
    theme: "a rising sun over a horizon line, warm orange and pink dawn colors, early morning vibe",
  },
  coruja: {
    rarity: "common",
    theme: "a cute wise cartoon owl sitting on a crescent moon, night-time vibe with small stars around",
  },
  maratonista: {
    rarity: "rare",
    theme: "a determined runner girl silhouette in motion mid-stride, motion lines behind her",
  },
  "streak-7-dias": {
    rarity: "epic",
    theme: "a blazing orange-red flame with the number 7 subtly integrated at the base, streak fire vibe",
  },
  adolescente: {
    rarity: "rare",
    theme: "a cute pixel art teen girl character bust with a confident smile, matching the game's Yara mascot style",
  },
  adulta: {
    rarity: "epic",
    theme: "a cute pixel art adult woman entrepreneur bust wearing business attire, matching the game's Yara mascot style",
  },
  pioneira: {
    rarity: "legendary",
    theme: "a golden rocket ship blasting off with flame trail, symbolizing being among the first to launch",
  },
};

async function generateBadge(slug, spec) {
  const outPath = path.join(BADGES_DIR, `${slug}.png`);
  if (!FORCE) {
    try {
      await fs.access(outPath);
      console.log(`⏭  ${slug}.png ja existe (use FORCE=1 pra regerar)`);
      return { slug, skipped: true };
    } catch {
      // continua
    }
  }

  const ringDesc = RARITY_RING[spec.rarity] ?? RARITY_RING.common;
  const prompt = `Pixel art achievement badge/medal icon: ${spec.theme}. ${ringDesc}. ${STYLE_BASE}. The medal fills most of the square canvas. Background: transparent or subtle radial soft glow matching the medal's rarity color. Absolutely no text or numbers rendered as characters (unless already described in theme).`;

  console.log(`🎨 Gerando ${slug} (${spec.rarity})...`);
  const start = Date.now();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: "standard",
      background: "transparent",
      n: 1,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ ${slug}: HTTP ${res.status} — ${err.slice(0, 200)}`);
    return { slug, error: `HTTP ${res.status}` };
  }
  const j = await res.json();
  const b64 = j?.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`❌ ${slug}: resposta sem b64_json`);
    return { slug, error: "no b64" };
  }

  await fs.mkdir(BADGES_DIR, { recursive: true });
  await fs.writeFile(outPath, Buffer.from(b64, "base64"));
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`✅ ${slug}.png salvo (${elapsed}s)`);
  return { slug, ok: true };
}

async function main() {
  const requested = process.argv.slice(2);
  const targets =
    requested.length > 0
      ? requested.filter((s) => {
          if (!BADGES[s]) {
            console.warn(`⚠  slug ${s} desconhecido, ignorando`);
            return false;
          }
          return true;
        })
      : Object.keys(BADGES);

  console.log(`🚀 Gerando ${targets.length} badge(s)...`);
  const results = [];
  for (const slug of targets) {
    const r = await generateBadge(slug, BADGES[slug]);
    results.push(r);
  }

  const ok = results.filter((r) => r.ok).length;
  const skipped = results.filter((r) => r.skipped).length;
  const errors = results.filter((r) => r.error);

  console.log(`\n📊 Resumo:`);
  console.log(`   ${ok} geradas`);
  console.log(`   ${skipped} puladas (ja existiam)`);
  console.log(`   ${errors.length} erros`);
  if (errors.length > 0) {
    for (const e of errors) console.log(`   ❌ ${e.slug}: ${e.error}`);
  }

  // SQL pra atualizar icon_url no banco
  if (ok > 0) {
    console.log(`\n📝 SQL pra rodar no Supabase Studio:\n`);
    const generated = results.filter((r) => r.ok);
    console.log("UPDATE badges SET icon_url = CASE slug");
    for (const r of generated) {
      console.log(`  WHEN '${r.slug}' THEN '/sprites/badges/${r.slug}.png'`);
    }
    console.log(`END\nWHERE slug IN (${generated.map((r) => `'${r.slug}'`).join(", ")});\n`);
  }
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
