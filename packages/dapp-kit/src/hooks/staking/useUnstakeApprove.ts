// packages/dapp-kit/src/hooks/staking/useStakeApprove.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { TxReturnType, UnstakeParams } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider } from '@sodax/sdk';

/**
 * Hook for approving xSODA token spending for unstaking operations.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the approval
 * @returns {UseMutationResult<TxReturnType<SpokeProvider, false>, Error, Omit<UnstakeParams, 'action'>>} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: approve, isPending } = useUnstakeApprove(spokeProvider);
 *
 * const handleApprove = async () => {
 *   const result = await approve({
 *     amount: 1000000000000000000n, // 1 xSODA
 *     account: '0x...'
 *   });
 *
 *   console.log('Approval successful:', result);
 * };
 * ```
 */
export function useUnstakeApprove(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<TxReturnType<SpokeProvider, false>, Error, Omit<UnstakeParams, 'action'>> {
  const { sodax } = useSodaxContext();

  return useMutation<TxReturnType<SpokeProvider, false>, Error, Omit<UnstakeParams, 'action'>>({
    mutationFn: async (params: Omit<UnstakeParams, 'action'>) => {
      console.log('useUnstakeApprove called with params:', params);
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.approve({
        params: { ...params, action: 'unstake' },
        spokeProvider,
      });

      if (!result.ok) {
        throw new Error(`Unstake approval failed: ${result.error.code}`);
      }

      return result.value;
    },
  });
}
