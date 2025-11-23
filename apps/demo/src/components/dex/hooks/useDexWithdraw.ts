// apps/demo/src/components/dex/hooks/useDexWithdraw.ts
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ClPositionInfo, PoolData, PoolKey, SpokeProvider, OriginalAssetAddress } from '@sodax/sdk';
import { useSodaxContext } from '@sodax/dapp-kit';

interface WithdrawParams {
  tokenIndex: 0 | 1;
  amount: string;
  poolData: PoolData;
  poolKey: PoolKey;
}

/**
 * Hook for withdrawing tokens from a pool.
 *
 * This hook handles the withdrawal of tokens from a pool back to the user's wallet.
 *
 * @param {SpokeProvider | null} spokeProvider - The spoke provider for the chain
 * @returns {UseMutationResult<void, Error, WithdrawParams>} Mutation result with withdraw function
 *
 * @example
 * ```typescript
 * const { mutateAsync: withdraw, isPending, error } = useDexWithdraw(spokeProvider);
 *
 * await withdraw({
 *   tokenIndex: 0,
 *   amount: '50',
 *   poolData,
 *   poolKey,
 * });
 * ```
 */
export function useDexWithdraw(
  spokeProvider: SpokeProvider | null,
): UseMutationResult<void, Error, WithdrawParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tokenIndex, amount, poolData, poolKey }: WithdrawParams) => {
      if (!spokeProvider) {
        throw new Error('Spoke provider is required');
      }

      const amountNum = Number.parseFloat(amount);
      if (!amount || amountNum <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const token = tokenIndex === 0 ? poolData.token0 : poolData.token1;
      const assets = sodax.dex.clService.getAssetsForPool(spokeProvider, poolKey);
      if (!assets) {
        throw new Error('Failed to get assets for pool');
      }

      const originalAsset: OriginalAssetAddress = tokenIndex === 0 ? assets.token0 : assets.token1;
      const amountBigInt = BigInt(Math.floor(amountNum * 10 ** token.decimals));

      // Execute withdraw
      const withdrawResult = await sodax.dex.assetService.withdraw(
        {
          poolToken: token.address,
          asset: originalAsset,
          amount: amountBigInt,
        },
        spokeProvider,
      );

      if (!withdrawResult.ok) {
        throw new Error(`Withdraw failed: ${withdrawResult.error.code}`);
      }
    },
    onSuccess: () => {
      // Invalidate balances query to refetch after withdraw
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
    },
  });
}

