import { useMemo } from 'react';
import type { PoolData, PoolSpokeAssets } from '@sodax/sdk';
import { createDepositParamsProps, type DepositParamsCore } from '@/utils/dex-utils.js';

export type UseCreateDepositParamsProps = {
  tokenIndex: 0 | 1;
  amount: string | number;
  poolData: PoolData;
  poolSpokeAssets: PoolSpokeAssets;
};

/**
 * React hook to memoize the deposit-specific subset of {@link CreateAssetDepositParams}
 * (`{ asset, amount, poolToken, dst? }`). Callers add `srcChainKey` + `srcAddress` at the mutation
 * call site.
 */
export function useCreateDepositParams({
  tokenIndex,
  amount,
  poolData,
  poolSpokeAssets,
}: UseCreateDepositParamsProps): DepositParamsCore | undefined {
  return useMemo<DepositParamsCore | undefined>(() => {
    if (!amount || Number.parseFloat(String(amount)) <= 0) {
      return undefined;
    }
    return createDepositParamsProps({ tokenIndex, amount, poolData, poolSpokeAssets });
  }, [tokenIndex, amount, poolData, poolSpokeAssets]);
}
