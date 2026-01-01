import { transliterate } from 'transliteration';
import sanitize from 'sanitize-filename';

const PROBLEMATIC_PUNCTUATION = /['''""`,;:!?]/g;
const MULTIPLE_SPACES = /\s+/g;
const MULTIPLE_UNDERSCORES = /_+/g;
const TRAILING_DOTS_SPACES = /[.\s_]+$/;
const LEADING_DOTS_SPACES = /^[.\s_]+/;
const MAX_FILENAME_LENGTH = 200;

export function sanitizeFilename(filename: string): string {
  let sanitized = filename;

  // Step 1: Transliterate non-ASCII to ASCII (ä→a, ö→o, ü→u, etc.)
  sanitized = transliterate(sanitized);

  // Step 2: Remove problematic punctuation (apostrophes, commas, etc.)
  sanitized = sanitized.replace(PROBLEMATIC_PUNCTUATION, '');

  // Step 3: Use sanitize-filename for OS-reserved names and dangerous chars
  sanitized = sanitize(sanitized, { replacement: '_' });

  // Step 4: Clean up whitespace and underscores
  sanitized = sanitized
    .replace(MULTIPLE_SPACES, ' ')
    .replace(MULTIPLE_UNDERSCORES, '_')
    .replace(TRAILING_DOTS_SPACES, '')
    .replace(LEADING_DOTS_SPACES, '');

  // Step 5: Handle empty result
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'untitled';
  }

  // Step 6: Truncate to safe length
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
  }

  return sanitized.trim();
}
