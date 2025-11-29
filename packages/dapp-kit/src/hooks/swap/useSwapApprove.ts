import { useSodaxContext } from '../shared/useSodaxContext';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CreateIntentParams, SpokeProvider } from '@sodax/sdk';

/**
 * Hook for approving token spending for swap operations.
 *
 * This hook provides a mutation function to approve token spending for cross-chain swap intents.
 * Returns the standard React Query useMutation result.
 *
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider instance for the chain
 *
 * @returns {UseMutationResult<boolean, Error, { params: CreateIntentParams }>} Standard React Query mutation result with:
 *   - mutateAsync: Function to approve token spending for the swap intent
 *   - isPending: Boolean indicating if the approval is in progress
 *   - error: Error object if the approval failed
 *   - reset: Function to reset the error state
 *   - Other standard React Query mutation properties
 *
 * @example
 * ```typescript
 * const { mutateAsync: approve, isPending, error } = useSwapApprove(spokeProvider);
 *
 * // Approve tokens for swap action
 * await approve({
 *   params: {
 *     inputToken: '0x...',
 *     outputToken: '0x...',
 *     inputAmount: 1000000000000000000n,
 *     minOutputAmount: 900000000000000000n,
 *     deadline: 0n,
 *     allowPartialFill: false,
 *     srcChain: '0xa4b1.arbitrum',
 *     dstChain: '0x89.polygon',
 *     srcAddress: '0x...',
 *     dstAddress: '0x...',
 *     solver: '0x0000000000000000000000000000000000000000',
 *     data: '0x'
 *   }
 * });
 * ```
 */
export function useSwapApprove(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<boolean, Error, { params: CreateIntentParams }> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ params }) => {
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
    onSuccess: (_, { params }) => {
      // Invalidate allowance query to refetch the new allowance
      queryClient.invalidateQueries({ queryKey: ['allowance', params] });
    },
  });
}
