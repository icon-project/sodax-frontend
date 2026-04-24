import type { DeepPartial } from '@sodax/types';

/**
 * Recursively merges `source` into `target`, returning a new object.
 *
 * - Plain objects are merged key-by-key; defaults on `target` survive when `source` omits them.
 * - Arrays are replaced wholesale (not concatenated or merged element-wise).
 * - Primitives and `null` are replaced.
 * - `undefined` in `source` is skipped, so passing `{ foo: undefined }` preserves the default.
 * - `target` is never mutated.
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceVal = (source as Record<keyof T, unknown>)[key];
    const targetVal = target[key];
    if (
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      sourceVal !== null &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as DeepPartial<Record<string, unknown>>,
      ) as T[keyof T];
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal as T[keyof T];
    }
  }
  return result;
}
