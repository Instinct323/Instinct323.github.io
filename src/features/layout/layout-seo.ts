import { assertString } from '~/core/validation/assert';
import type { SiteMetadata } from '~/features/site/types';

export interface LayoutSeoData {
  resolvedTitle: string;
  resolvedDescription: string;
  keyword?: string;
  canonicalUrl: string;
  sitemapUrl: string;
}

export function resolveLayoutSeo(params: {
  title?: string;
  description?: string;
  siteMetadata: SiteMetadata;
  siteUrl: URL;
  pathname: string;
}): LayoutSeoData {
  const { title, description, siteMetadata, siteUrl, pathname } = params;

  const resolvedTitle =
    title !== undefined
      ? title
      : assertString(siteMetadata.defaultTitle, 'siteMetadata.defaultTitle');
  const resolvedDescription =
    description !== undefined
      ? description
      : assertString(siteMetadata.defaultDescription, 'siteMetadata.defaultDescription');
  const keyword = siteMetadata.keyword;
  const canonicalUrl = new URL(pathname, siteUrl).toString();
  const sitemapUrl = new URL('/sitemap-index.xml', siteUrl).toString();

  return {
    resolvedTitle,
    resolvedDescription,
    keyword,
    canonicalUrl,
    sitemapUrl,
  };
}
