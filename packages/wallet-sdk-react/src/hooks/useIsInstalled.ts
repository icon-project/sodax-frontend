import { useSyncExternalStore } from 'react';
import type { IXConnector } from '../types/interfaces.js';
import { useXWalletStore } from '../useXWalletStore.js';
import { getInstallCounter, subscribeInstall } from '../utils/installSubscription.js';

/**
 * Returns true if any connector across all enabled chains matches the predicate
 * AND reports `isInstalled === true`. Useful for cross-chain wallet detection —
 * e.g. Hana installs a single browser extension but surfaces as connectors on
 * multiple chains (EVM, ICON, Solana, Sui, Stellar).
 *
 * Scan cost is trivial (< 40 connectors total); running every render keeps the
 * code simple and frees consumers from wrapping predicates in useCallback.
 *
 * @example
 * const isHanaInstalled = useIsInstalled(c => c.name.toLowerCase().includes('hana'));
 * const isPhantomInstalled = useIsInstalled(c => c.name === 'Phantom');
 * const hasAnyBtcWallet = useIsInstalled(c => c.xChainType === 'BITCOIN');
 */
export function useIsInstalled(predicate: (connector: IXConnector) => boolean): boolean {
  const connectorsByChain = useXWalletStore(s => s.xConnectorsByChain);

  // Trigger re-render on install events so the scan below sees fresh
  // `connector.isInstalled` values. Subscription value itself is unused.
  useSyncExternalStore(subscribeInstall, getInstallCounter, () => 0);

  for (const connectors of Object.values(connectorsByChain)) {
    if (!connectors) continue;
    for (const connector of connectors) {
      if (predicate(connector) && connector.isInstalled) return true;
    }
  }
  return false;
}
