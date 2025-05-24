/**
 * Parse a comma or space-separated list of words
 * @param {string} input - The input string to parse
 * @returns {string[]} - Array of parsed words
 */
export function parseWordList(input) {
  if (!input || typeof input !== 'string') {
    return [];
  }
  return input.split(/[\s,]+/).filter(word => word.trim().length > 0);
} 