/**
 * Shallow-merge wallet provider config layers from least → most specific.
 * Later layers override earlier ones at the top level only — nested objects
 * are replaced wholesale, not merged. `undefined` layers are skipped.
 *
 * Used to combine constructor defaults with per-call options:
 *   shallowMerge(this.defaults.sendTransaction, perCallOptions)
 */
export function shallowMerge<T extends object>(...layers: Array<T | undefined>): T {
  const result = {} as T;
  for (const layer of layers) {
    if (layer !== undefined) Object.assign(result, layer);
  }
  return result;
}
