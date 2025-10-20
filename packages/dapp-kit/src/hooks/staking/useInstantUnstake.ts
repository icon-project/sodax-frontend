// packages/dapp-kit/src/hooks/staking/useInstantUnstake.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider, InstantUnstakeParams } from '@sodax/sdk';

/**
 * Hook for executing instant unstake operations.
 * Uses React Query for efficient state management and error handling.
 *
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider for the transaction
 * @returns {UseMutationResult<[string, string], Error, Omit<InstantUnstakeParams, 'action'>>} Mutation result object containing instant unstake state and methods
 *
 * @example
 * ```typescript
 * const { mutateAsync: instantUnstake, isPending } = useInstantUnstake(spokeProvider);
 *
 * const handleInstantUnstake = async () => {
 *   const result = await instantUnstake({
 *     amount: 1000000000000000000n,
 *     minAmount: 950000000000000000n,
 *     account: '0x...'
 *   });
 *   console.log('Instant unstake successful:', result);
 * };
 * ```
 */
export function useInstantUnstake(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<[string, string], Error, Omit<InstantUnstakeParams, 'action'>> {
  const { sodax } = useSodaxContext();

  return useMutation({
    mutationFn: async (params: Omit<InstantUnstakeParams, 'action'>) => {
      if (!spokeProvider) {
        throw new Error('spokeProvider is not found');
      }

      const result = await sodax.staking.instantUnstake({ ...params, action: 'instantUnstake' }, spokeProvider);

      if (!result.ok) {
        throw new Error(`Instant unstake failed: ${result.error.code}`);
      }

      return result.value;
    },
    onError: error => {
      console.error('Instant unstake error:', error);
    },
  });
}
