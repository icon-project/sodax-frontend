// apps/demo/src/components/dex/hooks/usePools.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ClService, PoolKey } from '@sodax/sdk';
import { useSodaxContext } from '@sodax/dapp-kit';

/**
 * Hook for loading available pools list from the DEX service.
 *
 * This hook fetches the list of available pools from the ConcentratedLiquidityService.
 * The pools list is static and doesn't require network calls, so it's cached indefinitely.
 *
 * @returns {UseQueryResult<PoolKey[], Error>} Query result object containing pools array and state
 *
 * @example
 * ```typescript
 * const { data: pools, isLoading, error } = usePools();
 *
 * if (isLoading) return <div>Loading pools...</div>;
 * if (pools) {
 *   pools.forEach((pool, index) => {
 *     console.log(`Pool ${index}: Fee ${pool.fee / 10000}%`);
 *   });
 * }
 * ```
 */
export function usePools(): UseQueryResult<PoolKey[], Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['dex', 'pools'],
    queryFn: () => {
      return sodax.dex.clService.getPools();
    },
    staleTime: Number.POSITIVE_INFINITY, // Pools list is static
  });
}

