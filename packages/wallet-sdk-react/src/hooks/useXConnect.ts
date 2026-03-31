import type { XAccount } from '@/types';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { XConnector } from '../core/XConnector';
import { useXWagmiStore } from '../useXWagmiStore';
import { useChainActionsRegistry } from '../context/ChainActionsContext';

/**
 * Hook for connecting to various blockchain wallets across different chains.
 *
 * Delegates to ChainActions registered by providers for EVM/SUI/SOLANA.
 * Falls back to XConnector.connect() for other chains.
 */
export function useXConnect(): UseMutationResult<XAccount | undefined, Error, XConnector> {
  const setXConnection = useXWagmiStore(state => state.setXConnection);
  const actionsRegistry = useChainActionsRegistry();

  return useMutation({
    mutationFn: async (xConnector: XConnector) => {
      const xChainType = xConnector.xChainType;
      const chainActions = actionsRegistry[xChainType];

      let xAccount: XAccount | undefined;

      if (chainActions) {
        // Delegate to provider-registered actions (EVM, SUI, SOLANA)
        xAccount = await chainActions.connect(xConnector.id);
      } else {
        // Fallback for non-provider chains (ICON, Injective, Stellar, Bitcoin, Near, Stacks)
        xAccount = await xConnector.connect();
      }

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
