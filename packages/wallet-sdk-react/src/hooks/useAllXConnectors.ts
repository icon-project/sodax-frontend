import { useSyncExternalStore } from 'react';
import type { IXConnector } from '../types/interfaces.js';
import { useXWalletStore } from '../useXWalletStore.js';
import { getInstallCounter, subscribeInstall } from '../utils/installSubscription.js';

/**
 * All enriched connectors from enabled chains, flat. Subscribes to install
 * events so consumers re-render when wallets are installed/uninstalled.
 *
 * Useful when callers need to scan across chains — e.g. building a global
 * installed-wallets list or finding every connector for a multi-chain wallet
 * like Hana (appears on EVM, ICON, Solana, Sui, Stellar).
 *
 * @example
 * // All Hana connectors across chains
 * const hana = useAllXConnectors().filter(c => c.name.toLowerCase().includes('hana'));
 *
 * @example
 * // Debug: inspect actual IDs/names surfaced by native SDKs
 * console.log(useAllXConnectors().map(c => ({ chain: c.xChainType, id: c.id, name: c.name })));
 */
export function useAllXConnectors(): IXConnector[] {
  const connectorsByChain = useXWalletStore(s => s.xConnectorsByChain);

  // Trigger re-render on install events. Return value discarded — subscription
  // side effect ensures `connector.isInstalled` getters are re-read next render.
  useSyncExternalStore(subscribeInstall, getInstallCounter, () => 0);

  const all: IXConnector[] = [];
  for (const connectors of Object.values(connectorsByChain)) {
    if (!connectors) continue;
    all.push(...connectors);
  }
  return all;
}
