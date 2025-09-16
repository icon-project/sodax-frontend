// packages/dapp-kit/src/hooks/staking/useUnstake.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { UnstakeParams, StakingError, StakingErrorCode, SpokeTxHash, HubTxHash } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider } from '@sodax/sdk';

/**
 * Hook for executing unstake transactions to unstake xSODA shares.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the unstake
 * @returns {UseMutationResult} Mutation result object containing mutation function and state
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
 *   if (result.ok) {
 *     console.log('Unstake successful:', result.value);
 *   }
 * };
 * ```
 */
export function useUnstake(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<[SpokeTxHash, HubTxHash], Error, UnstakeParams> {
  const { sodax } = useSodaxContext();

  return useMutation<[SpokeTxHash, HubTxHash], Error, UnstakeParams>({
    mutationFn: async (params: UnstakeParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.unstake(params, spokeProvider);

      if (!result.ok) {
        throw new Error(`Unstake failed: ${result.error.code}`);
      }

      return result.value;
    },
  });
}


