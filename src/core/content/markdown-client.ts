/**
 * Client-side markdown renderer. Imports only markdown-it (no
 * gray-matter or katex) to keep the client bundle small. Use
 * markdown-katex.ts when math rendering is needed.
 */
import MarkdownIt from 'markdown-it';
import { BASE_MARKDOWN_IT_OPTIONS, renderWithMd, type RenderMarkdownOptions } from './markdown-config';

const md = new MarkdownIt(BASE_MARKDOWN_IT_OPTIONS);

export function renderMarkdown(markdown: string, options?: RenderMarkdownOptions): string {
  return renderWithMd(md, markdown, options);
}
