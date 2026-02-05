import { useMemo } from 'react';
import type { CreateAssetDepositParams, PoolData, PoolKey, SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import { createDepositParamsProps } from '@/utils/dex-utils';

export type RawDexDepositParams = {
  tokenIndex: 0 | 1;
  amount: string | number;
  poolData: PoolData;
  poolKey: PoolKey;
};

export type UseCreateDepositParamsProps = RawDexDepositParams & {
  spokeProvider: SpokeProvider | null;
};

export function useCreateDepositParams({
  tokenIndex,
  amount,
  poolData,
  poolKey,
  spokeProvider,
}: UseCreateDepositParamsProps): CreateAssetDepositParams | undefined {
  const { sodax } = useSodaxContext();

  return useMemo<CreateAssetDepositParams | undefined>(() => {
    if (!spokeProvider) {
      console.warn('[useCreateDepositParams] Spoke provider is not set');
      return undefined;
    }

    if (!amount || Number.parseFloat(String(amount)) <= 0) {
      console.warn('[useCreateDepositParams] Amount must be greater than 0');
      return undefined;
    }

    console.log('useCreateDepositParams', tokenIndex, amount, poolData, poolKey, spokeProvider);
    return createDepositParamsProps({ poolKey, tokenIndex, amount, poolData, spokeProvider, sodax });
  }, [tokenIndex, amount, poolData, poolKey, spokeProvider, sodax]);
}
