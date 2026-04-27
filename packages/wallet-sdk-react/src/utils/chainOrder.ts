import type { ChainType } from '@sodax/types';

/**
 * Sort comparator for `ChainType` against a caller-supplied order list.
 * Chains not in `order` fall to the bottom and sort alphabetically among
 * themselves. Shared by `useChainGroups` and `useConnectedChains` so the
 * two hooks report identical orderings for the same `order` input.
 *
 * Internal — not re-exported from the package barrel.
 */
export function compareChainByOrder(a: ChainType, b: ChainType, order: readonly ChainType[]): number {
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia === -1 && ib === -1) return a.localeCompare(b);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}
