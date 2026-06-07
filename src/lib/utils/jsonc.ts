/**
 * Strips JSONC comments and trailing commas from a string for JSON.parse.
 * Handles // line comments, slash-star block comments, and strings containing comment markers.
 */
export function stripJsoncComments(raw: string): string {
  let result = '';
  let i = 0;
  const len = raw.length;

  while (i < len) {
    if (raw[i] === '"') {
      let j = i + 1;
      while (j < len && raw[j] !== '"') {
        if (raw[j] === '\\') j++;
        j++;
      }
      result += raw.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    if (raw[i] === '/' && raw[i + 1] === '*') {
      let j = i + 2;
      while (j < len && !(raw[j] === '*' && raw[j + 1] === '/')) j++;
      i = j + 2;
      continue;
    }

    if (raw[i] === '/' && raw[i + 1] === '/') {
      let j = i + 2;
      while (j < len && raw[j] !== '\n') j++;
      i = j;
      continue;
    }

    result += raw[i];
    i++;
  }

  return result.replace(/,(\s*[}\]])/g, '$1');
}