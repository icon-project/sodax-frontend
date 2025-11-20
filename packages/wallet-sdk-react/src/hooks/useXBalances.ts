import { getXChainType } from '@/actions';
import { type UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ChainId, XToken } from '@sodax/types';
import { useXService } from './useXService';

/**
 * Hook to fetch token balances for multiple tokens on a specific chain
 *
 * @param params - Query parameters object
 * @param params.xChainId - Chain identifier (e.g. '0xa86a.avax', '0x1.base', '0x2.bsc', '0x89.polygon', '0x1.optimism')
 * @param params.xTokens - Array of token objects to fetch balances for.
 * @param params.address - Wallet address to fetch balances for. If undefined, returns empty object
 *
 * @returns UseQueryResult containing an object mapping token addresses to their balances as bigints.
 *          The balances are denominated in the token's smallest unit (e.g. wei for ETH).
 *          Returns empty object if wallet is not connected or service is unavailable.
 */
/**
 * @example
 * ```tsx
 * // Example usage in a component
 * function TokenBalances({ tokens }: { tokens: XToken[] }) {
 *   const { address } = useXAccount('EVM');
 *   const { data: balances } = useXBalances({
 *     xChainId: '0xa86a.avax',
 *     xTokens: tokens,
 *     address,
 *   });
 *
 *   return (
 *     <div>
 *       {tokens.map(token => (
 *         <div key={token.address}>
 *           {token.symbol}: {formatUnits(balances?.[token.address] || 0n, token.decimals)}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

export function useXBalances({
  xChainId,
  xTokens,
  address,
}: { xChainId: ChainId; xTokens: readonly XToken[]; address: string | undefined }): UseQueryResult<{
  [key: string]: bigint;
}> {
  const xService = useXService(getXChainType(xChainId));
  return useQuery({
    queryKey: ['xBalances', xChainId, xTokens.map(x => x.symbol), address],
    queryFn: async () => {
      if (!xService) {
        return {};
      }

      const balances = await xService.getBalances(address, xTokens);

      return balances;
    },
    enabled: !!xService,
    placeholderData: keepPreviousData,
    refetchInterval: 5_000,
  });
}
