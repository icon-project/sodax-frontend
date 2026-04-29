import type { AssetDepositAction, TxReturnType } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useDexApprove}. Generic over `K extends SpokeChainKey` (defaults
 * to the full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 */
export type UseDexApproveVars<K extends SpokeChainKey = SpokeChainKey> = Omit<AssetDepositAction<K, false>, 'raw'>;

/**
 * React hook for approving ERC-20 token spending (or trustline establishment) for a DEX deposit.
 * Pure mutation: all inputs (params, walletProvider) are passed to `mutate({...})`. Returns the
 * SDK `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useDexApprove<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  Result<TxReturnType<K, false>>,
  Error,
  UseDexApproveVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<Result<TxReturnType<K, false>>, Error, UseDexApproveVars<K>>({
    mutationFn: async vars => {
      return sodax.dex.assetService.approve({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({
        queryKey: ['dex', 'allowance', params.srcChainKey, params.asset, params.amount.toString()],
      });
    },
  });
}
