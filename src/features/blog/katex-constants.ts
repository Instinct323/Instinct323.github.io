// Centralized KaTeX CSS constants. Single source of truth for the CDN URL and SRI hash;
// both the SSR <head> injection and the client-side runtime use these values.
export const KATEX_CSS_HREF = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
export const KATEX_CSS_INTEGRITY =
  'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
