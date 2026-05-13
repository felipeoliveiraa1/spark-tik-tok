/**
 * Extrai o ID numérico do vídeo da URL do TikTok.
 *
 * Suporta:
 *   https://www.tiktok.com/@usuario/video/7423456789012345678
 *   https://www.tiktok.com/@usuario/video/7423456789012345678?_t=...
 *
 * Não suporta (retorna null):
 *   https://vm.tiktok.com/xyz/         (link curto — precisa expandir)
 *   https://www.tiktok.com/t/xyz/      (link curto)
 *   URLs malformadas.
 */
export function extractTikTokId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("tiktok.com")) return null;
    const match = u.pathname.match(/\/video\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Player oficial do TikTok pra embed em iframe. Aceita autoplay e
 * permite reprodução dentro do app sem violar CORS/X-Frame.
 */
export function buildTikTokEmbedUrl(id: string): string {
  return `https://www.tiktok.com/player/v1/${id}?autoplay=1&music_info=1&description=1`;
}

export function isTikTokUrl(href: string): boolean {
  try {
    return new URL(href).hostname.includes("tiktok.com");
  } catch {
    return false;
  }
}
