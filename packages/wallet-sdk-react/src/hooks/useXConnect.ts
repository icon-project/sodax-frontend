import type { XAccount } from '@/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { XConnector } from '../core/XConnector';
import { useXWalletStore } from '../useXWalletStore';
import { useChainActionsRegistry } from '../context/ChainActionsContext';

/**
 * Hook for connecting to various blockchain wallets across different chains.
 *
 * All chains delegate to ChainActions registered in the store.
 */
export function useXConnect(): UseMutationResult<XAccount | undefined, Error, XConnector> {
  const setXConnection = useXWalletStore(state => state.setXConnection);
  const actionsRegistry = useChainActionsRegistry();

  return useMutation({
    mutationFn: async (xConnector: XConnector) => {
      const chainActions = actionsRegistry[xConnector.xChainType];
      if (!chainActions) {
        throw new Error(`Chain "${xConnector.xChainType}" is not enabled or ChainActions not registered`);
      }

      const xAccount = await chainActions.connect(xConnector.id);

      if (xAccount) {
        setXConnection(xConnector.xChainType, {
          xAccount,
          xConnectorId: xConnector.id,
        });
      }

      return xAccount;
    },
  });
}
