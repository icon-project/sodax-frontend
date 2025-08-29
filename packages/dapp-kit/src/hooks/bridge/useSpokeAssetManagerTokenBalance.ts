import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { SpokeChainId } from '@sodax/sdk';

/**
 * Hook for getting the balance of tokens held by the asset manager on a spoke chain.
 *
 * This hook is used to check if a target chain has enough balance to bridge when bridging.
 * It automatically queries and tracks the asset manager's token balance.
 *
 * @param {SpokeChainId | undefined} chainId - The chain ID to get the balance for
 * @param {string | undefined} token - The token address to get the balance for
 *
 * @returns {UseQueryResult<bigint, Error>} A React Query result containing:
 *   - data: The token balance held by the asset manager (bigint)
 *   - error: Any error that occurred during the check
 *
 * @example
 * ```typescript
 * const { data: balance, isLoading } = useSpokeAssetManagerTokenBalance(chainId, tokenAddress);
 *
 * if (balance) {
 *   console.log('Asset manager token balance:', balance.toString());
 * }
 * ```
 */
export function useSpokeAssetManagerTokenBalance(
  chainId: SpokeChainId | undefined,
  token: string | undefined,
): UseQueryResult<bigint, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['spoke-asset-manager-token-balance', chainId, token],
    queryFn: async () => {
      if (!chainId || !token) {
        return 0n;
      }

      return await sodax.bridge.getSpokeAssetManagerTokenBalance(chainId, token);
    },
    enabled: !!chainId && !!token,
  });
}
