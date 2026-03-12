import { type QueryObserverOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { PoolKey } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UsePoolsProps = {
  /**
   * Optional react-query QueryObserverOptions for customizing query behavior such as
   * staleTime, refetchInterval, cacheTime, etc. These are merged with sensible defaults.
   */
  queryOptions?: QueryObserverOptions<PoolKey[], Error>;
};

/**
 * Loads and caches the available list of pools from the DEX service's ConcentratedLiquidityService.
 *
 * By default, the query result is cached indefinitely (with `staleTime` set to Infinity), reflecting the
 * assumption that the pools list is mostly static.
 *
 * @param params
 *   Optional configuration object:
 *   - queryOptions: Partial QueryObserverOptions for react-query (merged with built-in defaults).
 *
 * @returns
 *   A UseQueryResult object from @tanstack/react-query containing:
 *   - `data`: Array of PoolKey objects or undefined if not loaded or errored.
 *   - Status fields: `isLoading`, `isError`, `error`, etc.
 *
 * @example
 *   const { data: pools, isLoading, error } = usePools();
 *   if (isLoading) return <div>Loading pools...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (pools) pools.forEach((pool, idx) => console.log(pool.id, pool.fee));
 */
export function usePools(params?: UsePoolsProps): UseQueryResult<PoolKey[], Error> {
  const { sodax } = useSodaxContext();
  const defaultQueryOptions = {
    queryKey: ['dex', 'pools'],
    staleTime: Number.POSITIVE_INFINITY, // Pools list is static, cache indefinitely
  };
  const queryOptions = { ...defaultQueryOptions, ...params?.queryOptions };

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<PoolKey[]> => {
      return sodax.dex.clService.getPools();
    },
  });
}
