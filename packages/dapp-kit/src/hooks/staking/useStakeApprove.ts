// packages/dapp-kit/src/hooks/staking/useStakeApprove.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { StakeParams, TxReturnType, SpokeProvider } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

/**
 * Hook for approving SODA token spending for staking operations.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the approval
 * @returns {UseMutationResult<TxReturnType<SpokeProvider, false>, Error, Omit<StakeParams, 'action'>>} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: approve, isPending } = useStakeApprove(spokeProvider);
 *
 * const handleApprove = async () => {
 *   const result = await approve({
 *     amount: 1000000000000000000n, // 1 SODA
 *     account: '0x...'
 *   });
 *
 *   console.log('Approval successful:', result);
 * };
 * ```
 */
export function useStakeApprove(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<TxReturnType<SpokeProvider, false>, Error, Omit<StakeParams, 'action'>> {
  const { sodax } = useSodaxContext();

  return useMutation<TxReturnType<SpokeProvider, false>, Error, Omit<StakeParams, 'action'>>({
    mutationFn: async (params: Omit<StakeParams, 'action'>) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.approve({
        params: { ...params, action: 'stake' },
        spokeProvider,
      });

      if (!result.ok) {
        throw new Error(`Stake approval failed: ${result.error.code}`);
      }

      return result.value;
    },
  });
}
