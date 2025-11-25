import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { PoolData, PoolKey, SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

interface PoolBalances {
  token0Balance: bigint;
  token1Balance: bigint;
}

/**
 * Hook for loading token balances for pool tokens.
 *
 * This hook fetches the user's token balances for both tokens in a pool.
 * It uses the AssetService to get deposit balances for each token.
 *
 * @param {PoolData | null} poolData - The pool data containing token addresses
 * @param {PoolKey | null} poolKey - The pool key to get assets for
 * @param {SpokeProvider | null} spokeProvider - The spoke provider for the chain
 * @param {boolean} enabled - Whether the query should be enabled (default: true)
 * @returns {UseQueryResult<PoolBalances, Error>} Query result object containing balances and state
 *
 * @example
 * ```typescript
 * const { data: balances, isLoading, error } = usePoolBalances(poolData, poolKey, spokeProvider);
 *
 * if (isLoading) return <div>Loading balances...</div>;
 * if (balances) {
 *   console.log('Token0 balance:', balances.token0Balance);
 *   console.log('Token1 balance:', balances.token1Balance);
 * }
 * ```
 */
export function usePoolBalances(
  poolData: PoolData | null,
  poolKey: PoolKey | null,
  spokeProvider: SpokeProvider | null,
  enabled = true,
): UseQueryResult<PoolBalances, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['dex', 'poolBalances', poolData?.token0.address, poolData?.token1.address, spokeProvider?.chainConfig.chain.id],
    queryFn: async () => {
      if (!poolData || !spokeProvider || !poolKey) {
        throw new Error('Pool data, pool key, and spoke provider are required');
      }

      // Get the assets for this pool
      const assets = sodax.dex.clService.getAssetsForPool(spokeProvider, poolKey);
      if (!assets) {
        throw new Error('Failed to get assets for pool');
      }

      // Get balances from AssetService
      const balance0 = await sodax.dex.assetService.getDeposit(poolData.token0.address, spokeProvider);
      const balance1 = await sodax.dex.assetService.getDeposit(poolData.token1.address, spokeProvider);

      return {
        token0Balance: balance0,
        token1Balance: balance1,
      };
    },
    enabled: enabled && poolData !== null && poolKey !== null && spokeProvider !== null,
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

