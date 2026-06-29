export interface Publication {
  title: string;
  abstract?: string;
  authors: string[];
  date: string;
  source?: string;
  links?: Record<string, string>;
  video?: string;
  weight?: number;
}
