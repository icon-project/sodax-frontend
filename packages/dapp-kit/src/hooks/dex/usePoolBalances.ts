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
 * React hook for querying the user's pool deposit token balances.
 *
 * This hook returns the user's on-protocol balances for both tokens
 * in a specific DEX pool, refreshing as needed. It queries the Sodax AssetService.
 *
 * @param {PoolData | null} poolData
 *   The pool data object, including token0 and token1 addresses. Pass `null` to disable the query.
 * @param {PoolKey | null} poolKey
 *   The key (ID) for the pool. Pass `null` to disable the query.
 * @param {SpokeProvider | null} spokeProvider
 *   Chain provider to query balances on. Pass `null` to disable the query.
 * @param {boolean} [enabled=true]
 *   Whether the balance query should be enabled. Defaults to true if all inputs are defined.
 * @param {QueryObserverOptions<UsePoolBalancesResponse, Error>} [queryOptions]
 *   Optional react-query options (e.g. custom interval, staleTime).
 *
 * @returns {UseQueryResult<UsePoolBalancesResponse, Error>}
 *   Standard React Query result object containing:
 *   - `data`: `{ token0Balance: bigint, token1Balance: bigint }` or undefined if not loaded
 *   - `isLoading`: Loading state
 *   - `isError`: Error state
 *   - ...other query result helpers
 *
 * @example
 * ```typescript
 * // Using all arguments as props:
 * const { data: balances, isLoading, error } = usePoolBalances({
 *   poolData, poolKey, spokeProvider
 * });
 * if (isLoading) return <div>Loading balances…</div>;
 * if (balances) {
 *   console.log('T0:', balances.token0Balance, 'T1:', balances.token1Balance);
 * }
 * ```
 *
 * @remarks
 * - Balances are for the user's deposits in the pool on this chain.
 * - Automatically refreshes every 10 seconds by default.
 * - Returns an error if any required argument is missing.
 * - Use in combination with pool selection and wallet connection UI.
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
