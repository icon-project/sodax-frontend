import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ClPositionInfo, PoolKey } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

interface PositionInfoWithValidation {
  positionInfo: ClPositionInfo;
  isValid: boolean;
}

/**
 * Hook for fetching and validating position information.
 *
 * This hook fetches position details by token ID and validates that the position
 * belongs to the specified pool. It also pre-fills price range information if valid.
 *
 * @param {string | null} tokenId - The position token ID (NFT token ID)
 * @param {PoolKey | null} poolKey - The pool key to validate against
 * @param {boolean} enabled - Whether the query should be enabled (default: true)
 * @returns {UseQueryResult<PositionInfoWithValidation, Error>} Query result object containing position info and validation state
 *
 * @example
 * ```typescript
 * const { data: position, isLoading, error } = usePositionInfo(tokenId, poolKey);
 *
 * if (isLoading) return <div>Loading position...</div>;
 * if (position) {
 *   console.log('Position valid:', position.isValid);
 *   console.log('Liquidity:', position.positionInfo.liquidity);
 * }
 * ```
 */
export function usePositionInfo(
  tokenId: string | null,
  poolKey: PoolKey | null,
  enabled = true,
): UseQueryResult<PositionInfoWithValidation, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['dex', 'positionInfo', tokenId, poolKey],
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
    enabled: enabled && tokenId !== null && poolKey !== null && tokenId !== '',
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

