import { type QueryObserverOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { PoolData, PoolKey, SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export interface UsePoolBalancesResponse {
  token0Balance: bigint;
  token1Balance: bigint;
}

export interface UsePoolBalancesProps {
  poolData: PoolData | null;
  poolKey: PoolKey | null;
  spokeProvider: SpokeProvider | null;
  enabled?: boolean;
  queryOptions?: QueryObserverOptions<UsePoolBalancesResponse, Error>;
}

/**
 * React hook to query a user's token balances for a DEX pool.
 *
 * Given the pool data (with token addresses), the pool's key, and a SpokeProvider,
 * fetches the user's protocol balances for both token0 and token1 for the specified pool.
 * Queries are auto-refreshed; advanced options can be customized via `queryOptions`.
 *
 * @param {UsePoolBalancesProps} props
 *   Object containing:
 *   - `poolData`: {PoolData | null} - Pool info (must include token0 and token1 addresses). Required unless disabling.
 *   - `poolKey`: {PoolKey | null} - Unique key for the DEX pool. Required unless disabling.
 *   - `spokeProvider`: {SpokeProvider | null} - Provider instance for the chain. Required unless disabling.
 *   - `enabled`: {boolean} (optional) - Whether to enable the query. Defaults to `true` if all other arguments are provided.
 *   - `queryOptions`: {QueryObserverOptions<UsePoolBalancesResponse, Error>} (optional) - Advanced react-query options.
 *
 * @returns {UseQueryResult<UsePoolBalancesResponse, Error>}
 *   React Query result object:
 *   - `data`: `{ token0Balance: bigint, token1Balance: bigint }` if loaded, undefined otherwise.
 *   - `isLoading`, `isError`, etc. for status handling.
 *
 * @remarks
 * - Throws an error if any of `poolData`, `poolKey`, or `spokeProvider` is missing when enabled.
 * - Suitable for tracking current protocol/wallet balances for both pool tokens.
 * - The hook is designed for use within a React component tree that provides the Sodax context.
 * - Data are automatically refreshed at the provided or default polling interval (default: refetch every 10s).
 *
 * @example
 * ```typescript
 * const { data, isLoading } = usePoolBalances({ poolData, poolKey, spokeProvider });
 * if (data) {
 *   console.log('Balances:', data.token0Balance, data.token1Balance);
 * }
 * ```
 */
export function usePoolBalances({
  poolData,
  poolKey,
  spokeProvider,
  enabled = true,
  queryOptions = {
    queryKey: [
      'dex',
      'poolBalances',
      poolData?.token0.address,
      poolData?.token1.address,
      spokeProvider?.chainConfig.chain.id,
    ],
    enabled: enabled && poolData !== null && poolKey !== null && spokeProvider !== null,
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: 10000, // Refetch every 10 seconds
  },
}: UsePoolBalancesProps): UseQueryResult<UsePoolBalancesResponse, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    ...queryOptions,
    queryFn: async () => {
      if (!poolData || !spokeProvider || !poolKey) {
        throw new Error('Pool data, pool key, and spoke provider are required');
      }

      // Get balances from AssetService
      const [balance0, balance1] = await Promise.all([
        sodax.dex.assetService.getDeposit(poolData.token0.address, spokeProvider),
        sodax.dex.assetService.getDeposit(poolData.token1.address, spokeProvider),
      ]);

      return {
        token0Balance: balance0,
        token1Balance: balance1,
      };
    },
  });
}
