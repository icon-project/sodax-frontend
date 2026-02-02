import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { BridgeLimit, XToken } from '@sodax/sdk';

/**
 * Hook for getting the amount available to be bridged.
 *
 * This hook is used to check if a target chain has enough balance to bridge when bridging.
 * It automatically queries and tracks the available amount to be bridged.
 *
 * @param {SpokeChainId | undefined} chainId - The chain ID to get the balance for
 * @param {string | undefined} token - The token address to get the balance for
 *
 * @returns {UseQueryResult<BridgeLimit, Error>} A React Query result containing:
 *   - data: Data about available amount to be bridged
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
export function useGetBridgeableAmount(
  from: XToken | undefined,
  to: XToken | undefined,
): UseQueryResult<BridgeLimit, Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['spoke-asset-manager-token-balance', from, to],
    queryFn: async () => {
      if (!from || !to) {
        return { amount: 0n, decimals: 0, type: 'DEPOSIT_LIMIT' } as const;
      }

      const result = await sodax.bridge.getBridgeableAmount(from, to);

      if (result.ok) {
        return result.value;
      }

      console.error('Error getting bridgeable amount:', result.error);
      return { amount: 0n, decimals: 0, type: 'DEPOSIT_LIMIT' } as const;
    },
    enabled: !!from && !!to,
  });
}
