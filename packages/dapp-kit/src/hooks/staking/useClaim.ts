// packages/dapp-kit/src/hooks/staking/useClaim.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { ClaimParams, SpokeTxHash, HubTxHash, SpokeProvider } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

/**
 * Hook for executing claim transactions to claim unstaked SODA tokens after the unstaking period.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the claim
 * @returns {UseMutationResult<[SpokeTxHash, HubTxHash], Error, Omit<ClaimParams, 'action'>>} Mutation result object containing mutation function and state
 *
 * @example
 * ```typescript
 * const { mutateAsync: claim, isPending } = useClaim(spokeProvider);
 *
 * const handleClaim = async () => {
 *   const result = await claim({
 *     requestId: 1n
 *   });
 *
 *   console.log('Claim successful:', result);
 * };
 * ```
 */
export function useClaim(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<[SpokeTxHash, HubTxHash], Error, Omit<ClaimParams, 'action'>> {
  const { sodax } = useSodaxContext();

  return useMutation<[SpokeTxHash, HubTxHash], Error, Omit<ClaimParams, 'action'>>({
    mutationFn: async (params: Omit<ClaimParams, 'action'>) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.claim({ ...params, action: 'claim' }, spokeProvider);

      if (!result.ok) {
        throw new Error(`Claim failed: ${result.error.code}`);
      }

      return result.value;
    },
  });
}
