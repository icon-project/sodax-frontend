import type { IntentAutoSwapResult, PartnerFeeClaimSwapAction } from '@sodax/sdk';
import type { HubChainKey, Result } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

export type UseFeeClaimSwapVars = Omit<PartnerFeeClaimSwapAction<HubChainKey, false>, 'raw'>;

type FeeClaimSwapResult = Result<IntentAutoSwapResult>;

/**
 * React hook to create a partner-fee auto-swap intent and wait for the solver execution. Pure
 * mutation: returns the SDK `Result<IntentAutoSwapResult>` as-is; callers branch on `data?.ok`.
 */
export function useFeeClaimSwap(): UseMutationResult<FeeClaimSwapResult, Error, UseFeeClaimSwapVars> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<FeeClaimSwapResult, Error, UseFeeClaimSwapVars>({
    mutationFn: async vars => {
      return sodax.partners.feeClaim.swap({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({
        queryKey: ['partner', 'feeClaim', 'assetsBalances', params.srcAddress],
      });
    },
  });
}
