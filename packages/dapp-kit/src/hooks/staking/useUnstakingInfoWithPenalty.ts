// packages/dapp-kit/src/hooks/staking/useUnstakingInfoWithPenalty.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { UnstakingInfo, UnstakeRequestWithPenalty, SpokeProvider } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export type UnstakingInfoWithPenalty = UnstakingInfo & {
  requestsWithPenalty: UnstakeRequestWithPenalty[];
};

/**
 * Hook for fetching unstaking information with penalty calculations from the stakedSoda contract.
 * Uses React Query for efficient caching and state management.
 *
 * @param {string | undefined} userAddress - The user address to fetch unstaking info for
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider instance
 * @param {number} refetchInterval - The interval in milliseconds to refetch data (default: 5000)
 * @returns {UseQueryResult<UnstakingInfoWithPenalty, Error>} Query result object containing unstaking info with penalties and state
 *
 * @example
 * ```typescript
 * const { data: unstakingInfo, isLoading, error } = useUnstakingInfoWithPenalty(userAddress, spokeProvider);
 *
 * if (isLoading) return <div>Loading unstaking info...</div>;
 * if (unstakingInfo) {
 *   console.log('Total unstaking:', unstakingInfo.totalUnstaking);
 *   unstakingInfo.requestsWithPenalty.forEach(request => {
 *     console.log('Penalty:', request.penaltyPercentage + '%');
 *     console.log('Claimable amount:', request.claimableAmount);
 *   });
 * }
 * ```
 */
export function useUnstakingInfoWithPenalty(
  userAddress: string | undefined,
  spokeProvider: SpokeProvider | undefined,
  refetchInterval = 5000,
): UseQueryResult<UnstakingInfoWithPenalty, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['soda', 'unstakingInfoWithPenalty', spokeProvider?.chainConfig.chain.id, userAddress],
    queryFn: async () => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      // Get unstaking info with penalty calculations
      const penaltyResult = await sodax.staking.getUnstakingInfoWithPenalty(spokeProvider);

      if (!penaltyResult.ok) {
        throw new Error(`Failed to fetch unstaking info with penalty: ${penaltyResult.error.code}`);
      }

      return penaltyResult.value;
    },
    enabled: !!spokeProvider && !!userAddress,
    refetchInterval,
  });
}
