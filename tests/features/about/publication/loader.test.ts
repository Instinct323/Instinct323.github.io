import { describe, expect, it } from 'vitest';
import { sortPublicationsByAuthor } from '~/features/about/publication/loader';
import type { Publication } from '~/features/about/publication/types';

describe('sortPublicationsByAuthor', () => {
  it('ranks authored publications first and missing authors last', () => {
    const publications: Publication[] = [
      { title: 'Missing Author', authors: ['Other Author'], date: '2026-01-01' },
      { title: 'Second Author', authors: ['Other Author', 'Jane Doe'], date: '2025-01-01' },
      { title: 'First Author', authors: ['Jane Doe', 'Other Author'], date: '2024-01-01' },
    ];

    expect(sortPublicationsByAuthor(publications, 'Jane Doe').map(({ title }) => title)).toEqual([
      'First Author',
      'Second Author',
      'Missing Author',
    ]);
  });

  it('uses existing date and title tie-breaking behavior for author-rank ties', () => {
    const publications: Publication[] = [
      { title: 'Zulu Invalid Date', authors: ['Jane Doe'], date: 'not-a-date' },
      { title: 'Older Date', authors: ['Jane Doe'], date: '2023-01-01' },
      { title: 'Alpha Invalid Date', authors: ['Jane Doe'], date: 'not-a-date' },
      { title: 'Newer Date', authors: ['Jane Doe'], date: '2024-01-01' },
    ];

    expect(sortPublicationsByAuthor(publications, 'Jane Doe').map(({ title }) => title)).toEqual([
      'Alpha Invalid Date',
      'Zulu Invalid Date',
      'Newer Date',
      'Older Date',
    ]);
  });

  it('does not mutate input', () => {
    const publications: Publication[] = [
      { title: 'Second Author', authors: ['Other Author', 'Jane Doe'], date: '2025-01-01' },
      { title: 'First Author', authors: ['Jane Doe', 'Other Author'], date: '2024-01-01' },
    ];
    const original = structuredClone(publications);

    sortPublicationsByAuthor(publications, 'Jane Doe');

    expect(publications).toEqual(original);
  });
});
