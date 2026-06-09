import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  NAMESPACES,
  pickLocaleFromAcceptLanguage,
  type Locale,
} from "./config";

/**
 * Resolve o locale do request — chamado a cada SSR/RSC pelo next-intl.
 *
 * Estrategia:
 *   1) cookie NEXT_LOCALE (fonte da verdade pra logada e deslogada)
 *   2) Accept-Language do browser (fallback deslogada)
 *   3) DEFAULT_LOCALE (pt-BR)
 *
 * Nao consulta Supabase aqui — o sync cookie ↔ profile.language acontece
 * no proxy.ts (que ja faz a query do profile pra auth/plan).
 */
async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  const fromHeader = pickLocaleFromAcceptLanguage(acceptLanguage);
  if (fromHeader) return fromHeader;

  return DEFAULT_LOCALE;
}

/**
 * Carrega todos os namespaces do locale resolvido.
 *
 * next-intl tree-shakes useTranslations('foo') pra so puxar o namespace 'foo',
 * mas o request precisa retornar o objeto completo. Como os JSONs sao
 * compactos (~3-10KB cada), carregar todos eh aceitavel — Next cacheia.
 */
export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  const messages: Record<string, unknown> = {};
  await Promise.all(
    NAMESPACES.map(async (ns) => {
      try {
        const mod = await import(`./messages/${locale}/${ns}.json`);
        messages[ns] = mod.default;
      } catch {
        // Fallback pra pt-BR se a chave nao existir no locale alvo
        // (cobre tradu cao incompleta sem quebrar UI)
        try {
          const fallback = await import(`./messages/${DEFAULT_LOCALE}/${ns}.json`);
          messages[ns] = fallback.default;
        } catch {
          messages[ns] = {};
        }
      }
    }),
  );

  return {
    locale,
    messages,
  };
});
