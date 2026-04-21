import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { ChainId, IXService, XToken } from '@sodax/types';

/**
 * Params for {@link useXBalances}.
 */
export interface UseXBalancesParams {
  xService: IXService | undefined;
  xChainId: ChainId;
  xTokens: readonly XToken[];
  address: string | undefined;
}

/**
 * Hook to fetch token balances for multiple tokens on a specific chain.
 *
 * The caller injects an `xService` that implements {@link IXService}. This keeps
 * dapp-kit decoupled from any concrete wallet provider implementation — apps
 * typically wire in the `XService` instance from `@sodax/wallet-sdk-react` via
 * `useXService(getXChainType(xChainId))`, but any impl matching the contract
 * works (e.g. mocks in tests, a custom reader).
 *
 * @param params - Query parameters object, see {@link UseXBalancesParams}
 *
 * @returns UseQueryResult mapping token addresses to balances as bigints (smallest unit).
 *
 * @example
 * ```tsx
 * import { useXService, getXChainType } from '@sodax/wallet-sdk-react';
 * import { useXBalances } from '@sodax/dapp-kit';
 *
 * function TokenBalances({ xChainId, tokens, address }) {
 *   const xService = useXService(getXChainType(xChainId));
 *   const { data: balances } = useXBalances({ xService, xChainId, xTokens: tokens, address });
 *   // ...
 * }
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
