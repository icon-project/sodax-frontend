// apps/demo/src/components/dex/hooks/useDexDeposit.ts
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { PoolData, PoolKey, SpokeProvider, OriginalAssetAddress } from '@sodax/sdk';
import { useSodaxContext } from '@sodax/dapp-kit';

interface DepositParams {
  tokenIndex: 0 | 1;
  amount: string;
  poolData: PoolData;
  poolKey: PoolKey;
}

/**
 * Hook for depositing tokens to a pool.
 *
 * This hook handles the complete deposit flow including:
 * - Checking token allowance
 * - Approving tokens if needed
 * - Executing the deposit transaction
 *
 * @param {SpokeProvider | null} spokeProvider - The spoke provider for the chain
 * @returns {UseMutationResult<void, Error, DepositParams>} Mutation result with deposit function
 *
 * @example
 * ```typescript
 * const { mutateAsync: deposit, isPending, error } = useDexDeposit(spokeProvider);
 *
 * await deposit({
 *   tokenIndex: 0,
 *   amount: '100',
 *   poolData,
 *   poolKey,
 * });
 * ```
 */
export function useDexDeposit(
  spokeProvider: SpokeProvider | null,
): UseMutationResult<void, Error, DepositParams> {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tokenIndex, amount, poolData, poolKey }: DepositParams) => {
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

      // Check allowance
      const allowanceResult = await sodax.dex.assetService.isAllowanceValid(
        {
          asset: originalAsset,
          amount: amountBigInt,
          poolToken: token.address,
        },
        spokeProvider,
      );

      if (!allowanceResult.ok) {
        throw new Error('Allowance check failed');
      }

      // Approve if needed
      if (!allowanceResult.value) {
        const approveResult = await sodax.dex.assetService.approve(
          {
            asset: originalAsset,
            amount: amountBigInt,
            poolToken: token.address,
          },
          spokeProvider,
          false,
        );

        if (!approveResult.ok) {
          throw new Error('Approval failed');
        }
      }

      // Execute deposit
      const depositResult = await sodax.dex.assetService.deposit(
        {
          asset: originalAsset,
          amount: amountBigInt,
          poolToken: token.address,
        },
        spokeProvider,
      );

      if (!depositResult.ok) {
        throw new Error(`Deposit failed: ${depositResult.error?.code || 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      // Invalidate balances query to refetch after deposit
      queryClient.invalidateQueries({ queryKey: ['dex', 'poolBalances'] });
    },
  });
}

