import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ConcentratedLiquidityBurnPositionParams, HubTxHash, SpokeProvider, SpokeTxHash } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseBurnPositionParams = {
  params: ConcentratedLiquidityBurnPositionParams;
  spokeProvider: SpokeProvider;
};

/**
 * React hook to burn (destroy) a concentrated liquidity position NFT in the DEX.
 *
 * Purpose:
 *   - Provides a mutation for burning a position by removing remaining liquidity and
 *     deleting the position NFT, using the DEX SDK's `burnPosition` function.
 *
 * Usage:
 *   - Call the returned mutation's `mutate` or `mutateAsync` method with a
 *     {@link UseBurnPositionParams} argument to initiate the burn.
 *
 * Params for mutation function:
 *   - `params`: {@link ConcentratedLiquidityBurnPositionParams} (poolKey, tokenId, min amounts).
 *   - `spokeProvider`: {@link SpokeProvider} for the target chain.
 *
 * Returns:
 *   - A react-query mutation result:
 *     - On success, resolves to a tuple `[SpokeTxHash, HubTxHash]`.
 *     - On failure, rejects with an `Error`.
 *   - Automatically invalidates `'dex/poolBalances'` and `'dex/positionInfo'` queries on success.
 *
 * Example:
 *   ```ts
 *   const burnMutation = useBurnPosition();
 *   await burnMutation.mutateAsync({
 *     params: { poolKey, tokenId, amount0Min, amount1Min },
 *     spokeProvider
 *   });
 *   ```
 *
 * Note:
 *   - Confirms spokeProvider existence.
 *   - Throws if burn fails or conditions are unmet.
 *   - Always confirm with user before burning positions that might have value.
 */
export function useBurnPosition(): UseMutationResult<[SpokeTxHash, HubTxHash], Error, UseBurnPositionParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ params, spokeProvider }: UseBurnPositionParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }
      const burnResult = await sodax.dex.clService.burnPosition({
        params,
        spokeProvider,
      });

      if (!burnResult.ok) {
        throw new Error(`Burn position failed: ${burnResult.error?.code || 'Unknown error'}`);
      }

      return burnResult.value;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'positionInfo'] });
    },
  });
}
