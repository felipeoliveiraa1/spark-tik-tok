/**
 * Gera senha temporária amigável pra alunas que entram pela Kiwify.
 *
 * Formato: `<palavra1>-<palavra2>-<4 dígitos>` (ex: "rosa-flor-7321").
 * Total ~14 chars, fácil de digitar no celular, memorizável o tempo
 * suficiente pra fazer login uma vez antes de redefinir.
 *
 * Entropia: 50 × 50 × 10000 = 25M combinações = ~25 bits. Suficiente pra
 * senha de uso único (a aluna PRECISA trocar no primeiro login).
 */

const ADJECTIVES = [
  "rosa",
  "doce",
  "linda",
  "feliz",
  "leve",
  "fofa",
  "clara",
  "viva",
  "calma",
  "forte",
  "pura",
  "alegre",
  "suave",
  "nova",
  "linda",
  "magica",
  "brilhante",
  "amavel",
  "gentil",
  "quente",
  "fresca",
  "sabia",
  "bela",
  "boa",
  "alta",
  "rica",
  "rara",
  "sutil",
  "macia",
  "tenra",
  "viva",
  "agil",
  "firme",
  "livre",
  "luz",
  "feliz",
  "rosa",
  "doce",
  "linda",
  "alegre",
  "querida",
  "amada",
  "ousada",
  "intuitiva",
  "vibrante",
  "radiante",
  "florida",
  "solar",
  "lunar",
  "estelar",
];

const NOUNS = [
  "flor",
  "luz",
  "estrela",
  "lua",
  "sol",
  "rosa",
  "magia",
  "cristal",
  "perola",
  "joia",
  "brisa",
  "onda",
  "ceu",
  "nuvem",
  "chuva",
  "vento",
  "fogo",
  "agua",
  "terra",
  "ar",
  "amor",
  "paz",
  "luz",
  "sonho",
  "vida",
  "musa",
  "dama",
  "fada",
  "gata",
  "alma",
  "rosa",
  "lirio",
  "orquidea",
  "jasmim",
  "violeta",
  "tulipa",
  "girassol",
  "margarida",
  "magnolia",
  "camelia",
  "pluma",
  "seda",
  "veludo",
  "renda",
  "linho",
  "ouro",
  "prata",
  "rubi",
  "safira",
  "topazio",
];

function pick<T>(arr: T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function digits(n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}

export function generateFriendlyPassword(): string {
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${digits(4)}`;
}
