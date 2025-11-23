// apps/demo/src/components/dex/hooks/usePoolData.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ClService, PoolData, PoolKey } from '@sodax/sdk';
import { useSodaxContext } from '@sodax/dapp-kit';

/**
 * Hook for loading pool data for a selected pool.
 *
 * This hook fetches comprehensive pool data including token information, current price,
 * liquidity, and other pool state from the blockchain.
 *
 * @param {PoolKey | null} poolKey - The pool key to fetch data for. If null, query is disabled.
 * @param {boolean} enabled - Whether the query should be enabled (default: true)
 * @returns {UseQueryResult<PoolData, Error>} Query result object containing pool data and state
 *
 * @example
 * ```typescript
 * const { data: poolData, isLoading, error } = usePoolData(selectedPoolKey);
 *
 * if (isLoading) return <div>Loading pool data...</div>;
 * if (poolData) {
 *   console.log('Pool ID:', poolData.poolId);
 *   console.log('Current price:', poolData.price.toSignificant(6));
 * }
 * ```
 */
export function usePoolData(
  poolKey: PoolKey | null,
  enabled = true,
): UseQueryResult<PoolData, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['dex', 'poolData', poolKey],
    queryFn: async () => {
      if (!poolKey) {
        throw new Error('Pool key is required');
      }

      const data = await sodax.dex.clService.getPoolData(poolKey, sodax.hubProvider.publicClient);
      return data;
    },
    enabled: enabled && poolKey !== null,
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

