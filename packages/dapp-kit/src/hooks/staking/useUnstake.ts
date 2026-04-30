import type { HubTxHash, SpokeTxHash, UnstakeAction } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseUnstakeVars<K extends SpokeChainKey = SpokeChainKey> = Omit<UnstakeAction<K, false>, 'raw'>;

type UnstakeResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for initiating an SODA unstake. Pure mutation: all inputs (params, walletProvider)
 * are passed via `mutate({...})`. Returns the SDK `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useUnstake<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  UnstakeResult,
  Error,
  UseUnstakeVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<UnstakeResult, Error, UseUnstakeVars<K>>({
    mutationFn: async vars => {
      return sodax.staking.unstake({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['staking', 'info', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({ queryKey: ['staking', 'unstakingInfo'] });
      queryClient.invalidateQueries({ queryKey: ['staking', 'unstakingInfoWithPenalty'] });
      queryClient.invalidateQueries({ queryKey: ['staking', 'allowance', params.srcChainKey, 'unstake'] });
    },
  });
}
