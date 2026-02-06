import type { CreateAssetWithdrawParams, DestinationParamsType, PoolData, PoolSpokeAssets } from '@sodax/sdk';
import { useMemo } from 'react';
import { createWithdrawParamsProps } from '@/utils/dex-utils';

export type UseCreateWithdrawParamsProps = {
  tokenIndex: 0 | 1;
  amount: string | number;
  poolData: PoolData;
  poolSpokeAssets: PoolSpokeAssets;
  dst?: DestinationParamsType;
};

/**
 * React hook to create the withdrawal parameters for a given pool and token.
 *
 * Purpose:
 *   - Provides a hook which memoizes the withdrawal parameters for a given pool and token.
 *
 * Usage:
 *   - Call the function with the token index, amount, pool data, pool spoke assets, and destination parameters to create the withdrawal parameters.
 *
 * Params:
 * @param tokenIndex - The index of the token to withdraw.
 * @param amount - The amount of the token to withdraw.
 * @param poolData - The pool data of the pool to withdraw from.
 * @param poolSpokeAssets - The pool spoke assets of the pool to withdraw from.
 * @param dst - The destination parameters for the withdrawal.
 * @returns The withdrawal parameters or undefined if the amount is not set.
 */
export function useCreateWithdrawParams({
  tokenIndex,
  amount,
  poolData,
  poolSpokeAssets,
  dst,
}: UseCreateWithdrawParamsProps): CreateAssetWithdrawParams | undefined {
  return useMemo<CreateAssetWithdrawParams | undefined>(() => {
    if (!amount || Number.parseFloat(String(amount)) <= 0) {
      console.warn('[useCreateWithdrawParams] Amount must be greater than 0');
      return undefined;
    }

    return createWithdrawParamsProps({ tokenIndex, amount, poolData, poolSpokeAssets, dst });
  }, [tokenIndex, amount, poolData, poolSpokeAssets, dst]);
}
