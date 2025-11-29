import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { PoolData, PoolKey, SpokeProvider, OriginalAssetAddress, SpokeTxHash, HubTxHash } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import { parseUnits } from 'viem';

interface WithdrawParams {
  tokenIndex: 0 | 1;
  amount: string;
  poolData: PoolData;
  poolKey: PoolKey;
}

/**
 * React hook to withdraw tokens from a DEX pool to the user's wallet.
 *
 * This hook executes a withdrawal operation for a selected token in a pool, returning the funds to the connected user.
 * It automatically triggers a refetch of pool balances upon a successful withdrawal to keep the UI up-to-date.
 *
 * @param {SpokeProvider | null} spokeProvider
 *   The SpokeProvider instance for the current chain. Pass `null` to disable the mutation.
 *
 * @returns {UseMutationResult<[SpokeTxHash, HubTxHash], Error, WithdrawParams>}
 *   A React Query mutation object:
 *   - `mutateAsync(withdrawParams)` initiates the withdrawal using {@link WithdrawParams}
 *   - `isPending` boolean set during mutation
 *   - `error` available if withdrawal fails
 *
 * @example
 * ```typescript
 * const { mutateAsync: withdraw, isPending, error } = useDexWithdraw(spokeProvider);
 *
 * await withdraw({
 *   tokenIndex: 0,         // 0 for token0, 1 for token1
 *   amount: '50',          // Amount to withdraw as a string, will be parsed to BigInt base units
 *   poolData,
 *   poolKey,
 * });
 * ```
 *
 * @remarks
 * - The input amount must be non-empty and strictly greater than zero.
 * - Throws if any required argument is missing or invalid.
 * - The returned tuple: [spokeTxHash, hubTxHash] from the SDK after withdrawal.
 * - Internally invalidates the `['dex', 'poolBalances']` query on success.
 */
export function useDexWithdraw(
  spokeProvider: SpokeProvider | null,
): UseMutationResult<[SpokeTxHash, HubTxHash], Error, WithdrawParams> {
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

      // Execute withdraw
      const withdrawResult = await sodax.dex.assetService.withdraw({
        withdrawParams: {
          poolToken: token.address,
          asset: originalAsset,
          amount: parseUnits(amount, token.decimals),
        },
        spokeProvider,
      });

      if (!withdrawResult.ok) {
        throw new Error(`Withdraw failed: ${withdrawResult.error.code}`);
      }

      return withdrawResult.value;
    },
    onSuccess: () => {
      // Invalidate balances query to refetch after withdraw
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
    },
  });
}
