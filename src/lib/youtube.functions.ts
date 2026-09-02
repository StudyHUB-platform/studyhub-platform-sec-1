import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Fetch a YouTube video title + thumbnail (public oEmbed, no key required). */
export const fetchYouTubeVideo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ url: z.string().url().max(500) }).parse(data))
  .handler(async ({ data }) => {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(data.url)}`,
    );
    if (!res.ok) throw new Error("تعذر جلب بيانات الفيديو من يوتيوب");
    const json = (await res.json()) as { title?: string; thumbnail_url?: string };
    return { title: json.title ?? "", thumbnail: json.thumbnail_url ?? "" };
  });

type YtChannel = { title: string; thumbnail: string };

async function viaDataApi(url: string, key: string): Promise<YtChannel | null> {
  const u = new URL(url);
  const path = u.pathname.replace(/\/+$/, "");
  const base = "https://www.googleapis.com/youtube/v3";
  const idMatch = path.match(/^\/channel\/([^/]+)/);
  const handleMatch = path.match(/^\/@([^/]+)/) ?? path.match(/^\/(?:c|user)\/([^/]+)/);

  let endpoint: string | null = null;
  if (idMatch) endpoint = `${base}/channels?part=snippet&id=${encodeURIComponent(idMatch[1]!)}&key=${key}`;
  else if (handleMatch)
    endpoint = `${base}/channels?part=snippet&forHandle=${encodeURIComponent(handleMatch[1]!)}&key=${key}`;
  if (!endpoint) return null;

  const res = await fetch(endpoint);
  if (!res.ok) return null;
  const json = (await res.json()) as {
    items?: { snippet?: { title?: string; thumbnails?: Record<string, { url?: string }> } }[];
  };
  const snippet = json.items?.[0]?.snippet;
  if (!snippet?.title) return null;
  const thumbs = snippet.thumbnails ?? {};
  const thumbnail = thumbs["high"]?.url ?? thumbs["medium"]?.url ?? thumbs["default"]?.url ?? "";
  return { title: snippet.title, thumbnail };
}

async function viaPageMeta(url: string): Promise<YtChannel | null> {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 StudyHUB" } });
  if (!res.ok) return null;
  const html = await res.text();
  const title =
    html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ??
    html.match(/<meta name="title" content="([^"]+)"/)?.[1];
  const thumbnail = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? "";
  if (!title) return null;
  const decode = (s: string) =>
    s
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  return { title: decode(title), thumbnail: decode(thumbnail) };
}

/** Fetch a YouTube channel name + avatar from a channel URL (Data API v3, page-meta fallback). */
export const fetchYouTubeChannel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ url: z.string().url().max(500) }).parse(data))
  .handler(async ({ data }): Promise<YtChannel> => {
    const key = process.env["YOUTUBE_API_KEY"];
    if (key) {
      const viaApi = await viaDataApi(data.url, key).catch(() => null);
      if (viaApi) return viaApi;
    }
    const fallback = await viaPageMeta(data.url).catch(() => null);
    if (!fallback) throw new Error("تعذر جلب بيانات القناة — تأكد من الرابط");
    return fallback;
  });
