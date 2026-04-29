import type { AssetWithdrawAction, HubTxHash, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useDexWithdraw}. Generic over `K extends SpokeChainKey` (defaults
 * to the full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 */
export type UseDexWithdrawVars<K extends SpokeChainKey = SpokeChainKey> = Omit<AssetWithdrawAction<K, false>, 'raw'>;

type DexWithdrawResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for withdrawing an asset from a DEX pool. Pure mutation: all inputs (params,
 * walletProvider) are passed to `mutate({...})`. Returns the SDK `Result<T>` as-is; callers branch
 * on `data?.ok`.
 */
export function useDexWithdraw<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  DexWithdrawResult,
  Error,
  UseDexWithdrawVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<DexWithdrawResult, Error, UseDexWithdrawVars<K>>({
    mutationFn: async vars => {
      return sodax.dex.assetService.withdraw({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.srcChainKey] });
    },
  });
}
