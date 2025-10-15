// packages/dapp-kit/src/hooks/staking/useStakingInfo.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { StakingInfo, SpokeProvider } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for fetching comprehensive staking information for a user.
 * Uses React Query for efficient caching and state management.
 *
 * @param {SpokeProvider | undefined} spokeProvider - The spoke provider to use for the query
 * @param {number} refetchInterval - The interval in milliseconds to refetch data (default: 5000)
 * @returns {UseQueryResult<StakingInfo, Error>} Query result object containing staking info and state
 *
 * @example
 * ```typescript
 * const { data: stakingInfo, isLoading, error } = useStakingInfo(spokeProvider);
 *
 * if (isLoading) return <div>Loading staking info...</div>;
 * if (stakingInfo) {
 *   console.log('Total staked:', stakingInfo.totalStaked);
 *   console.log('User staked:', stakingInfo.userStaked);
 *   console.log('xSODA balance:', stakingInfo.userXSodaBalance);
 * }
 * ```
 */
export function useStakingInfo(
  spokeProvider: SpokeProvider | undefined,
  refetchInterval = 5000,
): UseQueryResult<StakingInfo, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['soda', 'stakingInfo', spokeProvider?.chainConfig.chain.id],
    queryFn: async () => {
      if (!spokeProvider) {
        throw new Error('Spoke provider not found');
      }

      const result = await sodax.staking.getStakingInfoFromSpoke(spokeProvider);

      if (!result.ok) {
        throw new Error(`Failed to fetch staking info: ${result.error.code}`);
      }

      return result.value;
    },
    enabled: !!spokeProvider,
    refetchInterval,
  });
}
