import type { InstantUnstakeParams, TxReturnType } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useInstantUnstakeApprove}. The `action` literal is injected by
 * the hook.
 */
export type UseInstantUnstakeApproveVars<K extends SpokeChainKey = SpokeChainKey> = {
  params: Omit<InstantUnstakeParams<K>, 'action'>;
  walletProvider: GetWalletProviderType<K>;
};

type InstantUnstakeApproveResult<K extends SpokeChainKey> = Result<TxReturnType<K, false>>;

/**
 * React hook for approving xSODA spending on the instant-unstake action. Pure mutation: returns
 * the SDK `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useInstantUnstakeApprove<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  InstantUnstakeApproveResult<K>,
  Error,
  UseInstantUnstakeApproveVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<InstantUnstakeApproveResult<K>, Error, UseInstantUnstakeApproveVars<K>>({
    mutationFn: async ({ params, walletProvider }) => {
      return sodax.staking.approve({
        params: { ...params, action: 'instantUnstake' },
        raw: false,
        walletProvider,
      });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['staking', 'allowance', params.srcChainKey, 'instantUnstake'] });
    },
  });
}
