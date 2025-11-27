import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ClPositionInfo, HubTxHash, PoolKey, SpokeProvider, SpokeTxHash } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

interface DecreaseLiquidityParams {
  poolKey: PoolKey;
  tokenId: string;
  percentage: string;
  positionInfo: ClPositionInfo;
  slippageTolerance: string;
}

/**
 * Hook for decreasing liquidity from a position.
 *
 * This hook handles decreasing liquidity by a percentage from an existing position.
 * It calculates the liquidity to remove and applies slippage tolerance to minimum amounts.
 *
 * @param {SpokeProvider | null} spokeProvider - The spoke provider for the chain
 * @returns {UseMutationResult<void, Error, DecreaseLiquidityParams>} Mutation result with decrease function
 *
 * @example
 * ```typescript
 * const { mutateAsync: decreaseLiquidity, isPending, error } = useDecreaseLiquidity(spokeProvider);
 *
 * await decreaseLiquidity({
 *   poolKey,
 *   tokenId: '123',
 *   percentage: '50',
 *   positionInfo,
 *   slippageTolerance: '0.5',
 * });
 * ```
 */
export function useDecreaseLiquidity(
  spokeProvider: SpokeProvider | null,
): UseMutationResult<[SpokeTxHash, HubTxHash], Error, DecreaseLiquidityParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poolKey, tokenId, percentage, positionInfo, slippageTolerance }: DecreaseLiquidityParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }

      const percentageNum = Number.parseFloat(percentage);
      if (percentageNum <= 0 || percentageNum > 100) {
        throw new Error('Percentage must be between 0 and 100');
      }

      // Calculate liquidity to remove based on percentage
      const liquidityToRemove = (positionInfo.liquidity * BigInt(Math.floor(percentageNum * 100))) / 10000n;

      // Calculate expected token amounts from this liquidity
      const expectedAmount0 = (positionInfo.amount0 * BigInt(Math.floor(percentageNum * 100))) / 10000n;
      const expectedAmount1 = (positionInfo.amount1 * BigInt(Math.floor(percentageNum * 100))) / 10000n;

      // Apply slippage to minimum amounts
      const slippage = Number.parseFloat(slippageTolerance) || 0.5;
      const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
      const amount0Min = (expectedAmount0 * slippageMultiplier) / 10000n;
      const amount1Min = (expectedAmount1 * slippageMultiplier) / 10000n;

      const decreaseResult = await sodax.dex.clService.decreaseLiquidity({
        decreaseParams: {
          poolKey,
          tokenId: BigInt(tokenId),
          liquidity: liquidityToRemove,
          amount0Min,
          amount1Min,
        },
        spokeProvider,
      });

      if (!decreaseResult.ok) {
        throw new Error(`Decrease liquidity failed: ${decreaseResult.error?.code || 'Unknown error'}`);
      }

      return decreaseResult.value;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'positionInfo'] });
    },
  });
}
