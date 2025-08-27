import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { SpokeProvider } from '@sodax/sdk';

/**
 * Hook for getting the balance of tokens held by the asset manager on a spoke chain.
 *
 * This hook is used to check if a target chain has enough balance to bridge when bridging.
 * It automatically queries and tracks the asset manager's token balance.
 *
 * @param {string} token - The token address to get the balance for
 * @param {SpokeProvider} spokeProvider - The spoke provider to use for balance checks
 *
 * @returns {UseQueryResult<bigint, Error>} A React Query result containing:
 *   - data: The token balance held by the asset manager (bigint)
 *   - error: Any error that occurred during the check
 *
 * @example
 * ```typescript
 * const { data: balance, isLoading } = useSpokeAssetManagerTokenBalance(tokenAddress, spokeProvider);
 *
 * if (balance) {
 *   console.log('Asset manager token balance:', balance.toString());
 * }
 * ```
 */
export function useSpokeAssetManagerTokenBalance(
  token: string | undefined,
  spokeProvider: SpokeProvider | undefined,
): UseQueryResult<bigint, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['spoke-asset-manager-token-balance', token, spokeProvider?.chainConfig.chain.id],
    queryFn: async () => {
      if (!spokeProvider || !token) {
        return 0n;
      }

      return await sodax.bridge.getSpokeAssetManagerTokenBalance(spokeProvider, token);
    },
    enabled: !!spokeProvider && !!token,
  });
}
