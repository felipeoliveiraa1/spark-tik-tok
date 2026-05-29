/**
 * Helpers pra normalizar entrada de URL do YouTube.
 *
 * Aceitamos qualquer formato que o admin colar:
 *   - https://www.youtube.com/watch?v=ABC123XYZ_
 *   - https://youtu.be/ABC123XYZ_
 *   - https://www.youtube.com/shorts/ABC123XYZ_
 *   - https://www.youtube.com/embed/ABC123XYZ_
 *   - ABC123XYZ_   (só o ID)
 *
 * Sempre retornamos o ID de 11 chars pra armazenar no banco.
 */

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function extractYoutubeId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  // Já é só o ID
  if (YOUTUBE_ID_RE.test(s)) return s;

  // Tenta parsear como URL
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, "");

    // youtu.be/<id>
    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return YOUTUBE_ID_RE.test(id) ? id : null;
    }

    // youtube.com/watch?v=<id>
    if (host.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && YOUTUBE_ID_RE.test(v)) return v;

      // /shorts/<id>, /embed/<id>, /v/<id>
      const m = url.pathname.match(/^\/(?:shorts|embed|v)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    }
  } catch {
    /* fall through */
  }

  // Tenta regex direto pra extrair ID embutido em qualquer string
  const fallback = s.match(/([A-Za-z0-9_-]{11})/);
  return fallback?.[1] && YOUTUBE_ID_RE.test(fallback[1]) ? fallback[1] : null;
}

export function youtubeEmbedUrl(
  id: string,
  opts?: { autoplay?: boolean; minimal?: boolean },
): string {
  // youtube-nocookie + flags pra minimizar branding YT no player:
  // - rel=0           → não mostra sugestões de outros canais no fim
  // - modestbranding=1 → diminui logo do YouTube no canto
  // - iv_load_policy=3 → desliga anotações antigas
  // - playsinline=1   → tocador inline no iOS (não force fullscreen)
  // - cc_load_policy=0 → não força legenda
  // - color=white     → barra de progresso branca (mais neutra)
  // - disablekb=0     → mantém atalho de teclado (acessibilidade)
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
    playsinline: "1",
    cc_load_policy: "0",
    color: "white",
  });
  if (opts?.autoplay) params.set("autoplay", "1");
  // Domínio nocookie melhora privacidade e tira o "Watch on YouTube"
  // overlay em alguns cenários.
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function youtubeThumbUrl(id: string, quality: "hq" | "mq" | "sd" | "max" = "hq"): string {
  const key =
    quality === "max"
      ? "maxresdefault"
      : quality === "sd"
        ? "sddefault"
        : quality === "mq"
          ? "mqdefault"
          : "hqdefault";
  return `https://i.ytimg.com/vi/${id}/${key}.jpg`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
