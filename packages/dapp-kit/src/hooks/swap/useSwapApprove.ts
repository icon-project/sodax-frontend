import { useSodaxContext } from '../shared/useSodaxContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateIntentParams, SpokeProvider } from '@sodax/sdk';

interface UseApproveReturn {
  approve: ({ params }: { params: CreateIntentParams }) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Hook for approving token spending for swap operations.
 *
 * This hook provides a mutation function to approve token spending for cross-chain swap intents.
 *
 * @param {CreateIntentParams | undefined} params - The swap intent parameters. If undefined, the approval will fail.
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider instance for the chain
 *
 * @returns {UseApproveReturn} Object containing:
 *   - approve: Function to approve token spending for the swap intent
 *   - isLoading: Boolean indicating if the approval is in progress
 *   - error: Error object if the approval failed
 *   - resetError: Function to reset the error state
 *
 * @example
 * ```typescript
 * const { approve, isLoading, error } = useSwapApprove(params, spokeProvider);
 *
 * // Approve tokens for swap action
 * await approve({
 *   params: {
 *     token_src: '0x...',
 *     token_src_blockchain_id: 'arbitrum',
 *     token_dst: '0x...',
 *     token_dst_blockchain_id: 'polygon',
 *     amount: '1000000000000000000',
 *     min_output_amount: '900000000000000000'
 *   }
 * });
 * ```
 */

export function useSwapApprove(
  params: CreateIntentParams | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseApproveReturn {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  const {
    mutateAsync: approve,
    isPending,
    error,
    reset: resetError,
  } = useMutation({
    mutationFn: async ({ params }: { params: CreateIntentParams | undefined }) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }
      if (!params) {
        throw new Error('Swap Params not found');
      }

      const allowance = await sodax.swaps.approve({
        intentParams: params,
        spokeProvider,
      });
      if (!allowance.ok) {
        throw new Error('Failed to approve input token');
      }
      return allowance.ok;
    },
    onSuccess: () => {
      // Invalidate allowance query to refetch the new allowance
      queryClient.invalidateQueries({ queryKey: ['allowance', params] });
    },
  });

  return {
    approve,
    isLoading: isPending,
    error: error,
    resetError,
  };
}
