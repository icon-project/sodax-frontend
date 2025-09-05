// packages/dapp-kit/src/hooks/staking/useUnstakingInfo.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { UnstakingInfo, StakingError, StakingErrorCode } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SpokeProvider } from '@sodax/sdk';

/**
 * Hook for fetching unstaking information for a user.
 * Uses React Query for efficient caching and state management.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for the query
 * @param {number} refetchInterval - The interval in milliseconds to refetch data (default: 5000)
 * @returns {UseQueryResult} Query result object containing unstaking info and state
 *
 * @example
 * ```typescript
 * const { data: unstakingInfo, isLoading, error } = useUnstakingInfo(spokeProvider);
 *
 * if (isLoading) return <div>Loading unstaking info...</div>;
 * if (unstakingInfo) {
 *   console.log('Total unstaking:', unstakingInfo.totalUnstaking);
 *   console.log('Unstake requests:', unstakingInfo.userUnstakeSodaRequests);
 * }
 * ```
 */
export function useUnstakingInfo(
  spokeProvider: SpokeProvider | undefined,
  refetchInterval = 5000,
): UseQueryResult<UnstakingInfo, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['unstakingInfo', spokeProvider?.chainConfig.chain.id],
    queryFn: async () => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.getUnstakingInfoFromSpoke(spokeProvider);

      if (!result.ok) {
        throw new Error(`Failed to fetch unstaking info: ${result.error.code}`);
      }

      return result.value;
    },
    enabled: !!spokeProvider,
    refetchInterval,
  });
}


