/**
 * Shallow-merge wallet provider config layers from least → most specific.
 * Later layers override earlier ones at the top level only — nested objects
 * are replaced wholesale, not merged. Both `undefined` layers AND `undefined`
 * values inside layers are skipped, so callers can pass `{ field: undefined }`
 * to mean "no preference, use the previous layer's value".
 *
 * Used to combine constructor defaults with per-call options:
 *   shallowMerge(this.defaults.sendTransaction, perCallOptions)
 */
export function shallowMerge<T extends object>(...layers: Array<T | undefined>): T {
  const result = {} as T;
  for (const layer of layers) {
    if (layer === undefined) continue;
    for (const key of Object.keys(layer) as Array<keyof T>) {
      const value = layer[key];
      if (value !== undefined) result[key] = value;
    }
  }
  return result;
}
