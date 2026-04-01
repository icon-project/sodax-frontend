import type { ChainType } from '@sodax/types';
import { useCallback } from 'react';
import { useXWalletStore } from '../useXWalletStore';
import { useChainActionsRegistry } from '../context/ChainActionsContext';

/**
 * Hook for disconnecting from a specific blockchain wallet.
 *
 * All chains delegate to ChainActions registered in the store.
 */
export function useXDisconnect(): (xChainType: ChainType) => Promise<void> {
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);
  const actionsRegistry = useChainActionsRegistry();

  return useCallback(
    async (xChainType: ChainType) => {
      const chainActions = actionsRegistry[xChainType];
      if (chainActions) {
        await chainActions.disconnect();
      }
      unsetXConnection(xChainType);
    },
    [unsetXConnection, actionsRegistry],
  );
}
