// packages/dapp-kit/src/hooks/staking/useUnstake.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { UnstakeParams, SpokeTxHash, HubTxHash, SpokeProvider } from '@sodax/sdk';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

/**
 * Hook for executing unstake transactions to unstake xSODA shares.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the unstake
 * @returns {UseMutationResult<[SpokeTxHash, HubTxHash], Error, Omit<UnstakeParams, 'action'>>} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: unstake, isPending } = useUnstake(spokeProvider);
 *
 * const handleUnstake = async () => {
 *   const result = await unstake({
 *     amount: 1000000000000000000n, // 1 xSODA
 *     account: '0x...'
 *   });
 *
 *   console.log('Unstake successful:', result);
 * };
 * ```
 */
export function useUnstake(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<[SpokeTxHash, HubTxHash], Error, Omit<UnstakeParams, 'action'>> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<[SpokeTxHash, HubTxHash], Error, Omit<UnstakeParams, 'action'>>({
    mutationFn: async (params: Omit<UnstakeParams, 'action'>) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.unstake({ ...params, action: 'unstake' }, spokeProvider);

      if (!result.ok) {
        throw new Error(`Unstake failed: ${result.error.code}`);
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
