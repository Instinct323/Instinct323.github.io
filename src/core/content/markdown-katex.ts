/**
 * KaTeX-enabled markdown renderer. This module is imported dynamically
 * on demand so the katex plugin and fonts stay out of the initial
 * client bundle.
 */
import MarkdownIt from 'markdown-it';
import { katex } from '@mdit/plugin-katex';
import { BASE_MARKDOWN_IT_OPTIONS, renderWithMd, type RenderMarkdownOptions } from './markdown-config';

const mdWithKatex = new MarkdownIt(BASE_MARKDOWN_IT_OPTIONS).use(katex);

export function renderMarkdownWithKatex(markdown: string, options?: RenderMarkdownOptions): string {
  return renderWithMd(mdWithKatex, markdown, options);
}
