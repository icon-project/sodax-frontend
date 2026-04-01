import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { ChainType } from '@sodax/types';
import { useChainActionsRegistry } from '../context/ChainActionsContext';

type SignMessageReturnType = `0x${string}` | Uint8Array | string | undefined;

/**
 * Hook for signing messages across different chains.
 *
 * All chains delegate to ChainActions.signMessage registered in the store.
 */
export function useXSignMessage(): UseMutationResult<
  SignMessageReturnType,
  Error,
  { xChainType: ChainType; message: string },
  unknown
> {
  const actionsRegistry = useChainActionsRegistry();

  return useMutation({
    mutationFn: async ({ xChainType, message }: { xChainType: ChainType; message: string }) => {
      const chainActions = actionsRegistry[xChainType];
      if (!chainActions?.signMessage) {
        throw new Error(`signMessage not supported for chain "${xChainType}"`);
      }
      return await chainActions.signMessage(message);
    },
  });
}
