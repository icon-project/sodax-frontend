// apps/demo/src/components/dex/hooks/useSupplyLiquidity.ts
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { ClService, type PoolData, type PoolKey, type SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '@sodax/dapp-kit';

interface SupplyLiquidityParams {
  poolData: PoolData;
  poolKey: PoolKey;
  minPrice: string;
  maxPrice: string;
  liquidityToken0Amount: string;
  liquidityToken1Amount: string;
  slippageTolerance: string;
  positionId?: string | null;
  isValidPosition?: boolean;
}

/**
 * Hook for supplying liquidity to a pool.
 *
 * This hook handles both minting new positions and increasing liquidity in existing positions.
 * It applies slippage tolerance before calculating liquidity and handles the complete transaction flow.
 *
 * @param {SpokeProvider | null} spokeProvider - The spoke provider for the chain
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
export function useSupplyLiquidity(
  spokeProvider: SpokeProvider | null,
): UseMutationResult<void, Error, SupplyLiquidityParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      poolData,
      poolKey,
      minPrice,
      maxPrice,
      liquidityToken0Amount,
      liquidityToken1Amount,
      slippageTolerance,
      positionId,
      isValidPosition,
    }: SupplyLiquidityParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }

      if (!minPrice || !maxPrice || !liquidityToken0Amount || !liquidityToken1Amount) {
        throw new Error('Please enter all required values');
      }

      const minPriceNum = Number.parseFloat(minPrice);
      const maxPriceNum = Number.parseFloat(maxPrice);
      const amount0 = Number.parseFloat(liquidityToken0Amount);
      const amount1 = Number.parseFloat(liquidityToken1Amount);

      if (minPriceNum <= 0 || maxPriceNum <= 0 || amount0 <= 0 || amount1 <= 0) {
        throw new Error('All values must be greater than 0');
      }

      if (minPriceNum >= maxPriceNum) {
        throw new Error('Min price must be less than max price');
      }

      const amount0BigInt = BigInt(Math.floor(amount0 * 10 ** poolData.token0.decimals));
      const amount1BigInt = BigInt(Math.floor(amount1 * 10 ** poolData.token1.decimals));

      // Convert prices to ticks
      const token0 = poolData.token0;
      const token1 = poolData.token1;
      const tickSpacing = poolData.tickSpacing;

      const tickLower = ClService.priceToTick(minPriceNum, token0, token1, tickSpacing);
      const tickUpper = ClService.priceToTick(maxPriceNum, token0, token1, tickSpacing);

      // Apply slippage BEFORE calculating liquidity
      const slippage = Number.parseFloat(slippageTolerance) || 0.5;
      const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100)); // e.g., 0.5% => 9950

      const amount0ForLiquidity = (amount0BigInt * slippageMultiplier) / 10000n;
      const amount1ForLiquidity = (amount1BigInt * slippageMultiplier) / 10000n;

      // Calculate liquidity based on reduced amounts (accounting for slippage)
      const liquidity = ClService.calculateLiquidityFromAmounts(
        amount0ForLiquidity,
        amount1ForLiquidity,
        tickLower,
        tickUpper,
        BigInt(poolData.currentTick),
      );

      // Check if we're increasing an existing position or minting a new one
      if (positionId && isValidPosition) {
        // Increase liquidity in existing position
        const increaseResult = await sodax.dex.clService.increaseLiquidity({
          increaseParams: {
            poolKey,
            tokenId: BigInt(positionId),
            tickLower,
            tickUpper,
            liquidity,
            amount0Max: amount0BigInt,
            amount1Max: amount1BigInt,
            sqrtPriceX96: poolData.sqrtPriceX96,
          },
          spokeProvider,
        });

        if (!increaseResult.ok) {
          throw new Error(`Increase liquidity failed: ${increaseResult.error?.code || 'Unknown error'}`);
        }
      } else {
        // Mint new position
        const supplyResult = await sodax.dex.clService.supplyLiquidity({
          supplyParams: {
            poolKey,
            tickLower,
            tickUpper,
            liquidity,
            amount0Max: amount0BigInt,
            amount1Max: amount1BigInt,
            sqrtPriceX96: poolData.sqrtPriceX96,
          },
          spokeProvider,
        });

        if (!supplyResult.ok) {
          throw new Error(`Supply liquidity failed: ${supplyResult.error?.code || 'Unknown error'}`);
        }
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'positionInfo'] });
    },
  });
}

