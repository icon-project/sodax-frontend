import {
  EvmSpokeProvider,
  spokeChainConfig,
  type SuiSpokeChainConfig,
  SuiSpokeProvider,
  type EvmSpokeChainConfig,
} from '@sodax/sdk';
import type { IEvmWalletProvider, ISuiWalletProvider, SpokeChainId } from '@sodax/types';
import { getXChainType, useWalletProvider } from '@sodax/wallet-sdk';
import { useMemo } from 'react';

export function useSpokeProvider(spokeChainId: SpokeChainId) {
  const xChainType = getXChainType(spokeChainId);
  const walletProvider = useWalletProvider(spokeChainId);
  const spokeProvider = useMemo(() => {
    if (!walletProvider) return undefined;
    if (xChainType === 'EVM') {
      return new EvmSpokeProvider(
        walletProvider as IEvmWalletProvider,
        spokeChainConfig[spokeChainId] as EvmSpokeChainConfig,
      );
    }
    if (xChainType === 'SUI') {
      return new SuiSpokeProvider(
        spokeChainConfig[spokeChainId] as SuiSpokeChainConfig,
        walletProvider as ISuiWalletProvider,
      );
    }
    return undefined;
  }, [walletProvider, xChainType, spokeChainId]);

  return spokeProvider;
}
