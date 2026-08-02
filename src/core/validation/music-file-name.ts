export function validateMusicFileName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Invalid music: expected a non-empty filename');
  }
  if (value !== value.trim()) {
    throw new Error('Invalid music: filename must not have leading or trailing whitespace');
  }
  if (value.includes('/') || value.includes('\\')) {
    throw new Error('Invalid music: filename must not contain path separators');
  }
  if (value.includes('..')) {
    throw new Error('Invalid music: filename must not contain traversal segments');
  }
  if (!value.endsWith('.ogg')) {
    throw new Error('Invalid music: filename must use the .ogg extension');
  }

  return value;
}
