// packages/dapp-kit/src/hooks/staking/useStakeApprove.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { StakeParams, StakingError, StakingErrorCode, TxReturnType } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider } from '@sodax/sdk';

/**
 * Hook for approving SODA token spending for staking operations.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the approval
 * @returns {UseMutationResult} Mutation result object containing mutation function and state
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
 *   if (result.ok) {
 *     console.log('Approval successful:', result.value);
 *   }
 * };
 * ```
 */
export function useStakeApprove(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<TxReturnType<SpokeProvider, false>, Error, StakeParams> {
  const { sodax } = useSodaxContext();

  return useMutation<TxReturnType<SpokeProvider, false>, Error, StakeParams>({
    mutationFn: async (params: StakeParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.approve({
        params,
        spokeProvider,
      });

      if (!result.ok) {
        throw new Error(`Stake approval failed: ${result.error.code}`);
      }

      return result.value;
    },
  });
}


