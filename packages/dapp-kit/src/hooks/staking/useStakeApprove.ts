import type { StakeParams, TxReturnType } from '@sodax/sdk';
import type { GetWalletProviderType, Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useStakeApprove}. The `action` literal is injected by the hook —
 * callers pass the stake-specific fields only.
 */
export type UseStakeApproveVars<K extends SpokeChainKey = SpokeChainKey> = {
  params: Omit<StakeParams<K>, 'action'>;
  walletProvider: GetWalletProviderType<K>;
};

type StakeApproveResult<K extends SpokeChainKey> = Result<TxReturnType<K, false>>;

/**
 * React hook for approving SODA spending on the stake action. Pure mutation: returns the SDK
 * `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useStakeApprove<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  StakeApproveResult<K>,
  Error,
  UseStakeApproveVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<StakeApproveResult<K>, Error, UseStakeApproveVars<K>>({
    mutationFn: async ({ params, walletProvider }) => {
      return sodax.staking.approve({
        params: { ...params, action: 'stake' },
        raw: false,
        walletProvider,
      });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['staking', 'allowance', params.srcChainKey, 'stake'] });
    },
  });
}
