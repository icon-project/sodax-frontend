import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type {
  ConcentratedLiquidityDecreaseLiquidityParams,
  HubTxHash,
  SpokeProvider,
  SpokeTxHash,
} from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

export type UseDecreaseLiquidityParams = {
  params: ConcentratedLiquidityDecreaseLiquidityParams;
  spokeProvider: SpokeProvider;
};

/**
 * React hook that provides a mutation for decreasing liquidity in a concentrated liquidity position.
 *
 * This hook returns a mutation for removing liquidity from a position using the provided
 * `ConcentratedLiquidityDecreaseLiquidityParams` and `SpokeProvider`. The mutation returns a tuple of
 * the spoke transaction hash and the hub transaction hash upon success.
 *
 * @returns {UseMutationResult<[SpokeTxHash, HubTxHash], Error, UseDecreaseLiquidityParams>}
 *   React Query mutation result:
 *   - `mutateAsync({ params, spokeProvider })`: Triggers the decrease liquidity mutation.
 *   - On success, returns `[spokeTxHash, hubTxHash]`.
 *   - On failure, throws an error.
 *
 * @example
 * ```typescript
 * const { mutateAsync: decreaseLiquidity, isPending, error } = useDecreaseLiquidity();
 *
 * await decreaseLiquidity({
 *   params: {
 *     poolKey,
 *     tokenId: 123n,
 *     liquidity: 100000n,
 *     amount0Min: 0n,
 *     amount1Min: 0n,
 *   },
 *   spokeProvider,
 * });
 * ```
 *
 * @param {UseDecreaseLiquidityParams} variables
 *   - `params`: Parameters for the decrease liquidity operation, matching `ConcentratedLiquidityDecreaseLiquidityParams`.
 *   - `spokeProvider`: The provider instance for the target spoke chain.
 *
 * @remarks
 * - After a successful liquidity decrease, the hook will invalidate DEX pool balances and position info queries.
 */
export function useDecreaseLiquidity(): UseMutationResult<[SpokeTxHash, HubTxHash], Error, UseDecreaseLiquidityParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ params, spokeProvider }: UseDecreaseLiquidityParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }

      const decreaseResult = await sodax.dex.clService.decreaseLiquidity({
        params,
        spokeProvider,
      });

      if (!decreaseResult.ok) {
        throw new Error(`Decrease liquidity failed: ${decreaseResult.error?.code || 'Unknown error'}`);
      }

      return decreaseResult.value;
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful liquidity decrease
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'positionInfo'] });
    },
  });
}
