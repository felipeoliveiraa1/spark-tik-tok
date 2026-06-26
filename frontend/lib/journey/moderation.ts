/**
 * Moderacao leve dos comentarios. Filtra palavroes obvios + spam patterns.
 * Comunidade de alunas eh nicho fechado, baixo risco — soft check pra
 * filtrar abuso explicito, sem ser censor pesado.
 *
 * Quando detecta, retorna { allowed:false, reason } e o endpoint NAO
 * cria o comentario. Frontend mostra erro generico ("conteudo nao
 * permitido").
 */

const BANNED_WORDS = [
  // Palavroes obvios + slurs (lista enxuta — admin completa via
  // /admin/jornadas/comments se preciso. NAO eh exhaustiva por design)
  "porra",
  "puta",
  "puto",
  "caralho",
  "merda",
  "fdp",
  "viado",
  "viada",
  "bicha",
  "cu ",
  " cu",
  "buceta",
  "piroca",
  "pinto ",
  "pau no cu",
  "vai se fuder",
  "vai tomar no",
];

const SPAM_PATTERNS = [
  /https?:\/\/(?!www\.metodotts\.app)/i, // links externos (so permite o nosso)
  /\bwhatsapp\b.{0,30}\+?\d{10,}/i,        // "whatsapp 11 99999..."
  /\b\d{4,}\s*reais\b/i,                    // "ganhe 5000 reais"
  /\bdm\s*(no|para|pra)\s*(meu|meu)\b/i,    // "dm pra meu insta"
];

export type ModerationResult =
  | { allowed: true }
  | { allowed: false; reason: "banned_word" | "spam_pattern" | "too_short" | "too_long" };

export function moderateComment(body: string): ModerationResult {
  const text = (body ?? "").trim();
  if (text.length < 1) return { allowed: false, reason: "too_short" };
  if (text.length > 2000) return { allowed: false, reason: "too_long" };

  const normalized = text.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (normalized.includes(word)) {
      return { allowed: false, reason: "banned_word" };
    }
  }

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: "spam_pattern" };
    }
  }

  return { allowed: true };
}
