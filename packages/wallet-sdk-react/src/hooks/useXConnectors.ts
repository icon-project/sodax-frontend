import { useSyncExternalStore } from 'react';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '../core/index.js';
import { useXWalletStore } from '../useXWalletStore.js';
import { getInstallCounter, subscribeInstall } from '../utils/installSubscription.js';

const warnedChains = new Set<ChainType>();

/**
 * Hook to retrieve available wallet connectors for a specific blockchain type,
 * with enriched metadata per spec §F (isInstalled, installUrl, iconUrl, isPreferred).
 *
 * Subscribes to install events (window focus, visibilitychange, EIP-6963) so
 * the component re-renders when a wallet extension is installed/uninstalled,
 * giving consumers fresh `isInstalled` values without polling.
 *
 * Logs a one-time warning per chain if the requested chain is not enabled in
 * SodaxWalletProvider config.chains, to help debug missing connector lists.
 */
export function useXConnectors(xChainType: ChainType | undefined): XConnector[] {
  const storeConnectors = useXWalletStore(state => {
    if (!xChainType) return [];
    if (!state.enabledChains.includes(xChainType) && !warnedChains.has(xChainType)) {
      warnedChains.add(xChainType);
      console.warn(
        `[useXConnectors] chain "${xChainType}" is not enabled in SodaxWalletProvider config.chains — returning empty list`,
      );
    }
    return state.xConnectorsByChain[xChainType] ?? [];
  });

  // Trigger re-render on install events. Return value is discarded — we only
  // need the subscription side effect so `connector.isInstalled` getters are
  // re-read in the next render cycle.
  useSyncExternalStore(subscribeInstall, getInstallCounter, () => 0);

  // Fresh array reference per render invalidates downstream `useMemo([connectors])`
  // when the component re-renders on install events. Cost is negligible for
  // realistic connector counts (< 40 across all chains).
  return [...storeConnectors];
}
