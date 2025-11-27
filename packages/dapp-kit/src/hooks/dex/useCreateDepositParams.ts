import type { CreateDepositParams, OriginalAssetAddress, PoolData, PoolKey, SpokeProvider } from '@sodax/sdk';
import { useSodaxContext } from '../shared/useSodaxContext';
import { useMemo } from 'react';
import { parseUnits } from 'viem';

export type RawDepositParams = {
  tokenIndex: 0 | 1;
  amount: string;
  poolData: PoolData;
  poolKey: PoolKey;
};

export type UseCreateDepositParamsProps = RawDepositParams & {
  spokeProvider: SpokeProvider | null;
};

// Returns a memoized CreateDepositParams if input is valid, or undefined otherwise
export function useCreateDepositParams({
  tokenIndex,
  amount,
  poolData,
  poolKey,
  spokeProvider,
}: UseCreateDepositParamsProps): CreateDepositParams | undefined {
  const { sodax } = useSodaxContext();

  if (!spokeProvider) {
    console.error('Spoke provider is required');
    return undefined;
  }

  // Memoize the deposit params for the provided input dependencies
  return useMemo<CreateDepositParams | undefined>(() => {
    if (!spokeProvider) {
      // Prevents unnecessary errors in React render loops by returning undefined when provider is absent.
      return undefined;
    }

    const amountNum = Number.parseFloat(amount);
    if (!amount || amountNum <= 0) {
      return undefined;
    }

    const token = tokenIndex === 0 ? poolData.token0 : poolData.token1;
    const assets = sodax.dex.clService.getAssetsForPool(spokeProvider, poolKey);
    if (!assets) {
      return undefined;
    }

    const originalAsset: OriginalAssetAddress = tokenIndex === 0 ? assets.token0 : assets.token1;

    return {
      asset: originalAsset,
      amount: parseUnits(amount, token.decimals),
      poolToken: token.address,
    } satisfies CreateDepositParams;
  }, [tokenIndex, amount, poolData, poolKey, spokeProvider, sodax]);
}
