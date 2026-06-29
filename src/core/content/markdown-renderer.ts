import MarkdownIt from 'markdown-it';
import { katex } from '@mdit/plugin-katex';
import { BASE_MARKDOWN_IT_OPTIONS, renderWithMd, type RenderMarkdownOptions } from './markdown-config';

const md = new MarkdownIt(BASE_MARKDOWN_IT_OPTIONS);
const mdWithKatex = new MarkdownIt(BASE_MARKDOWN_IT_OPTIONS).use(katex);

export function renderMarkdown(markdown: string, options?: RenderMarkdownOptions): string {
  return renderWithMd(md, markdown, options);
}

export function renderMarkdownWithKatex(markdown: string, options?: RenderMarkdownOptions): string {
  return renderWithMd(mdWithKatex, markdown, options);
}

export type { RenderMarkdownOptions };
