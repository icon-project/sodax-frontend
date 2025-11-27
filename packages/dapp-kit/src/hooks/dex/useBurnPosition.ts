import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ClPositionInfo, HubTxHash, PoolData, PoolKey, SpokeProvider, SpokeTxHash } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';

interface BurnPositionParams {
  poolKey: PoolKey;
  tokenId: string;
  positionInfo: ClPositionInfo;
  poolData: PoolData;
  slippageTolerance: string;
  formatAmount: (amount: bigint, decimals: number) => string;
}

/**
 * React hook to burn a CL position NFT, removing liquidity if any remains before burning.
 *
 * This hook automates the two-step burn workflow for CL position NFTs:
 *  1. If the position contains liquidity, it calls decreaseLiquidity to zero the position first,
 *     using the provided slippage settings and minimum acceptable withdrawal amounts.
 *  2. Calls burnPosition to fully burn the NFT after removal.
 *
 * During execution, the hook optionally presents a confirmation dialog if any liquidity exists
 * (the confirmation logic/UI should be handled by the caller, hook passes all relevant details).
 * It handles all mutation, success/error propagation, and relevant react-query cache invalidation.
 *
 * @param {SpokeProvider | null} spokeProvider
 *   The provider object representing the relevant network connection. Required.
 * @returns {UseMutationResult<[SpokeTxHash, HubTxHash], Error, BurnPositionParams>}
 *   The mutation object to invoke burning, including status, error and helpers.
 *
 * @example
 * ```typescript
 * const { mutateAsync: burnPosition, isPending, error } = useBurnPosition(spokeProvider);
 * await burnPosition({
 *   poolKey, // The PoolKey referencing the pool
 *   tokenId: '123', // Position NFT ID as string
 *   positionInfo, // Position details object (ClPositionInfo)
 *   poolData, // PoolData for extra token/decimals/context
 *   slippageTolerance: '0.5', // Slippage value, e.g. "0.5"
 *   formatAmount: (amount, decimals) => ... // Function for formatting returned amounts
 * });
 * ```
 *
 * @remarks
 * - Always use in combination with UI confirmation when position holds liquidity.
 * - If `spokeProvider` is null, the mutation throws immediately.
 * - Underlying mutation returns `[SpokeTxHash, HubTxHash]` tuple upon success.
 */
export function useBurnPosition(
  spokeProvider: SpokeProvider | null
): UseMutationResult<[SpokeTxHash, HubTxHash], Error, BurnPositionParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poolKey, tokenId, positionInfo, poolData, slippageTolerance, formatAmount }: BurnPositionParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }

      // Show confirmation dialog if position has liquidity
      if (positionInfo.liquidity > 0n) {
        const token0Amount = `${formatAmount(positionInfo.amount0, poolData.token0.decimals)} ${poolData.token0.symbol}`;
        const token1Amount = `${formatAmount(positionInfo.amount1, poolData.token1.decimals)} ${poolData.token1.symbol}`;

        let token0Details = token0Amount;
        let token1Details = token1Amount;

        if (positionInfo.amount0Underlying && poolData.token0IsStatAToken && poolData.token0UnderlyingToken) {
          const underlyingAmount = formatAmount(positionInfo.amount0Underlying, poolData.token0UnderlyingToken.decimals);
          token0Details += ` (≈${underlyingAmount} ${poolData.token0UnderlyingToken.symbol})`;
        }

        if (positionInfo.amount1Underlying && poolData.token1IsStatAToken && poolData.token1UnderlyingToken) {
          const underlyingAmount = formatAmount(positionInfo.amount1Underlying, poolData.token1UnderlyingToken.decimals);
          token1Details += ` (≈${underlyingAmount} ${poolData.token1UnderlyingToken.symbol})`;
        }
      }

      // Step 1: If position has liquidity, decrease it to 0 first
      if (positionInfo.liquidity > 0n) {
        const slippage = Number.parseFloat(slippageTolerance) || 0.5;
        const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
        const amount0Min = (positionInfo.amount0 * slippageMultiplier) / 10000n;
        const amount1Min = (positionInfo.amount1 * slippageMultiplier) / 10000n;

        const decreaseResult = await sodax.dex.clService.decreaseLiquidity({
          decreaseParams: {
            poolKey,
            tokenId: BigInt(tokenId),
            liquidity: positionInfo.liquidity,
            amount0Min,
            amount1Min,
          },
          spokeProvider,
        });

        if (!decreaseResult.ok) {
          throw new Error(`Failed to remove liquidity: ${decreaseResult.error?.code || 'Unknown error'}`);
        }
      }

      // Step 2: Burn the position NFT
      const burnResult = await sodax.dex.clService.burnPosition({
        burnParams: {
          poolKey,
          tokenId: BigInt(tokenId),
          amount0Min: 0n,
          amount1Min: 0n,
        },
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

