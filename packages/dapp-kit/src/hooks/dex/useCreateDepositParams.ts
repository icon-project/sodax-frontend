import { useMemo } from 'react';
import type { CreateAssetDepositParams, PoolData, PoolSpokeAssets } from '@sodax/sdk';
import { createDepositParamsProps } from '@/utils/dex-utils';

export type UseCreateDepositParamsProps = {
  tokenIndex: 0 | 1;
  amount: string | number;
  poolData: PoolData;
  poolSpokeAssets: PoolSpokeAssets;
};


/**
 * React hook to create the deposit parameters for a given pool and token.
 *
 * Purpose:
 *   - Provides a hook which memoizes the deposit parameters for a given pool and token.
 *
 * Usage:
 *   - Call the function with the token index, amount, pool data, pool key, and spoke provider to create the deposit parameters.
 *
 * Params:
 * @param tokenIndex - The index of the token to deposit.
 * @param amount - The amount of the token to deposit.
 * @param poolData - The pool data of the pool to deposit to.
 * @param poolKey - The pool key of the pool to deposit to.
 * @param spokeProvider - The spoke provider to use for the deposit.
 * @returns The deposit parameters or undefined if the pool key, spoke provider, or amount is not set.
 */
export function useCreateDepositParams({
  tokenIndex,
  amount,
  poolData,
  poolSpokeAssets,
}: UseCreateDepositParamsProps): CreateAssetDepositParams | undefined {
  return useMemo<CreateAssetDepositParams | undefined>(() => {
    if (!amount || Number.parseFloat(String(amount)) <= 0) {
      console.warn('[useCreateDepositParams] Amount must be greater than 0');
      return undefined;
    }

    return createDepositParamsProps({ tokenIndex, amount, poolData, poolSpokeAssets });
  }, [tokenIndex, amount, poolData, poolSpokeAssets]);
}
