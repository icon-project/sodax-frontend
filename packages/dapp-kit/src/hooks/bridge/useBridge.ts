import { useSodaxContext } from '../shared/useSodaxContext.js';
import type { BridgeParams, HubTxHash, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';

type BridgeResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * Mutation variables for {@link useBridge}. Generic over `K extends SpokeChainKey` (defaults to
 * the full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 */
export type UseBridgeVars<K extends SpokeChainKey = SpokeChainKey> = Omit<BridgeParams<K, false>, 'raw'>;

/**
 * React hook for executing a cross-chain bridge transfer. Pure mutation: all inputs (params,
 * walletProvider) are passed to `mutate({...})`. The hook itself takes no arguments. Returns the
 * SDK `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useBridge<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  BridgeResult,
  Error,
  UseBridgeVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<BridgeResult, Error, UseBridgeVars<K>>({
    mutationFn: async (vars) => {
      return sodax.bridge.bridge({ ...vars, raw: false } as BridgeParams<K, false>);
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.srcChainKey] });
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.dstChainKey] });
    },
  });
}
