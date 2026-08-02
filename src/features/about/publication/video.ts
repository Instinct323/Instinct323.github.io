/**
 * Resolves a video page URL to its base embed URL.
 *
 * Supported platforms:
 * - Bilibili: `https://www.bilibili.com/video/BV...` → `https://player.bilibili.com/player.html?bvid=...`
 * - YouTube watch: `https://www.youtube.com/watch?v=...` → `https://www.youtube.com/embed/...`
 * - YouTube short: `https://youtu.be/...` → `https://www.youtube.com/embed/...`
 * - Already-embed URLs are passed through as-is.
 *
 * @param videoUrl - The raw video URL from publication content.
 * @returns The base embed URL, or `undefined` if the URL is unsupported or malformed.
 */
export function resolveEmbedUrl(videoUrl: string): string | undefined {
  if (!videoUrl) {
    return undefined;
  }

  try {
    const url = new URL(videoUrl);
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'player.bilibili.com') {
      return url.toString();
    }

    if ((hostname === 'www.youtube.com' || hostname === 'youtube.com') && url.pathname.startsWith('/embed/')) {
      return url.toString();
    }

    // Bilibili video page → embed
    const bilibiliMatch = url.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/i);
    if (bilibiliMatch) {
      return `https://player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&page=1&high_quality=1`;
    }

    // YouTube watch URL → embed
    if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
      const videoId = url.searchParams.get('v');
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // YouTube short URL (youtu.be) → embed
    if (hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1);
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return undefined;
  } catch {
    if (import.meta.env?.DEV) {
      console.warn(`[resolveEmbedUrl] malformed video URL: ${videoUrl}`);
    }
    return undefined;
  }
}

/**
 * Builds a video embed URL with player behavior parameters.
 *
 * Calls {@link resolveEmbedUrl} to get the base embed URL, then appends
 * autoplay/loop/mute parameters appropriate for each platform.
 *
 * @param videoUrl - The raw video URL from publication content.
 * @returns The embed URL with behavior parameters, or `undefined` if unsupported.
 */
export function buildVideoEmbedUrl(videoUrl: string): string | undefined {
  const baseUrl = resolveEmbedUrl(videoUrl);
  if (!baseUrl) return undefined;

  const url = new URL(baseUrl);
  if (url.hostname === 'player.bilibili.com') {
    url.searchParams.set('autoplay', '1');
    return url.toString();
  }
  if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
    const videoId = url.pathname.split('/embed/')[1];
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('loop', '1');
    url.searchParams.set('mute', '1');
    if (videoId) {
      url.searchParams.set('playlist', videoId);
    }
    return url.toString();
  }
  return baseUrl;
}
