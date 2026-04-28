import type { HubTxHash, MoneyMarketWithdrawActionParams, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useWithdraw}. Generic over `K extends SpokeChainKey` (defaults to
 * the full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 */
export type UseWithdrawVars<K extends SpokeChainKey = SpokeChainKey> = Omit<
  MoneyMarketWithdrawActionParams<K, false>,
  'raw'
>;

type WithdrawResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for withdrawing supplied tokens from the Sodax money market protocol.
 *
 * Pure mutation: all inputs (params, walletProvider, optional skipSimulation/timeout) are passed
 * to `mutate({...})`. The hook itself takes no arguments — call it once per component, then
 * fire `mutate()` with whatever chain/wallet context is current at the moment of invocation.
 * Returns the SDK `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useWithdraw<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  WithdrawResult,
  Error,
  UseWithdrawVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<WithdrawResult, Error, UseWithdrawVars<K>>({
    mutationFn: async (vars) => {
      return sodax.moneyMarket.withdraw({ ...vars, raw: false } as MoneyMarketWithdrawActionParams<K, false>);
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
