import type { XAccount } from '@/types/index.js';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { XConnector } from '../core/XConnector.js';
import { useXWalletStore } from '../useXWalletStore.js';

/**
 * Hook for connecting to various blockchain wallets across different chains.
 *
 * All chains delegate to ChainActions registered in the store.
 *
 * Note: For provider-managed chains (EVM, Solana, Sui), the mutation resolves with `undefined`
 * because connection state is set reactively by the chain's Hydrator component, not by the
 * connect action itself. Use `useXConnection` or `useXAccount` to read the connected account.
 */
export function useXConnect(): UseMutationResult<XAccount | undefined, Error, XConnector> {
  const setXConnection = useXWalletStore(state => state.setXConnection);
  const actionsRegistry = useXWalletStore(state => state.chainActions);

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
