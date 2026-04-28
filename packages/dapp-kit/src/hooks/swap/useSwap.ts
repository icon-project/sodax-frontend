import { useSodaxContext } from '../shared/useSodaxContext.js';
import type { SolverExecutionResponse, Intent, IntentDeliveryInfo, SwapActionParams } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';

type CreateIntentResult = Result<[SolverExecutionResponse, Intent, IntentDeliveryInfo]>;

/**
 * Mutation variables for {@link useSwap}. Generic over `K extends SpokeChainKey` (defaults to the
 * full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 */
export type UseSwapVars<K extends SpokeChainKey = SpokeChainKey> = Omit<SwapActionParams<K, false>, 'raw'>;

/**
 * React hook for executing an intent-based cross-chain swap. Pure mutation: all inputs (params,
 * walletProvider) are passed to `mutate({...})`. The hook itself takes no arguments. Returns the
 * SDK `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useSwap<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  CreateIntentResult,
  Error,
  UseSwapVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<CreateIntentResult, Error, UseSwapVars<K>>({
    mutationFn: async (vars) => {
      return sodax.swaps.swap({ ...vars, raw: false } as SwapActionParams<K, false>);
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.srcChainKey] });
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.dstChainKey] });
    },
  });
}
