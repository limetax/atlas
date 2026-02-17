/**
 * Text sanitization utility for PostgreSQL compatibility
 *
 * PostgreSQL with UTF-8 encoding cannot store certain Unicode characters:
 * - Null bytes (\u0000)
 * - Control characters (except newlines, tabs, carriage returns)
 * - Unpaired surrogate halves (invalid UTF-16 sequences)
 *
 * WARNING: This implementation removes ALL surrogate pairs, which includes emojis.
 * Emojis in JavaScript are represented as surrogate pairs (e.g., 😊 is \uD83D\uDE0A).
 * A more sophisticated implementation would preserve valid surrogate pairs and only
 * remove unpaired surrogates.
 */

export type SanitizationResult = {
  /** The sanitized text safe for PostgreSQL storage */
  sanitized: string;
  /** Number of characters removed during sanitization */
  charsRemoved: number;
};

/**
 * Sanitize text to remove invalid Unicode characters that PostgreSQL can't handle.
 *
 * Process:
 * 1. Remove surrogate pairs (includes emojis) - range \uD800-\uDFFF
 * 2. Remove null bytes and control characters (except \n, \t, \r)
 * 3. Normalize to NFC form (canonical composition)
 *
 * @param text - The text content to sanitize
 * @returns Object containing sanitized text and count of removed characters
 *
 * @example
 * ```typescript
 * const result = sanitizeTextForPostgres('Hello 😊 World\u0000');
 * // result.sanitized = 'Hello  World'
 * // result.charsRemoved = 3 (emoji + null byte)
 * ```
 */
export const sanitizeTextForPostgres = (text: string): SanitizationResult => {
  const originalLength = text.length;

  const sanitized = text
    // Remove surrogate pairs (invalid UTF-8) - NOTE: This also removes emojis
    .replace(/[\uD800-\uDFFF]/g, '')
    // Remove null bytes and problematic control characters but keep newlines (\n), tabs (\t), and carriage returns (\r)
    // eslint-disable-next-line no-control-regex -- Intentionally removing control characters for PostgreSQL compatibility
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Normalize Unicode to NFC form (canonical composition)
    .normalize('NFC');

  const charsRemoved = originalLength - sanitized.length;

  return {
    sanitized,
    charsRemoved,
  };
};
