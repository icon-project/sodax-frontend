import type { ClLiquidityClaimRewardsAction, HubTxHash, SpokeTxHash } from '@sodax/sdk';
import type { Result, SpokeChainKey } from '@sodax/types';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSodaxContext } from '../shared/useSodaxContext.js';

/**
 * Mutation variables for {@link useClaimRewards}. Generic over `K extends SpokeChainKey` (defaults
 * to the full union). Sophisticated callers can lock K at the hook call site to narrow the
 * `walletProvider` and `params.srcChainKey` types.
 */
export type UseClaimRewardsVars<K extends SpokeChainKey = SpokeChainKey> = Omit<
  ClLiquidityClaimRewardsAction<K, false>,
  'raw'
>;

type ClaimRewardsResult = Result<[SpokeTxHash, HubTxHash]>;

/**
 * React hook for claiming accrued fees on a concentrated-liquidity position. Pure mutation: all
 * inputs (params, walletProvider) are passed to `mutate({...})`. Returns the SDK `Result<T>`
 * as-is; callers branch on `data?.ok`.
 */
export function useClaimRewards<K extends SpokeChainKey = SpokeChainKey>(): UseMutationResult<
  ClaimRewardsResult,
  Error,
  UseClaimRewardsVars<K>
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation<ClaimRewardsResult, Error, UseClaimRewardsVars<K>>({
    mutationFn: async vars => {
      return sodax.dex.clService.claimRewards({ ...vars, raw: false });
    },
    onSuccess: (_data, { params }) => {
      queryClient.invalidateQueries({ queryKey: ['dex', 'positionInfo', params.tokenId, params.poolKey] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances', params.srcChainKey, params.srcAddress] });
    },
  });
}
