// packages/dapp-kit/src/hooks/staking/useClaim.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { ClaimParams, StakingError, StakingErrorCode, SpokeTxHash, HubTxHash } from '@sodax/sdk';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { SpokeProvider } from '@sodax/sdk';

/**
 * Hook for executing claim transactions to claim unstaked SODA tokens after the unstaking period.
 * Uses React Query's useMutation for better state management and caching.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the claim
 * @returns {UseMutationResult} Mutation result object containing mutation function and state
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
 *   if (result.ok) {
 *     console.log('Claim successful:', result.value);
 *   }
 * };
 * ```
 */
export function useClaim(
  spokeProvider: SpokeProvider | undefined,
): UseMutationResult<[SpokeTxHash, HubTxHash], Error, ClaimParams> {
  const { sodax } = useSodaxContext();

  return useMutation<[SpokeTxHash, HubTxHash], Error, ClaimParams>({
    mutationFn: async (params: ClaimParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.claim(params, spokeProvider);

      if (!result.ok) {
        throw new Error(`Claim failed: ${result.error.code}`);
      }

      return result.value;
    },
  });
}


