import MarkdownIt, { type Token } from 'markdown-it';
import { katex } from '@mdit/plugin-katex';
import { BASE_MARKDOWN_IT_OPTIONS, renderWithMd, type RenderMarkdownOptions } from './markdown-config';

const mdWithKatex = new MarkdownIt(BASE_MARKDOWN_IT_OPTIONS).use(katex);

function containsMathToken(token: Token): boolean {
  if (token.type === 'math_inline' || token.type === 'math_block') {
    return true;
  }

  return token.children?.some(containsMathToken) ?? false;
}

export function hasKatexMath(markdown: string): boolean {
  return mdWithKatex.parse(markdown, {}).some(containsMathToken);
}

export function renderMarkdownWithKatex(markdown: string, options?: RenderMarkdownOptions): string {
  return renderWithMd(mdWithKatex, markdown, options);
}
