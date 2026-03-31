import type { ChainType } from '@sodax/types';
import type { XConnection } from '../types';
import { useXWagmiStore } from '../useXWagmiStore';

/**
 * Hook for accessing connection details for a specific blockchain.
 *
 * Reads connection state from the centralized store (single source of truth).
 *
 * @param xChainType - The type of blockchain to get connection details for
 * @returns Connection details including account and connector ID, or undefined if not connected
 */
export function useXConnection(xChainType: ChainType | undefined): XConnection | undefined {
  return useXWagmiStore(state => (xChainType ? state.xConnections?.[xChainType] : undefined));
}
