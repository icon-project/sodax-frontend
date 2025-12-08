// Utility to parse a plain JSON object into a readonly Token[] type
// Ensures object array matches minimum Token property requirements

import type { Token } from '@sodax/types';

/**
 * Safely parse a JSON value presumed to be an array of Token-like objects
 * Returns a readonly Token[] if successfully parsed, throws otherwise
 * @param input the JSON value to parse
 */
export function parseTokenArrayFromJson(input: unknown): readonly Token[] {
  if (!Array.isArray(input)) {
    throw new TypeError('Input must be an array');
  }

  // Validate and collect Token entries using a for loop,
  // ensuring the minimum required Token properties are present
  const tokens: Token[] = [];
  for (let idx = 0; idx < input.length; idx++) {
    const item = input[idx];
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as Record<string, unknown>).symbol !== 'string' ||
      typeof (item as Record<string, unknown>).name !== 'string' ||
      typeof (item as Record<string, unknown>).address !== 'string' ||
      typeof (item as Record<string, unknown>).decimals !== 'number'
    ) {
      throw new TypeError(`Item at index ${idx} is not a valid Token`);
    }
    // Safe cast due to prior validation
    tokens.push(item as Token);
  }

  return tokens;
}
