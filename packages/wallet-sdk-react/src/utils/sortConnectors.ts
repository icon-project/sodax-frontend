import type { IXConnector } from '../types/interfaces.js';

export type SortConnectorsOptions = {
  /** Connector IDs to prioritize. Earlier entries win. */
  preferred?: readonly string[];
};

/**
 * Stable sort of connectors for display. Ranking (highest first):
 *   1. Appears in `preferred[]` — earlier entries rank higher
 *   2. `connector.isInstalled === true`
 *   3. Original order (stable)
 *
 * Pure function — does not subscribe or read window.
 */
export function sortConnectors<T extends IXConnector>(
  connectors: readonly T[],
  options: SortConnectorsOptions = {},
): T[] {
  const { preferred = [] } = options;
  const preferredIndex = new Map(preferred.map((id, i) => [id, i]));

  return [...connectors]
    .map((connector, originalIndex) => ({ connector, originalIndex }))
    .sort((a, b) => {
      const aPref = preferredIndex.get(a.connector.id);
      const bPref = preferredIndex.get(b.connector.id);
      if (aPref !== bPref) {
        if (aPref === undefined) return 1;
        if (bPref === undefined) return -1;
        return aPref - bPref;
      }
      if (a.connector.isInstalled !== b.connector.isInstalled) {
        return a.connector.isInstalled ? -1 : 1;
      }
      return a.originalIndex - b.originalIndex;
    })
    .map(({ connector }) => connector);
}
