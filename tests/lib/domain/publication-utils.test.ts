import { describe, expect, it } from 'vitest';
import {
  normalizePublication,
  formatPublicationLinkLabel,
  resolvePublicationLinks,
} from '../../../src/lib/domain/publication-utils';
import type { Publication } from '../../../src/types';

describe('normalizePublication', () => {
  const filePath = 'test/publication.yaml';

  it('returns Publication with all fields when given valid complete data', () => {
    const raw = {
      title: 'Test Publication Title',
      abstract: 'This is a test abstract.',
      authors: ['John Doe', 'Jane Smith'],
      date: '2024-01-15',
      source: 'Test Journal',
      links: {
        pdf: 'https://example.com/paper.pdf',
        code: 'https://github.com/example/repo',
      },
    };

    const result = normalizePublication(raw, filePath);

    expect(result).toEqual({
      title: 'Test Publication Title',
      abstract: 'This is a test abstract.',
      authors: ['John Doe', 'Jane Smith'],
      date: '2024-01-15',
      source: 'Test Journal',
      links: {
        code: 'https://github.com/example/repo',
        pdf: 'https://example.com/paper.pdf',
      },
    });
  });

  it('throws with file path in message when title is missing', () => {
    const raw = {
      authors: ['John Doe'],
      date: '2024-01-15',
    };

    expect(() => normalizePublication(raw, filePath)).toThrow(
      `Invalid publication field "title" in ${filePath}`
    );
  });

  it('throws when date is missing', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
    };

    expect(() => normalizePublication(raw, filePath)).toThrow(
      `Invalid publication field "date" in ${filePath}`
    );
  });

  it('throws when authors array is empty', () => {
    const raw = {
      title: 'Test Title',
      date: '2024-01-15',
      authors: [],
    };

    expect(() => normalizePublication(raw, filePath)).toThrow(
      `Invalid publication field "authors" in ${filePath}`
    );
  });

  it('returns undefined abstract when optional abstract is omitted', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
    };

    const result = normalizePublication(raw, filePath);

    expect(result.abstract).toBeUndefined();
  });

  it('returns undefined source when optional source is omitted', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
    };

    const result = normalizePublication(raw, filePath);

    expect(result.source).toBeUndefined();
  });

  it('throws when given non-object input', () => {
    expect(() => normalizePublication(null, filePath)).toThrow(
      `Invalid publication content in ${filePath}`
    );
    expect(() => normalizePublication(undefined, filePath)).toThrow(
      `Invalid publication content in ${filePath}`
    );
    expect(() => normalizePublication('string', filePath)).toThrow(
      `Invalid publication content in ${filePath}`
    );
    expect(() => normalizePublication(42, filePath)).toThrow(
      `Invalid publication content in ${filePath}`
    );
    expect(() => normalizePublication([], filePath)).toThrow(
      `Invalid publication content in ${filePath}`
    );
  });

  it('trims whitespace from string fields', () => {
    const raw = {
      title: '  Test Title  ',
      authors: ['  John Doe  ', '  Jane Smith  '],
      date: '  2024-01-15  ',
      abstract: '  Abstract text  ',
      source: '  Journal Name  ',
    };

    const result = normalizePublication(raw, filePath);

    expect(result.title).toBe('Test Title');
    expect(result.authors).toEqual(['John Doe', 'Jane Smith']);
    expect(result.date).toBe('2024-01-15');
    expect(result.abstract).toBe('Abstract text');
    expect(result.source).toBe('Journal Name');
  });

  it('returns undefined abstract and source for empty strings', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      abstract: '   ',
      source: '   ',
    };

    const result = normalizePublication(raw, filePath);

    expect(result.abstract).toBeUndefined();
    expect(result.source).toBeUndefined();
  });
});

describe('normalizePublicationLinks (via normalizePublication)', () => {
  const filePath = 'test/publication.yaml';

  it('returns sorted Record when given valid links', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: {
        pdf: 'https://example.com/paper.pdf',
        code: 'https://github.com/example/repo',
        arxiv: 'https://arxiv.org/abs/1234',
      },
    };

    const result = normalizePublication(raw, filePath);

    expect(result.links).toEqual({
      arxiv: 'https://arxiv.org/abs/1234',
      code: 'https://github.com/example/repo',
      pdf: 'https://example.com/paper.pdf',
    });
    expect(Object.keys(result.links!)).toEqual(['arxiv', 'code', 'pdf']);
  });

  it('returns undefined when given empty object', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: {},
    };

    const result = normalizePublication(raw, filePath);

    expect(result.links).toBeUndefined();
  });

  it('filters out non-string values from links', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: {
        pdf: 'https://example.com/paper.pdf',
        code: null,
        data: 42,
        website: undefined,
        project: true,
      },
    };

    const result = normalizePublication(raw, filePath);

    expect(result.links).toEqual({
      pdf: 'https://example.com/paper.pdf',
    });
  });

  it('filters out links with empty names or hrefs', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: {
        pdf: 'https://example.com/paper.pdf',
        '': 'https://example.com/empty-name',
        code: '   ',
        website: '',
      },
    };

    const result = normalizePublication(raw, filePath);

    expect(result.links).toEqual({
      pdf: 'https://example.com/paper.pdf',
    });
  });

  it('returns undefined when links is not provided', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
    };

    const result = normalizePublication(raw, filePath);

    expect(result.links).toBeUndefined();
  });

  it('returns undefined when links is null', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: null,
    };

    const result = normalizePublication(raw, filePath);

    expect(result.links).toBeUndefined();
  });

  it('returns undefined when links is an array', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: ['https://example.com'],
    };

    const result = normalizePublication(raw, filePath);

    expect(result.links).toBeUndefined();
  });

  it('trims whitespace from link names and hrefs', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: {
        '  pdf  ': '  https://example.com/paper.pdf  ',
      },
    };

    const result = normalizePublication(raw, filePath);

    expect(result.links).toEqual({
      pdf: 'https://example.com/paper.pdf',
    });
  });
});

