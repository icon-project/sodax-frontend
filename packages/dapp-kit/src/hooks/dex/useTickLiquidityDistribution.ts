import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { TickLiquidityDistribution, PoolKey } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseTickLiquidityDistributionProps = {
  poolKey: PoolKey | null;
  tickRange?: number;
};

/**
 * React hook to fetch per-tick liquidity distribution for a CL pool.
 * Used to render liquidity distribution charts.
 *
 * @param props.poolKey - The pool key. Query is disabled when null.
 * @param props.tickRange - Number of ticks on each side of current tick to scan (default 500).
 */
export function useTickLiquidityDistribution({
  poolKey,
  tickRange,
}: UseTickLiquidityDistributionProps): UseQueryResult<TickLiquidityDistribution, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['dex', 'tickLiquidity', poolKey, tickRange],
    enabled: poolKey !== null,
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async (): Promise<TickLiquidityDistribution> => {
      if (!poolKey) {
        throw new Error('Pool key is required');
      }
      return await sodax.dex.clService.getTickLiquidityDistribution(
        poolKey,
        sodax.hubProvider.publicClient,
        tickRange,
      );
    },
  });
}
