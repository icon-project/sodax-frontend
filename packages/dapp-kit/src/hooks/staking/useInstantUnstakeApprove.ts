// packages/dapp-kit/src/hooks/staking/useStakeApprove.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { InstantUnstakeParams, TxReturnType, SpokeProvider } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

/**
 * Hook for approving xSODA token spending for instant unstaking operations.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the approval
 * @returns {UseMutationResult<TxReturnType<SpokeProvider, false>, Error, Omit<InstantUnstakeParams, 'action'>>} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: approve, isPending } = useInstantUnstakeApprove(spokeProvider);
 *
 * const handleApprove = async () => {
 *   const result = await approve({
 *     amount: 1000000000000000000n, // 1 xSODA
 *     minAmount: 950000000000000000n, // 0.95 SODA
 *     account: '0x...'
 *   });
 *
 *   console.log('Approval successful:', result);
 * };
 * ```
 */
export function useInstantUnstakeApprove(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<TxReturnType<SpokeProvider, false>, Error, Omit<InstantUnstakeParams, 'action'>> {
  const { sodax } = useSodaxContext();

  return useMutation<TxReturnType<SpokeProvider, false>, Error, Omit<InstantUnstakeParams, 'action'>>({
    mutationFn: async (params: Omit<InstantUnstakeParams, 'action'>) => {
      console.log('useInstantUnstakeApprove called with params:', params);
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.approve({
        params: { ...params, action: 'instantUnstake' },
        spokeProvider,
      });

      if (!result.ok) {
        throw new Error(`Instant unstake approval failed: ${result.error.code}`);
      }

      return result.value;
    },
  });
}
