export interface LayoutProps {
  title?: string;
  description?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  shell?: string;
  contentWidth?: string;
}