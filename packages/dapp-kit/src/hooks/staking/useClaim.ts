import type { ClaimAction, HubTxHash, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseClaimVars<K extends SpokeChainKey = SpokeChainKey> = Omit<ClaimAction<K, false>, 'raw'>;

type ClaimResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for claiming an unstaked SODA request that has reached the end of its waiting
 * period. Pure mutation: all inputs (params, walletProvider) are passed via `mutate({...})`.
 * Returns the SDK `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useClaim<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  ClaimResult,
  Error,
  UseClaimVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<ClaimResult, Error, UseClaimVars<K>>({
    mutationFn: async vars => {
      return sodax.staking.claim({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['staking', 'unstakingInfo', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({
        queryKey: ['staking', 'unstakingInfoWithPenalty', params.srcChainKey, params.srcAddress],
      });
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.srcChainKey] });
    },
  });
}