describe('formatPublicationLinkLabel', () => {
  it('capitalizes each segment of multi-word names separated by spaces', () => {
    expect(formatPublicationLinkLabel('pdf document')).toBe('Pdf Document');
    expect(formatPublicationLinkLabel('source code repository')).toBe('Source Code Repository');
  });

  it('capitalizes each segment of names separated by underscores', () => {
    expect(formatPublicationLinkLabel('pdf_document')).toBe('Pdf Document');
    expect(formatPublicationLinkLabel('source_code_repo')).toBe('Source Code Repo');
  });

  it('capitalizes each segment of names separated by hyphens', () => {
    expect(formatPublicationLinkLabel('pdf-document')).toBe('Pdf Document');
    expect(formatPublicationLinkLabel('source-code-repo')).toBe('Source Code Repo');
  });

  it('handles mixed separators', () => {
    expect(formatPublicationLinkLabel('pdf_document-file')).toBe('Pdf Document File');
    expect(formatPublicationLinkLabel('source-code_repo')).toBe('Source Code Repo');
  });

  it('capitalizes single word names', () => {
    expect(formatPublicationLinkLabel('pdf')).toBe('Pdf');
    expect(formatPublicationLinkLabel('arxiv')).toBe('Arxiv');
    expect(formatPublicationLinkLabel('github')).toBe('Github');
  });

  it('trims whitespace from input', () => {
    expect(formatPublicationLinkLabel('  pdf document  ')).toBe('Pdf Document');
    expect(formatPublicationLinkLabel('  pdf  ')).toBe('Pdf');
  });

  it('handles multiple consecutive separators', () => {
    expect(formatPublicationLinkLabel('pdf__document')).toBe('Pdf Document');
    expect(formatPublicationLinkLabel('pdf--document')).toBe('Pdf Document');
    expect(formatPublicationLinkLabel('pdf  document')).toBe('Pdf Document');
  });

  it('handles empty segments from leading/trailing separators', () => {
    expect(formatPublicationLinkLabel('_pdf_document')).toBe('Pdf Document');
    expect(formatPublicationLinkLabel('pdf_document_')).toBe('Pdf Document');
  });
});

describe('resolvePublicationLinks', () => {
  it('returns PublicationLinkEntry array with formatted labels', () => {
    const publication: Publication = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: {
        pdf: 'https://example.com/paper.pdf',
        code: 'https://github.com/example/repo',
      },
    };

    const result = resolvePublicationLinks(publication);

    expect(result).toEqual([
      { name: 'pdf', href: 'https://example.com/paper.pdf', label: 'Pdf' },
      { name: 'code', href: 'https://github.com/example/repo', label: 'Code' },
    ]);
  });

  it('returns empty array when publication has no links', () => {
    const publication: Publication = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
    };

    const result = resolvePublicationLinks(publication);

    expect(result).toEqual([]);
  });

  it('returns empty array when links is empty object', () => {
    const publication: Publication = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: {},
    };

    const result = resolvePublicationLinks(publication);

    expect(result).toEqual([]);
  });

  it('trims whitespace from link names and hrefs', () => {
    const publication: Publication = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: {
        '  pdf  ': '  https://example.com/paper.pdf  ',
      },
    };

    const result = resolvePublicationLinks(publication);

    expect(result).toEqual([
      { name: 'pdf', href: 'https://example.com/paper.pdf', label: 'Pdf' },
    ]);
  });

  it('filters out links with empty names or hrefs', () => {
    const publication: Publication = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: {
        pdf: 'https://example.com/paper.pdf',
        '': 'https://example.com/empty-name',
        code: '   ',
        website: '',
      },
    };

    const result = resolvePublicationLinks(publication);

    expect(result).toEqual([
      { name: 'pdf', href: 'https://example.com/paper.pdf', label: 'Pdf' },
    ]);
  });

  it('formats labels correctly for multi-word link names', () => {
    const publication: Publication = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      links: {
        'source_code': 'https://github.com/example/repo',
        'project-website': 'https://example.com',
      },
    };

    const result = resolvePublicationLinks(publication);

    expect(result).toEqual([
      { name: 'source_code', href: 'https://github.com/example/repo', label: 'Source Code' },
      { name: 'project-website', href: 'https://example.com', label: 'Project Website' },
    ]);
  });
});
