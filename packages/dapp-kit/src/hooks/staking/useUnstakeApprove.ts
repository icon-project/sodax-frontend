import type { TxReturnType, UnstakeParams } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useUnstakeApprove}. The `action` literal is injected by the hook.
 */
export type UseUnstakeApproveVars<K extends SpokeChainKey = SpokeChainKey> = {
  params: Omit<UnstakeParams<K>, 'action'>;
  walletProvider: GetWalletProviderType<K>;
};

type UnstakeApproveResult<K extends SpokeChainKey> = Result<TxReturnType<K, false>>;

/**
 * React hook for approving xSODA spending on the unstake action. Pure mutation: returns the SDK
 * `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useUnstakeApprove<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  UnstakeApproveResult<K>,
  Error,
  UseUnstakeApproveVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<UnstakeApproveResult<K>, Error, UseUnstakeApproveVars<K>>({
    mutationFn: async ({ params, walletProvider }) => {
      return sodax.staking.approve({
        params: { ...params, action: 'unstake' },
        raw: false,
        walletProvider,
      });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['staking', 'allowance', params.srcChainKey, 'unstake'] });
    },
  });
}
