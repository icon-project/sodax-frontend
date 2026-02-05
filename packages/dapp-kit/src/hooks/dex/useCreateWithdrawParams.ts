import type { CreateAssetWithdrawParams, DestinationParamsType, PoolData, PoolKey, SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useMemo } from 'react';
import { createWithdrawParamsProps } from '@/utils/dex-utils';

export type RawDexAssetWithdrawParams = {
  tokenIndex: 0 | 1;
  amount: string | number;
  poolData: PoolData;
  poolKey: PoolKey;
  dst?: DestinationParamsType;
};

export type UseCreateWithdrawParamsProps = RawDexAssetWithdrawParams & {
  spokeProvider: SpokeProvider | null;
};

export function useCreateWithdrawParams({
  tokenIndex,
  amount,
  poolData,
  poolKey,
  spokeProvider,
  dst,
}: UseCreateWithdrawParamsProps): CreateAssetWithdrawParams | undefined {
  const { sodax } = useSodaxContext();

  return useMemo<CreateAssetWithdrawParams | undefined>(() => {
    if (!spokeProvider) {
      console.warn('[useCreateWithdrawParams] Spoke provider is not set');
      return undefined;
    }

    return createWithdrawParamsProps({ tokenIndex, amount, poolData, poolKey, spokeProvider, dst, sodax });
  }, [tokenIndex, amount, poolData, poolKey, spokeProvider, dst, sodax]);
}
