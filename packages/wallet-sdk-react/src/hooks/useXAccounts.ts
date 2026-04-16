import { useMemo } from 'react';
import type { ChainType } from '@sodax/types';
import type { XAccount } from '../types/index.js';
import { useXWalletStore } from '../useXWalletStore.js';

/**
 * Hook to get all connected accounts across enabled chains.
 *
 * Reads from store only (single source of truth). Providers hydrate connection state into store.
 */
export function useXAccounts() {
  const enabledChains = useXWalletStore(state => state.enabledChains);
  const xConnections = useXWalletStore(state => state.xConnections);

  return useMemo(() => {
    const result: Partial<Record<ChainType, XAccount>> = {};
    for (const xChainType of enabledChains) {
      const xConnection = xConnections[xChainType];
      result[xChainType] = xConnection?.xAccount ?? { address: undefined, xChainType };
    }
    return result;
  }, [enabledChains, xConnections]);
}
