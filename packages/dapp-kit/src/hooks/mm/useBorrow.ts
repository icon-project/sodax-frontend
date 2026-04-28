import type { HubTxHash, MoneyMarketBorrowActionParams, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useBorrow}. Generic over `K extends SpokeChainKey` (defaults to
 * the full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 */
export type UseBorrowVars<K extends SpokeChainKey = SpokeChainKey> = Omit<
  MoneyMarketBorrowActionParams<K, false>,
  'raw'
>;

type BorrowResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for borrowing tokens from the Sodax money market protocol.
 *
 * Pure mutation: all inputs (params, walletProvider, optional skipSimulation/timeout) are passed
 * to `mutate({...})`. The hook itself takes no arguments. Returns the SDK `Result<T>` as-is;
 * callers branch on `data?.ok`.
 */
export function useBorrow<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  BorrowResult,
  Error,
  UseBorrowVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<BorrowResult, Error, UseBorrowVars<K>>({
    mutationFn: async (vars) => {
      return sodax.moneyMarket.borrow({ ...vars, raw: false } as MoneyMarketBorrowActionParams<K, false>);
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['mm', 'userReservesData', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({
        queryKey: ['mm', 'userFormattedSummary', params.srcChainKey, params.srcAddress],
      });
      queryClient.invalidateQueries({ queryKey: ['mm', 'aTokensBalances'] });
      const balanceChains = new Set([params.srcChainKey, params.toChainId ?? params.srcChainKey]);
      for (const chainKey of balanceChains) {
        queryClient.invalidateQueries({ queryKey: ['xBalances', chainKey] });
      }
    },
  });
}
