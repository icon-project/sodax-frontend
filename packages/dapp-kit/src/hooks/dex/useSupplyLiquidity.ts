import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { HubTxHash, SpokeTxHash, SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import type { UseCreateSupplyLiquidityParamsResult } from './useCreateSupplyLiquidityParams';

export type UseSupplyLiquidityProps = {
  params: UseCreateSupplyLiquidityParamsResult;
  spokeProvider: SpokeProvider;
};

/**
 * Hook for supplying liquidity to a pool.
 *
 * This hook handles both minting new positions and increasing liquidity in existing positions.
 * It applies slippage tolerance before calculating liquidity and handles the complete transaction flow.
 *
 * @param {SpokeProvider} spokeProvider - The spoke provider for the chain
 * @returns {UseMutationResult<void, Error, SupplyLiquidityParams>} Mutation result with supply function
 *
 * @example
 * ```typescript
 * const { mutateAsync: supplyLiquidity, isPending, error } = useSupplyLiquidity(spokeProvider);
 *
 * await supplyLiquidity({
 *   poolData,
 *   poolKey,
 *   minPrice: '100',
 *   maxPrice: '200',
 *   liquidityToken0Amount: '10',
 *   liquidityToken1Amount: '20',
 *   slippageTolerance: '0.5',
 * });
 * ```
 */
export function useSupplyLiquidity(): UseMutationResult<[SpokeTxHash, HubTxHash], Error, UseSupplyLiquidityProps> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ params, spokeProvider }: UseSupplyLiquidityProps) => {
      // Check if we're increasing an existing position or minting a new one
      if (params.tokenId && params.isValidPosition) {
        // Increase liquidity in existing position
        const increaseResult = await sodax.dex.clService.increaseLiquidity({
          params: {
            poolKey: params.poolKey,
            tokenId: BigInt(params.tokenId),
            tickLower: params.tickLower,
            tickUpper: params.tickUpper,
            liquidity: params.liquidity,
            amount0Max: params.amount0Max,
            amount1Max: params.amount1Max,
            sqrtPriceX96: params.sqrtPriceX96,
          },
          spokeProvider,
        });

        if (!increaseResult.ok) {
          throw new Error(`Increase liquidity failed: ${increaseResult.error?.code || 'Unknown error'}`);
        }

        return increaseResult.value;
      }

      // Mint new position
      const supplyResult = await sodax.dex.clService.supplyLiquidity({
        params: {
          poolKey: params.poolKey,
          tickLower: params.tickLower,
          tickUpper: params.tickUpper,
          liquidity: params.liquidity,
          amount0Max: params.amount0Max,
          amount1Max: params.amount1Max,
          sqrtPriceX96: params.sqrtPriceX96,
        },
        spokeProvider,
      });

      if (!supplyResult.ok) {
        throw new Error(`Supply liquidity failed: ${supplyResult.error?.code || 'Unknown error'}`);
      }

      return supplyResult.value;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'positionInfo'] });
    },
  });
}
