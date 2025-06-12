import { EvmSpokeProvider, spokeChainConfig, SuiSpokeProvider, type SpokeChainId } from '@sodax/sdk';
import type { ChainId } from '@sodax/types';
import { getXChainType, useWalletProvider } from '@sodax/wallet-sdk';
import { useMemo } from 'react';

export function useSpokeProvider(spokeChainId: SpokeChainId) {
  const xChainType = getXChainType(spokeChainId as ChainId);
  const walletProvider = useWalletProvider(spokeChainId as ChainId);
  const spokeProvider = useMemo(() => {
    if (!walletProvider) return undefined;
    if (xChainType === 'EVM') {
      // @ts-ignore
      return new EvmSpokeProvider(walletProvider, spokeChainConfig[spokeChainId]);
    }
    if (xChainType === 'SUI') {
      // @ts-ignore
      return new SuiSpokeProvider(spokeChainConfig[spokeChainId], walletProvider);
    }
    return undefined;
  }, [walletProvider, xChainType, spokeChainId]);

  return spokeProvider;
}
