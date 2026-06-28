import { describe, expect, it } from 'vitest';
import {
  normalizePublication,
  formatPublicationLinkLabel,
  resolvePublicationLinks,
  resolveEmbedUrl,
  buildVideoEmbedUrl,
} from '~/features/about/publication/utils';
import type { Publication } from '~/features/site/types';

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
      'Missing or invalid title (must be a non-empty string)'
    );
  });

  it('throws when date is missing', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
    };

    expect(() => normalizePublication(raw, filePath)).toThrow(
      'Missing or invalid date (must be a non-empty string)'
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

  it('includes video field when provided', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      video: 'https://www.bilibili.com/video/BV1ewjw6qEbY',
    };

    const result = normalizePublication(raw, filePath);

    expect(result.video).toBe('https://www.bilibili.com/video/BV1ewjw6qEbY');
  });

  it('returns undefined video when given empty string', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
      video: '   ',
    };

    const result = normalizePublication(raw, filePath);

    expect(result.video).toBeUndefined();
  });

  it('returns undefined video when video field is omitted', () => {
    const raw = {
      title: 'Test Title',
      authors: ['John Doe'],
      date: '2024-01-15',
    };

    const result = normalizePublication(raw, filePath);

    expect(result.video).toBeUndefined();
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
      pdf: 'https://example.com/paper.pdf',
      code: 'https://github.com/example/repo',
      arxiv: 'https://arxiv.org/abs/1234',
    });
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
      { name: 'code', href: 'https://github.com/example/repo', label: 'Code' },
      { name: 'pdf', href: 'https://example.com/paper.pdf', label: 'Pdf' },
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
      { name: 'project-website', href: 'https://example.com', label: 'Project Website' },
      { name: 'source_code', href: 'https://github.com/example/repo', label: 'Source Code' },
    ]);
  });
});

describe('resolveEmbedUrl', () => {
  it('converts Bilibili video page URL to base embed URL', () => {
    const result = resolveEmbedUrl('https://www.bilibili.com/video/BV1ewjw6qEbY');
    expect(result).toBe('https://player.bilibili.com/player.html?bvid=BV1ewjw6qEbY&page=1&high_quality=1');
  });

  it('converts YouTube watch URL to base embed URL', () => {
    const result = resolveEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('converts YouTube short URL to base embed URL', () => {
    const result = resolveEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('passes through already-embed URLs unchanged', () => {
    expect(resolveEmbedUrl('https://player.bilibili.com/player.html?bvid=BV1ewjw6qEbY&page=1'))
      .toBe('https://player.bilibili.com/player.html?bvid=BV1ewjw6qEbY&page=1');
    expect(resolveEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(resolveEmbedUrl('https://youtube.com/embed/dQw4w9WgXcQ'))
      .toBe('https://youtube.com/embed/dQw4w9WgXcQ');
  });

  it('returns undefined for invalid or unsupported URLs', () => {
    expect(resolveEmbedUrl('https://example.com/not-a-video')).toBeUndefined();
    expect(resolveEmbedUrl('')).toBeUndefined();
    expect(resolveEmbedUrl('not-a-url')).toBeUndefined();
  });
});

describe('buildVideoEmbedUrl', () => {
  it('adds autoplay to Bilibili embed URL', () => {
    const result = buildVideoEmbedUrl('https://www.bilibili.com/video/BV1ewjw6qEbY');
    expect(result).toBe('https://player.bilibili.com/player.html?bvid=BV1ewjw6qEbY&page=1&high_quality=1&autoplay=1');

    const embedBili = 'https://player.bilibili.com/player.html?bvid=BV1ewjw6qEbY&page=1';
    expect(buildVideoEmbedUrl(embedBili))
      .toBe('https://player.bilibili.com/player.html?bvid=BV1ewjw6qEbY&page=1&autoplay=1');
  });

  it('adds autoplay, loop, mute, and playlist to YouTube embed URL', () => {
    const result = buildVideoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&loop=1&mute=1&playlist=dQw4w9WgXcQ');

    const shortResult = buildVideoEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(shortResult).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&loop=1&mute=1&playlist=dQw4w9WgXcQ');

    const embedYt = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    expect(buildVideoEmbedUrl(embedYt))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&loop=1&mute=1&playlist=dQw4w9WgXcQ');
  });

  it('adds autoplay, loop, mute, and playlist to YouTube embed URL without www', () => {
    const embedYt = 'https://youtube.com/embed/dQw4w9WgXcQ';
    expect(buildVideoEmbedUrl(embedYt))
      .toBe('https://youtube.com/embed/dQw4w9WgXcQ?autoplay=1&loop=1&mute=1&playlist=dQw4w9WgXcQ');
  });

  it('returns undefined when resolveEmbedUrl returns undefined', () => {
    expect(buildVideoEmbedUrl('https://example.com/not-a-video')).toBeUndefined();
    expect(buildVideoEmbedUrl('')).toBeUndefined();
  });
});
