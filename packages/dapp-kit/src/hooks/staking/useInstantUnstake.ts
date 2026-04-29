import type { HubTxHash, InstantUnstakeAction, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseInstantUnstakeVars<K extends SpokeChainKey = SpokeChainKey> = Omit<
  InstantUnstakeAction<K, false>,
  'raw'
>;

type InstantUnstakeResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for instant-unstaking SODA (bypassing the waiting period at a slippage cost). Pure
 * mutation: all inputs (params, walletProvider) are passed via `mutate({...})`. Returns the SDK
 * `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useInstantUnstake<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  InstantUnstakeResult,
  Error,
  UseInstantUnstakeVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<InstantUnstakeResult, Error, UseInstantUnstakeVars<K>>({
    mutationFn: async vars => {
      return sodax.staking.instantUnstake({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['staking', 'info', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({ queryKey: ['staking', 'instantUnstakeRatio'] });
      queryClient.invalidateQueries({ queryKey: ['staking', 'allowance', params.srcChainKey, 'instantUnstake'] });
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.srcChainKey] });
    },
  });
}
