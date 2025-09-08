import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { XToken, SpokeChainId } from '@sodax/sdk';
import { useSodaxContext } from '../shared';

/**
/**
 * Hook for retrieving all bridgeable tokens from a source token on one chain to a destination chain.
 *
 * This hook queries and tracks the set of tokens on the destination chain that can be bridged to,
 * given a source chain, destination chain, and source token address.
 *
 * @param {SpokeChainId | undefined} from - The source chain ID
 * @param {SpokeChainId | undefined} to - The destination chain ID
 * @param {string | undefined} token - The source token address
 *
 * @returns {UseQueryResult<XToken[], Error>} A React Query result containing:
 *   - data: Array of bridgeable tokens (XToken[]) on the destination chain
 *   - error: Any error that occurred during the query
 *
 *
 * @example
 * ```typescript
 * const { data: bridgeableTokens, isLoading } = useGetBridgeableTokens(
 *   fromChainId,
 *   toChainId,
 *   fromTokenAddress
 * );
 *
 * if (bridgeableTokens && bridgeableTokens.length > 0) {
 *   bridgeableTokens.forEach(token => {
 *     console.log(`Bridgeable token: ${token.symbol} (${token.address}) on chain ${token.xChainId}`);
 *   });
 * } else {
 *   console.log('No bridgeable tokens found for the selected route.');
 * }
 * ```
 */
export function useGetBridgeableTokens(
  from: SpokeChainId | undefined,
  to: SpokeChainId | undefined,
  token: string | undefined,
): UseQueryResult<XToken[], Error> {
  const { sodax } = useSodaxContext();

  return useQuery({
    queryKey: ['bridgeable-tokens', from, to, token],
    queryFn: async () => {
      if (!from || !to || !token) {
        return [];
      }

      const result = sodax.bridge.getBridgeableTokens(from, to, token);
      if (result.ok) {
        return result.value;
      }

      console.error('Error getting bridgeable tokens:', result.error);
      return [];
    },
    enabled: !!from && !!to && !!token,
  });
}
