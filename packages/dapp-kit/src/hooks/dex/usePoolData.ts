import { type QueryObserverOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { PoolData, PoolKey } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export interface UsePoolDataProps {
  poolKey: PoolKey | null;
  enabled?: boolean;
  queryOptions?: QueryObserverOptions<PoolData, Error>;
}

/**
 * React hook to query on-chain data for a specific DEX pool.
 *
 * This hook retrieves immutable and dynamic information for a given pool key, including the token info,
 * pool characteristics, price, liquidity, and state from the chain via the Sodax clService.
 *
 * @param {PoolKey | null} poolKey
 *   The key representing the DEX pool to fetch data for. Pass `null` to disable the query.
 * @param {boolean} [enabled]
 *   Optionally enable/disable the query. Defaults to true if a poolKey is provided, otherwise false.
 * @param {QueryObserverOptions<PoolData, Error>} [queryOptions]
 *   Optionally provide advanced react-query options (staleTime, refetchInterval, etc). Entries are merged with defaults.
 *
 * @returns {UseQueryResult<PoolData, Error>}
 *   React Query result object, with `data` as the loaded PoolData (or undefined if loading/errored),
 *   plus status fields (`isLoading`, `isError`, etc).
 *
 * @example
 * ```typescript
 * // Basic usage with default polling and state
 * const { data: poolData, isLoading, error } = usePoolData({ poolKey: selectedPoolKey });
 * if (isLoading) return <div>Loading pool data…</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (poolData) {
 *   // Access poolData fields such as poolId, tokens, price, etc.
 * }
 * ```
 *
 * @remarks
 * - Re-fetches every 30 seconds as long as enabled (adjustable via queryOptions).
 * - If `poolKey` is `null`, query is automatically disabled and no request is sent.
 * - Throws error if `poolKey` is omitted or invalid when enabled.
 * - Useful for all views needing up-to-date pool state (deposit/withdraw/liquidity/analytics UI).
 */
export function usePoolData({
  poolKey,
  queryOptions = {
    queryKey: ['dex', 'poolData', poolKey],
    enabled: poolKey !== null,
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  },
}: UsePoolDataProps): UseQueryResult<PoolData, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (!poolKey) {
        throw new Error('Pool key is required');
      }

      return await sodax.dex.clService.getPoolData(poolKey, sodax.hubProvider.publicClient);
    },
    enabled: poolKey !== null,
  });
}

