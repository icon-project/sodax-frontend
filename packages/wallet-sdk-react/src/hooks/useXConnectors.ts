import type { ChainType } from '@sodax/types';
import type { XConnector } from '../core';
import { useXWalletStore } from '../useXWalletStore';

/**
 * Hook to retrieve available wallet connectors for a specific blockchain type.
 * Reads from the centralized store — connectors are hydrated by chain providers
 * or discovered async during initChainServices (Stellar, NEAR).
 */
export function useXConnectors(xChainType: ChainType | undefined): XConnector[] {
  return useXWalletStore(state => (xChainType ? state.xConnectorsByChain[xChainType] ?? [] : []));
}
