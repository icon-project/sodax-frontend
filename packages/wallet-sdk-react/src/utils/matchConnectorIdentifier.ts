import type { IXConnector } from '@/types/interfaces.js';

/**
 * Case-insensitive substring match against `connector.id` and `connector.name`.
 * Shared by `useBatchConnect` and `useBatchDisconnect` so user-supplied wallet
 * identifiers (e.g. `'hana'`, `'phantom'`) resolve to connector instances the
 * same way in both directions.
 */
export function matchesConnectorIdentifier(connector: IXConnector, identifier: string): boolean {
  const needle = identifier.toLowerCase();
  return connector.id.toLowerCase().includes(needle) || connector.name.toLowerCase().includes(needle);
}
