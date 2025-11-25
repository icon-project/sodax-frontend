import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ClPositionInfo, PoolData, PoolKey, SpokeProvider } from '@sodax/sdk';
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
 * Hook for burning a position NFT.
 *
 * This hook handles the complete burn process:
 * 1. If position has liquidity, decreases it to 0 first
 * 2. Burns the position NFT
 *
 * It includes a confirmation dialog if the position has liquidity.
 *
 * @param {SpokeProvider | null} spokeProvider - The spoke provider for the chain
 * @param {boolean} skipConfirmation - Whether to skip the confirmation dialog (default: false)
 * @returns {UseMutationResult<void, Error, BurnPositionParams>} Mutation result with burn function
 *
 * @example
 * ```typescript
 * const { mutateAsync: burnPosition, isPending, error } = useBurnPosition(spokeProvider);
 *
 * await burnPosition({
 *   poolKey,
 *   tokenId: '123',
 *   positionInfo,
 *   poolData,
 *   slippageTolerance: '0.5',
 *   formatAmount,
 * });
 * ```
 */
export function useBurnPosition(
  spokeProvider: SpokeProvider | null,
  skipConfirmation = false,
): UseMutationResult<void, Error, BurnPositionParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poolKey, tokenId, positionInfo, poolData, slippageTolerance, formatAmount }: BurnPositionParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }

      // Show confirmation dialog if position has liquidity
      if (!skipConfirmation && positionInfo.liquidity > 0n) {
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

        const confirmMessage = `This position has liquidity. Burning will:\n1. Remove all liquidity:\n   - ${token0Details}\n   - ${token1Details}\n2. Burn the NFT\n\nAre you sure?`;

        if (!window.confirm(confirmMessage)) {
          throw new Error('Burn cancelled by user');
        }
      } else if (!skipConfirmation) {
        const confirmMessage = 'Are you sure you want to burn this position? This action cannot be undone.';
        if (!window.confirm(confirmMessage)) {
          throw new Error('Burn cancelled by user');
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
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
      queryClient.invalidateQueries({ queryKey: ['dex', 'positionInfo'] });
    },
  });
}

