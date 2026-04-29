import type { MoneyMarketApproveActionParams, MoneyMarketParams, TxReturnType } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useMMApprove}. Generic over `K extends SpokeChainKey` (defaults
 * to the full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 *
 * Exec-mode shape without `raw` (see {@link UseBorrowVars}).
 */
export type UseMMApproveVars<K extends SpokeChainKey = SpokeChainKey> = {
  params: MoneyMarketParams<K>;
  skipSimulation?: boolean;
  timeout?: number;
  walletProvider: GetWalletProviderType<K>;
};

/**
 * React hook for approving ERC-20 token spending (or trustline establishment) for a Sodax money
 * market action. Pure mutation: all inputs (params, walletProvider) are passed to `mutate({...})`.
 * Returns the SDK `Result<T>` as-is; callers branch on `data?.ok`.
 *
 * On success, invalidates the matching `['mm', 'allowance', srcChainKey, token, action]` query.
 */
export function useMMApprove<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  Result<TxReturnType<K, false>>,
  Error,
  UseMMApproveVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<Result<TxReturnType<K, false>>, Error, UseMMApproveVars<K>>({
    mutationFn: async vars => {
      return sodax.moneyMarket.approve({ ...vars, raw: false } as MoneyMarketApproveActionParams<K, false>);
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({
        queryKey: ['mm', 'allowance', params.srcChainKey, params.token, params.action],
      });
    },
  });
}
