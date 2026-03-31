import type { ChainType } from '@sodax/types';
import { useCallback } from 'react';
import { getXService } from '../actions';
import { useXWalletStore } from '../useXWalletStore';
import { useChainActionsRegistry } from '../context/ChainActionsContext';
import type { NearXService } from '@/xchains/near/NearXService';

/**
 * Hook for disconnecting from a specific blockchain wallet.
 *
 * Delegates to ChainActions for EVM/SUI/SOLANA.
 * Falls back to XService/XConnector for other chains.
 */
export function useXDisconnect(): (xChainType: ChainType) => Promise<void> {
  const xConnections = useXWalletStore(state => state.xConnections);
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);
  const actionsRegistry = useChainActionsRegistry();

  return useCallback(
    async (xChainType: ChainType) => {
      const chainActions = actionsRegistry[xChainType];

      if (chainActions) {
        // Delegate to provider-registered actions (EVM, SUI, SOLANA)
        await chainActions.disconnect();
      } else {
        // Fallback for non-provider chains
        switch (xChainType) {
          case 'NEAR': {
            const nearXService = getXService('NEAR') as NearXService;
            nearXService.walletSelector.disconnect();
            break;
          }
          default: {
            const xService = getXService(xChainType);
            const xConnectorId = xConnections[xChainType]?.xConnectorId;
            const xConnector = xConnectorId ? xService.getXConnectorById(xConnectorId) : undefined;
            await xConnector?.disconnect();
            break;
          }
        }
      }

      unsetXConnection(xChainType);
    },
    [xConnections, unsetXConnection, actionsRegistry],
  );
}
