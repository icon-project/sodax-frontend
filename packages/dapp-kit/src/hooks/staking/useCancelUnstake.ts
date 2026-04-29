import type { CancelUnstakeAction, HubTxHash, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseCancelUnstakeVars<K extends SpokeChainKey = SpokeChainKey> = Omit<CancelUnstakeAction<K, false>, 'raw'>;

type CancelUnstakeResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for cancelling a pending unstake request. Pure mutation: all inputs (params,
 * walletProvider) are passed via `mutate({...})`. Returns the SDK `Result<T>` as-is; callers
 * branch on `data?.ok`.
 */
export function useCancelUnstake<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  CancelUnstakeResult,
  Error,
  UseCancelUnstakeVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<CancelUnstakeResult, Error, UseCancelUnstakeVars<K>>({
    mutationFn: async vars => {
      return sodax.staking.cancelUnstake({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['staking', 'unstakingInfo', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({
        queryKey: ['staking', 'unstakingInfoWithPenalty', params.srcChainKey, params.srcAddress],
      });
      queryClient.invalidateQueries({ queryKey: ['staking', 'info', params.srcChainKey, params.srcAddress] });
    },
  });
}
