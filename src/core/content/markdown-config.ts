/**
 * Shared markdown-it config and helpers used by both server and client.
 * Centralizes safe default options and URL rewriting rules so every
 * renderer starts from the same baseline.
 */
import MarkdownIt from 'markdown-it';

/**
 * Conservative defaults for all markdown-it instances.
 * - html: false — prevents XSS from raw HTML in user content.
 * - xhtmlOut: false — no XHTML-style self-closing tags needed.
 * - breaks: false — single newlines must not become <br> tags.
 * - linkify: false — URLs must not be auto-linked without explicit syntax.
 * - typographer: false — smart quotes must not replace straight quotes.
 */
export const BASE_MARKDOWN_IT_OPTIONS = {
  html: false,
  xhtmlOut: false,
  breaks: false,
  linkify: false,
  typographer: false,
};

export interface RenderMarkdownOptions {
  fileURL?: string;
}

/**
 * Rewrites relative asset paths in rendered HTML so they resolve
 * correctly after markdown-to-HTML conversion. Steps: (1) resolve each
 * path against the source file's base URL, (2) detect file:// scheme
 * URLs produced by server-side rendering, (3) rewrite
 * /content/{section}/{slug}/assets/... to /{section}/{slug}/assets/...
 * so the browser can fetch them.
 */
export function resolveRelativePaths(html: string, fileURL: string): string {
  const baseURL = new URL('.', fileURL).href;

  return html.replace(
    /(?:src|href)=["']([^"']+)["']/g,
    (match, path: string) => {
      if (
        path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('data:') ||
        path.startsWith('#') ||
        path.startsWith('mailto:') ||
        path.startsWith('tel:')
      ) {
        return match;
      }

      let resolved: URL;
      try {
        resolved = new URL(path, baseURL);
      } catch {
        throw new Error(`resolveRelativePaths: malformed relative path "${path}" in fileURL "${fileURL}"`);
      }
      let resolvedPath = resolved.href;

      if (resolvedPath.startsWith('file://')) {
        const contentMatch = resolvedPath.match(/\/content\/([^/]+)\/([^/]+)/);
        if (contentMatch) {
          const section = contentMatch[1];
          const slug = contentMatch[2];
          const assetMatch = resolvedPath.match(/\/assets\/(.+)$/);
          if (assetMatch) {
            resolvedPath = `/${section}/${slug}/assets/${assetMatch[1]}`;
          }
        }
      }

      return match.replace(path, resolvedPath);
    }
  );
}

export function renderWithMd(renderer: MarkdownIt, markdown: string, options?: RenderMarkdownOptions): string {
  let html = renderer.render(markdown);

  if (options?.fileURL) {
    html = resolveRelativePaths(html, options.fileURL);
  }

  return html;
}
