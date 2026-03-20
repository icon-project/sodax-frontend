import { type QueryObserverOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ClPositionInfo, PoolKey } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export interface UsePositionInfoResponse {
  positionInfo: ClPositionInfo;
  isValid: boolean;
}

export interface UsePositionInfoProps {
  tokenId: string | null;
  poolKey: PoolKey | null;
  queryOptions?: QueryObserverOptions<UsePositionInfoResponse, Error>;
}

/**
 * React hook to fetch and validate CL position details by position NFT token ID.
 *
 * Fetches position data on-chain for a given tokenId, and checks if it matches the expected PoolKey.
 * This is commonly used in DEX dashboards to show or pre-validate user positions by ID.
 *
 * @param {string | null} tokenId
 *   Position NFT token ID to query, as a string. Pass `null` or empty string to disable.
 * @param {PoolKey | null} poolKey
 *   PoolKey to match against the position's underlying pool. Pass `null` to disable.
 * @param {QueryObserverOptions<UsePositionInfoResponse, Error>} [queryOptions]
 *   Optional react-query options for polling/refresh and config. Merged with sensible defaults.
 *
 * @returns {UseQueryResult<UsePositionInfoResponse, Error>}
 *   Standard React Query result object:
 *   - `data`: { positionInfo, isValid } if loaded, or undefined if not loaded/error
 *   - `isLoading`: boolean (query active)
 *   - `isError`: boolean (query failed)
 *   - ...other react-query helpers (refetch, status, etc)
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = usePositionInfo({ tokenId, poolKey });
 * if (isLoading) return <div>Loading position...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (data) {
 *   console.log('Valid for pool:', data.isValid);
 *   console.log('Liquidity:', data.positionInfo.liquidity);
 * }
 * ```
 *
 * @remarks
 * - Validates the underlying position's pool definition (currency0, currency1, fee) with the supplied PoolKey.
 * - Returns `isValid: false` if any field mismatches.
 * - Pass `null` as tokenId or poolKey to disable the query.
 * - Defaults: 10s stale, not enabled if missing arguments. Customizable via `queryOptions`.
 * - Throws error if called with invalid/null tokenId or poolKey when enabled.
 */
export function usePositionInfo({
  tokenId,
  poolKey,
  queryOptions = {
    queryKey: ['dex', 'positionInfo', tokenId, poolKey],
    enabled: tokenId !== null && poolKey !== null && tokenId !== '',
    staleTime: 10000, // Consider data stale after 10 seconds
  },
}: UsePositionInfoProps): UseQueryResult<UsePositionInfoResponse, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryFn: async () => {
      if (!tokenId || !poolKey) {
        throw new Error('Token ID and pool key are required');
      }

      const tokenIdBigInt = BigInt(tokenId);
      const publicClient = sodax.hubProvider.publicClient;
      const info = await sodax.dex.clService.getPositionInfo(tokenIdBigInt, publicClient);

      // Validate that position belongs to current pool
      const isValid =
        info.poolKey.currency0.toLowerCase() === poolKey.currency0.toLowerCase() &&
        info.poolKey.currency1.toLowerCase() === poolKey.currency1.toLowerCase() &&
        info.poolKey.fee === poolKey.fee;

      return {
        positionInfo: info,
        isValid,
      };
    },
    ...queryOptions,
  });
}
