import type { HubTxHash, SpokeTxHash, StakeAction } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useStake}. Generic over `K extends SpokeChainKey` (defaults to
 * the full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 */
export type UseStakeVars<K extends SpokeChainKey = SpokeChainKey> = Omit<StakeAction<K, false>, 'raw'>;

type StakeResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for staking SODA tokens. Pure mutation: all inputs (params, walletProvider) are
 * passed via `mutate({...})`. Returns the SDK `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useStake<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  StakeResult,
  Error,
  UseStakeVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<StakeResult, Error, UseStakeVars<K>>({
    mutationFn: async vars => {
      return sodax.staking.stake({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['staking', 'info', params.srcChainKey, params.srcAddress] });
      queryClient.invalidateQueries({ queryKey: ['staking', 'allowance', params.srcChainKey, 'stake'] });
      queryClient.invalidateQueries({ queryKey: ['staking', 'stakeRatio'] });
      queryClient.invalidateQueries({ queryKey: ['staking', 'convertedAssets'] });
      queryClient.invalidateQueries({ queryKey: ['xBalances', params.srcChainKey] });
    },
  });
}
