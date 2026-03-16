import { type QueryObserverOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { PoolData, PoolKey } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UsePoolDataProps = {
  poolKey: PoolKey | null;
  enabled?: boolean;
  queryOptions?: QueryObserverOptions<PoolData, Error>;
};

/**
 * React hook to fetch on-chain data for a given DEX pool.
 *
 * @param {UsePoolDataProps} props - The props object:
 *   - `poolKey`: PoolKey | null — The unique identifier for the pool to fetch data for. If null, disables the query.
 *   - `enabled`: boolean (optional) — Whether the query is enabled. Defaults to enabled if a poolKey is provided, otherwise false.
 *   - `queryOptions`: QueryObserverOptions<PoolData, Error> (optional) — Additional React Query options (e.g., staleTime, refetchInterval).
 *
 * @returns {UseQueryResult<PoolData, Error>} React Query result containing pool data (`data`), loading state (`isLoading`), error (`error`), and status fields.
 *
 * @example
 * ```typescript
 * const { data: poolData, isLoading, error } = usePoolData({ poolKey });
 * if (isLoading) return <div>Loading…</div>;
 * if (error) return <div>Error!</div>;
 * if (poolData) {
 *   // poolData is available
 * }
 * ```
 *
 * @remarks
 * - Refetches pool data every 30 seconds by default, and may be configured via `queryOptions`.
 * - If `poolKey` is `null`, the query is disabled and no network request is performed.
 * - Throws an error if `poolKey` is missing when the query is enabled.
 */
export function usePoolData({
  poolKey,
  queryOptions = {
    queryKey: ['dex', 'poolData', poolKey],
    enabled: poolKey !== null,
    staleTime: 10000,
    refetchInterval: 30000,
  },
}: UsePoolDataProps): UseQueryResult<PoolData, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    ...queryOptions,
    queryFn: async (): Promise<PoolData> => {
      if (!poolKey) {
        throw new Error('Pool key is required');
      }
      return await sodax.dex.clService.getPoolData(poolKey, sodax.hubProvider.publicClient);
    },
    enabled: poolKey !== null,
  });
}
