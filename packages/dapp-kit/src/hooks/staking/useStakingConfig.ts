// packages/dapp-kit/src/hooks/staking/useStakingConfig.ts
import { useSodaxContext } from '../shared/useSodaxContext';
import type { StakingConfig } from '@sodax/sdk';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

/**
 * Hook for fetching staking configuration from the stakedSoda contract.
 * Uses React Query for efficient caching and state management.
 *
 * @param {number} refetchInterval - The interval in milliseconds to refetch data (default: 30000)
 * @returns {UseQueryResult<StakingConfig, Error>} Query result object containing staking config and state
 *
 * @example
 * ```typescript
 * const { data: stakingConfig, isLoading, error } = useStakingConfig();
 *
 * if (isLoading) return <div>Loading staking config...</div>;
 * if (stakingConfig) {
 *   console.log('Unstaking period (days):', stakingConfig.unstakingPeriod / 86400n);
 *   console.log('Max penalty (%):', stakingConfig.maxPenalty);
 * }
 * ```
 */
export function useStakingConfig(refetchInterval = 30000): UseQueryResult<StakingConfig, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['soda', 'stakingConfig'],
    queryFn: async () => {
      const result = await sodax.staking.getStakingConfig();

      if (!result.ok) {
        throw new Error(`Failed to fetch staking config: ${result.error.code}`);
      }

      return result.value;
    },
    refetchInterval,
  });
}
