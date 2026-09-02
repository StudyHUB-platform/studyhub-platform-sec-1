/** Client-safe YouTube URL helpers (no API key needed). */

export function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (!host.endsWith("youtube.com")) return null;
    if (u.pathname === "/watch") return u.searchParams.get("v");
    const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
    return m ? (m[2] ?? null) : null;
  } catch {
    return null;
  }
}

export function youTubeThumbnail(url: string): string | null {
  const id = getYouTubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.replace(/^www\./, "");
    return host === "youtu.be" || host.endsWith("youtube.com");
  } catch {
    return false;
  }
}
