import type { ChainType } from '@sodax/types';
import type { XConnector } from '../core';
import { useXWalletStore } from '../useXWalletStore';

const warnedChains = new Set<ChainType>();

/**
 * Hook to retrieve available wallet connectors for a specific blockchain type.
 * Reads from the centralized store — connectors are hydrated by chain providers
 * or discovered async during initChainServices (Stellar, NEAR).
 *
 * Logs a one-time warning per chain if the requested chain is not enabled in
 * SodaxWalletProvider config.chains, to help debug missing connector lists.
 */
export function useXConnectors(xChainType: ChainType | undefined): XConnector[] {
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
