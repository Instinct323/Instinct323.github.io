export const LATEX_REGEX = /\$[^$\s]+\$|\$\$[\s\S]*?\$\$/;

export interface BlogPostData {
  title: string;
  content: string;
  baseUrl: string;
  hasLatex: boolean;
}

export interface BlogPageFrame {
  posts: import('./blog-post').BlogPost[];
}
