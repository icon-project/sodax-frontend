import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { ChainId, IXServiceBase, XToken } from '@sodax/types';

/**
 * Params for {@link useXBalances}.
 */
export interface UseXBalancesParams {
  xService: IXServiceBase | undefined;
  xChainId: ChainId;
  xTokens: readonly XToken[];
  address: string | undefined;
}

/**
 * Fetch token balances for multiple tokens on a specific chain. Returns an
 * object mapping each token's address to its balance in smallest unit.
 *
 * @example
 * ```tsx
 * const xService = useXService(getXChainType(xChainId));
 * const { data: balances } = useXBalances({ xService, xChainId, xTokens, address });
 * ```
 */
export function useXBalances({
  xService,
  xChainId,
  xTokens,
  address,
}: UseXBalancesParams): UseQueryResult<Record<string, bigint>> {
  return useQuery({
    // Pair symbol + address: readable in devtools, unique on-chain (symbol alone
    // can collide — e.g. scam tokens copying legitimate ticker).
    queryKey: ['xBalances', xChainId, xTokens.map(x => [x.symbol, x.address] as const), address],
    queryFn: async () => {
      // Defensive fallback for tests or manual refetch paths that bypass `enabled`.
      // The `enabled` gate below already skips this queryFn when xService is undefined.
      if (!xService) return {};
      return xService.getBalances(address, xTokens);
    },
    enabled: !!xService && !!address && xTokens.length > 0,
    refetchInterval: 5_000,
  });
}
