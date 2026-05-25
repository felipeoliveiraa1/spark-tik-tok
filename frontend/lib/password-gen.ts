import { randomBytes } from "node:crypto";

/**
 * Gera senha temporária pra alunas que entram pela Kiwify.
 *
 * Formato: 12 caracteres alfanuméricos misturados (letras maiúsculas,
 * minúsculas e números), tipo `K7m2pXq9n4Fb`. Caracteres ambíguos
 * (0, O, 1, l, I) ficam de fora pra evitar erro de digitação.
 *
 * Entropia: ~57 chars × 12 = ~70 bits. Suficiente pra senha de uso
 * único (a aluna troca no primeiro login via must_reset_password=true).
 *
 * Usa crypto.randomBytes (CSPRNG do Node) em vez de Math.random
 * pra garantir aleatoriedade segura.
 */

// Sem 0, O, o (visualmente similares), sem 1, l, I (idem).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const LENGTH = 12;

export function generateFriendlyPassword(): string {
  const bytes = randomBytes(LENGTH);
  let out = "";
  for (let i = 0; i < LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
