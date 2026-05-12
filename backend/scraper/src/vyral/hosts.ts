/**
 * Vyral's web app talks to three different backend hosts:
 *
 *   - content-api.vyral.codgital.site  → the FEED_CONTEUDO endpoints (videos)
 *   - api.vyral.codgital.site          → /dashboard/insights/analyze (AI)
 *   - account-api.vyral.codgital.site  → user profile, billing, notifications
 *
 * All three accept the same cookies/JWT that app.vyral.com.br issued — they
 * share the auth realm. We just pick which host per endpoint.
 */

export const VYRAL_HOSTS = {
  content: "https://content-api.vyral.codgital.site",
  api: "https://api.vyral.codgital.site",
  account: "https://account-api.vyral.codgital.site",
  app: "https://app.vyral.com.br",
} as const;

export type VyralHost = keyof typeof VYRAL_HOSTS;
