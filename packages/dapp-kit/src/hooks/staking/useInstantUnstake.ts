// packages/dapp-kit/src/hooks/staking/useInstantUnstake.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { StakingError, SpokeProvider, Address } from '@sodax/sdk';

export interface InstantUnstakeParams {
  amount: bigint;
  minAmount: bigint;
  account: Address;
}

/**
 * Hook for executing instant unstake operations.
 * Uses React Query for efficient state management and error handling.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider for the transaction
 * @returns {UseMutationResult} Mutation result object containing instant unstake state and methods
 *
 * @example
 * ```typescript
 * const instantUnstake = useInstantUnstake(spokeProvider);
 *
 * const handleInstantUnstake = () => {
 *   instantUnstake.mutate({
 *     amount: 1000000000000000000n,
 *     minAmount: 950000000000000000n,
 *     account: '0x...'
 *   });
 * };
 * ```
 */
export function useInstantUnstake(
  spokeProvider: SpokeProvider,
): UseMutationResult<[string, string], Error, InstantUnstakeParams> {
  const { sodax } = useSodaxContext();

  return useMutation({
    mutationFn: async (params: InstantUnstakeParams) => {
      if (!sodax?.staking) {
        throw new Error('Staking service not available');
      }

      const result = await sodax.staking.instantUnstake(params, spokeProvider);

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
