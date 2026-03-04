// packages/dapp-kit/src/hooks/staking/useCancelUnstake.ts
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { CancelUnstakeParams, SpokeProvider, SpokeTxHash, HubTxHash } from '@sodax/sdk';

/**
 * Hook for executing cancel unstake transactions to cancel pending unstake requests.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the cancel unstake
 * @returns {UseMutationResult<[SpokeTxHash, HubTxHash], Error, Omit<CancelUnstakeParams, 'action'>>} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: cancelUnstake, isPending } = useCancelUnstake(spokeProvider);
 *
 * const handleCancelUnstake = async () => {
 *   const result = await cancelUnstake({
 *     requestId: 1n
 *   });
 *
 *   console.log('Cancel unstake successful:', result);
 * };
 * ```
 */
export function useCancelUnstake(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<[SpokeTxHash, HubTxHash], Error, Omit<CancelUnstakeParams, 'action'>> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Omit<CancelUnstakeParams, 'action'>) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not available');
      }

      const result = await sodax.staking.cancelUnstake({ ...params, action: 'cancelUnstake' }, spokeProvider);
      if (!result.ok) {
        throw new Error(`Cancel unstake failed: ${result.error.code}`);
      }

      return result.value;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['stakingInfo'] });
      queryClient.invalidateQueries({ queryKey: ['unstakingInfo'] });
      queryClient.invalidateQueries({ queryKey: ['unstakingInfoWithPenalty'] });
    },
  });
}
