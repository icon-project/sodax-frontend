import { EvmSpokeProvider, spokeChainConfig, SuiSpokeProvider, type SpokeChainId } from '@sodax/sdk';
import type { XChainId } from '@sodax/types';
import { getXChainType } from '@sodax/wallet-sdk';
import { useMemo } from 'react';
import { useWalletProvider } from './useWalletProvider';

export function useSpokeProvider(spokeChainId: SpokeChainId) {
  const xChainType = getXChainType(spokeChainId as XChainId);
  const walletProvider = useWalletProvider(spokeChainId as XChainId);
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
