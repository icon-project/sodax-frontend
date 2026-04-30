import type { FeeTokenApproveAction, TxReturnType } from '@sodax/sdk';
import type { HubChainKey, Result } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseApproveTokenVars = Omit<FeeTokenApproveAction<HubChainKey, false>, 'raw'>;

type ApproveTokenResult = Result<TxReturnType<HubChainKey, false>>;

/**
 * React hook to approve a token to the protocol-intents contract on Sonic with max allowance.
 * Pure mutation: pass `{ params, walletProvider }` to `mutate({...})`. Returns the SDK
 * `Result<T>` as-is; callers branch on `data?.ok`.
 */
export function useApproveToken(): UseMutationResult<ApproveTokenResult, Error, UseApproveTokenVars> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<ApproveTokenResult, Error, UseApproveTokenVars>({
    mutationFn: async vars => {
      return sodax.partners.feeClaim.approveToken<false>({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({
        queryKey: ['partner', 'feeClaim', 'isTokenApproved', params.srcChainKey, params.srcAddress, params.token],
      });
    },
  });
}
