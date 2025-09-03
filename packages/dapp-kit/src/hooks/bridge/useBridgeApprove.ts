import { useSodaxContext } from '../shared/useSodaxContext';
import type { CreateBridgeIntentParams, SpokeProvider } from '@sodax/sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UseBridgeApproveReturn {
  approve: (params: CreateBridgeIntentParams) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Hook for approving token spending for bridge actions
 * @param spokeProvider The spoke provider instance for the chain
 * @returns Object containing approve function, loading state, error state and reset function
 * @example
 * ```tsx
 * const { approve, isLoading, error } = useBridgeApprove(spokeProvider);
 *
 * // Approve tokens for bridge action
 * await approve({
 *   srcChainId: '0x2105.base',
 *   srcAsset: '0x...',
 *   amount: 1000n,
 *   dstChainId: '0x89.polygon',
 *   dstAsset: '0x...',
 *   recipient: '0x...'
 * });
 * ```
 */
export function useBridgeApprove(spokeProvider: SpokeProvider | undefined): UseBridgeApproveReturn {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  const {
    mutateAsync: approve,
    isPending,
    error,
    reset: resetError,
  } = useMutation({
    mutationFn: async (params: CreateBridgeIntentParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const allowance = await sodax.bridge.approve({
        params,
        spokeProvider,
      });

      if (!allowance.ok) {
        throw new Error('Failed to approve tokens for bridge');
      }
      return true;
    },
    onSuccess: (_, params) => {
      // Invalidate allowance query to refetch the new allowance
      queryClient.invalidateQueries({ queryKey: ['bridge-allowance', params] });
    },
  });

  return {
    approve,
    isLoading: isPending,
    error: error,
    resetError,
  };
}
