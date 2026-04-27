import type { ChainType } from '@sodax/types';
import { useXWalletStore } from '@/useXWalletStore.js';
import type { IXConnector } from '@/types/interfaces.js';

const warnedChains = new Set<ChainType>();

/**
 * Hook to retrieve available wallet connectors for a specific blockchain type,
 * with enriched metadata (isInstalled, installUrl, icon).
 *
 * `connector.isInstalled` reads current `window` state at render time.
 *
 * Logs a one-time warning per chain if the requested chain is not enabled in
 * SodaxWalletProvider config.chains, to help debug missing connector lists.
 */
export function useXConnectors(xChainType: ChainType | undefined): IXConnector[] {
  return useXWalletStore(state => {
    if (!xChainType) return [];
    if (!state.enabledChains.includes(xChainType) && !warnedChains.has(xChainType)) {
      warnedChains.add(xChainType);
      console.warn(
        `[useXConnectors] chain "${xChainType}" is not enabled in SodaxWalletProvider config.chains — returning empty list`,
      );
    }
    return state.xConnectorsByChain[xChainType] ?? [];
  });
}
