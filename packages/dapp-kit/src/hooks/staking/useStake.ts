// packages/dapp-kit/src/hooks/staking/useStake.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { StakeParams, StakingError, StakingErrorCode, SpokeTxHash, HubTxHash } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider } from '@sodax/sdk';

/**
 * Hook for executing stake transactions to stake SODA tokens and receive xSODA shares.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the stake
 * @returns {UseMutationResult} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: stake, isPending } = useStake(spokeProvider);
 *
 * const handleStake = async () => {
 *   const result = await stake({
 *     amount: 1000000000000000000n, // 1 SODA
 *     account: '0x...'
 *   });
 *
 *   if (result.ok) {
 *     console.log('Stake successful:', result.value);
 *   }
 * };
 * ```
 */
export function useStake(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<[SpokeTxHash, HubTxHash], Error, StakeParams> {
  const { sodax } = useSodaxContext();

  return useMutation<[SpokeTxHash, HubTxHash], Error, StakeParams>({
    mutationFn: async (params: StakeParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.stake(params, spokeProvider);

      if (!result.ok) {
        throw new Error(`Stake failed: ${result.error.code}`);
      }

      return result.value;
    },
  });
}


