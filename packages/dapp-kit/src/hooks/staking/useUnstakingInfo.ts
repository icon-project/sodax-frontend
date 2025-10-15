// packages/dapp-kit/src/hooks/staking/useUnstakingInfoWithPenalty.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { UnstakingInfo, SpokeProvider } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for fetching unstaking information from the stakedSoda contract.
 * Uses React Query for efficient caching and state management.
 *
 * @param {string | undefined} userAddress - The user address to fetch unstaking info for
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider instance
 * @param {number} refetchInterval - The interval in milliseconds to refetch data (default: 5000)
 * @returns {UseQueryResult<UnstakingInfo, Error>} Query result object containing unstaking info and state
 *
 * @example
 * ```typescript
 * const { data: unstakingInfo, isLoading, error } = useUnstakingInfo(userAddress, spokeProvider);
 *
 * if (isLoading) return <div>Loading unstaking info...</div>;
 * if (unstakingInfo) {
 *   console.log('Total unstaking:', unstakingInfo.totalUnstaking);
 *   unstakingInfo.userUnstakeSodaRequests.forEach(request => {
 *     console.log('Request amount:', request.request.amount);
 *   });
 * }
 * ```
 */
export function useUnstakingInfo(
  userAddress: string | undefined,
  spokeProvider: SpokeProvider | undefined,
  refetchInterval = 5000,
): UseQueryResult<UnstakingInfo, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['soda', 'unstakingInfoWithPenalty', spokeProvider?.chainConfig.chain.id, userAddress],
    queryFn: async () => {
      if (!spokeProvider || !userAddress) {
        throw new Error('Spoke provider or user address not found');
      }

      const result = await sodax.staking.getUnstakingInfo(spokeProvider);

      if (!result.ok) {
        throw new Error(`Failed to fetch unstaking info: ${result.error.code}`);
      }

      return result.value;
    },
    enabled: !!spokeProvider && !!userAddress,
    refetchInterval,
  });
}
