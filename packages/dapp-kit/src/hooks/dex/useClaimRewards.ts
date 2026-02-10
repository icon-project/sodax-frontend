import type {
  ConcentratedLiquidityClaimRewardsParams,
  ConcentratedLiquidityError,
  ConcentratedLiquidityErrorCode,
  SpokeProvider,
  SpokeTxHash,
  HubTxHash,
} from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';

export type UseClaimRewardsParams = {
  params: ConcentratedLiquidityClaimRewardsParams;
  spokeProvider: SpokeProvider;
};

/**
 * React hook for creating a mutation to claim DEX rewards for a concentrated liquidity position.
 *
 * @returns {UseMutationResult<[SpokeTxHash, HubTxHash], ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>, UseClaimRewardsParams>}
 *   Returns a react-query mutation result object:
 *   - On success: resolves to a tuple `[SpokeTxHash, HubTxHash]`.
 *   - On error: the error is of type `ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>`.
 *   - The mutation function expects an argument of type {@link UseClaimRewardsParams}
 *     containing `params` (the claim parameters) and `spokeProvider` (the target provider).
 *   - On mutation success, invalidates the queries `'dex/poolBalances'` and `'dex/positionInfo'`.
 *
 * @example
 * const claimRewardsMutation = useClaimRewards();
 * claimRewardsMutation.mutateAsync({
 *   params: { poolKey, tokenId, tickLower, tickUpper },
 *   spokeProvider,
 * });
 */
export function useClaimRewards(): UseMutationResult<
  [SpokeTxHash, HubTxHash],
  ConcentratedLiquidityError<ConcentratedLiquidityErrorCode>,
  UseClaimRewardsParams
> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ params, spokeProvider }: UseClaimRewardsParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }
      const result = await sodax.dex.clService.claimRewards({
        params,
        spokeProvider,
      });

      if (!result.ok) {
        throw new Error(`Claim rewards failed: ${result.error?.code || 'Unknown error'}`);
      }

      return result.value;
    },
    onSuccess: (_, { params, spokeProvider }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['dex', 'poolBalances', params.poolKey, spokeProvider.chainConfig.chain.id],
      });
      queryClient.invalidateQueries({ queryKey: ['dex', 'positionInfo', params.tokenId, params.poolKey] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolData', params.poolKey] });
    },
  });
}
