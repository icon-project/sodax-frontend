import type { PoolData, PoolKey } from '@sodax/sdk';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UsePoolDataProps = {
  poolKey: PoolKey | null;
  queryOptions?: Omit<UseQueryOptions<PoolData, Error>, 'queryKey' | 'queryFn' | 'enabled'>;
};

/**
 * React hook to fetch on-chain pool data (sqrt price, tick, fees, token info, etc.) for a given
 * pool key. Reads via the hub `publicClient`. Disabled when `poolKey` is null.
 */
export function usePoolData({ poolKey, queryOptions }: UsePoolDataProps): UseQueryResult<PoolData, Error> {
  const { sodax } = useSodaxContext();

  return useQuery<PoolData, Error>({
    queryKey: ['dex', 'poolData', poolKey],
    queryFn: async () => {
      if (!poolKey) {
        throw new Error('Pool key is required');
      }
      return sodax.dex.clService.getPoolData(poolKey, sodax.hubProvider.publicClient);
    },
    enabled: poolKey !== null,
    staleTime: 10_000,
    refetchInterval: 30_000,
    ...queryOptions,
  });
}
