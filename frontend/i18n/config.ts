/**
 * Config de i18n do Metodo TTS.
 *
 * 3 idiomas: pt-BR (default), en, es.
 * URLs nao tem prefix de locale — `/agentes` continua `/agentes`.
 * Idioma resolvido em ordem:
 *   1) cookie NEXT_LOCALE (1 ano)
 *   2) profile.language (Supabase, so logada)
 *   3) Accept-Language do browser (so deslogada)
 *   4) DEFAULT_LOCALE
 */

export const LOCALES = ["pt-BR", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Metadata por locale — usado em <html lang>, OpenGraph, formatadores etc.
 */
export const LOCALE_META: Record<
  Locale,
  {
    htmlLang: string;
    ogLocale: string;
    flag: string;
    label: string;
    nativeLabel: string;
    dateFormat: string;
    currency: string;
  }
> = {
  "pt-BR": {
    htmlLang: "pt-BR",
    ogLocale: "pt_BR",
    flag: "🇧🇷",
    label: "Português",
    nativeLabel: "Português",
    dateFormat: "dd/MM/yyyy",
    currency: "BRL",
  },
  en: {
    htmlLang: "en",
    ogLocale: "en_US",
    flag: "🇺🇸",
    label: "English",
    nativeLabel: "English",
    dateFormat: "MM/dd/yyyy",
    currency: "USD",
  },
  es: {
    htmlLang: "es",
    ogLocale: "es_ES",
    flag: "🇪🇸",
    label: "Spanish",
    nativeLabel: "Español",
    dateFormat: "dd/MM/yyyy",
    currency: "EUR",
  },
};

/**
 * Namespaces usados em getTranslations/useTranslations.
 * Carregamos so o que a pagina precisa pra reduzir bundle.
 */
export const NAMESPACES = [
  "common",
  "nav",
  "auth",
  "landing",
  "conta",
  "agentes",
  "produtos",
  "scripts",
  "rotina",
  "educacao",
  "news",
  "ranking",
  "ao-vivo",
  "chat",
  "errors",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

/**
 * Parsea Accept-Language e retorna o 1o locale suportado, ou null.
 * Usado pra detectar idioma de visitante deslogado.
 */
export function pickLocaleFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  // header: "en-US,en;q=0.9,pt-BR;q=0.8"
  const langs = header
    .split(",")
    .map((part) => part.split(";")[0]!.trim().toLowerCase())
    .filter(Boolean);
  for (const lang of langs) {
    if (lang.startsWith("pt")) return "pt-BR";
    if (lang.startsWith("es")) return "es";
    if (lang.startsWith("en")) return "en";
  }
  return null;
}
