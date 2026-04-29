import type { BridgeParams, TxReturnType } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useBridgeApprove}. Generic over `K extends SpokeChainKey`
 * (defaults to the full union). Sophisticated callers can lock K at the hook call site to narrow
 * the `walletProvider` and `params.srcChainKey` types.
 */
export type UseBridgeApproveVars<K extends SpokeChainKey = SpokeChainKey> = Omit<BridgeParams<K, false>, 'raw'>;

/**
 * React hook for approving ERC-20 token spending (or trustline establishment) for a bridge
 * action. Pure mutation: all inputs (params, walletProvider) are passed to `mutate({...})`.
 * Returns the SDK `Result<T>` as-is; callers branch on `data?.ok`.
 *
 * On success, invalidates the matching `['bridge', 'allowance', params]` query.
 */
export function useBridgeApprove<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  Result<TxReturnType<K, false>>,
  Error,
  UseBridgeApproveVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<Result<TxReturnType<K, false>>, Error, UseBridgeApproveVars<K>>({
    mutationFn: async (vars) => {
      return sodax.bridge.approve({ ...vars, raw: false } as BridgeParams<K, false>);
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['bridge', 'allowance', params] });
    },
  });
}
