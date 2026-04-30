import type { StakingConfig } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseStakingConfigProps = {
  queryOptions?: Omit<UseQueryOptions<StakingConfig, Error>, 'queryKey' | 'queryFn'>;
};

/**
 * React hook to fetch the global staking config (unstaking period, min unstaking period, max
 * penalty). Hub-only read; no chain context required. Throws on `!ok`.
 */
export function useStakingConfig({ queryOptions }: UseStakingConfigProps = {}): UseQueryResult<StakingConfig, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<StakingConfig, Error>({
    queryKey: ['staking', 'config'],
    queryFn: async () => {
      const result = await sodax.staking.getStakingConfig();
      if (!result.ok) throw result.error;
      return result.value;
    },
    staleTime: Number.POSITIVE_INFINITY,
    ...queryOptions,
  });
}
