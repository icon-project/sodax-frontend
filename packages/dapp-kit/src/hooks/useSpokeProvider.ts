import { EvmSpokeProvider, spokeChainConfig, type SpokeChainId } from '@sodax/sdk';
import { type XChainId, getXChainType } from '@sodax/wallet-sdk';
import { useMemo } from 'react';
import { useWalletProvider } from './useWalletProvider';

export function useSpokeProvider(spokeChainId: SpokeChainId) {
  const xChainType = getXChainType(spokeChainId);
  const walletProvider = useWalletProvider(spokeChainId as XChainId);
  const spokeProvider = useMemo(() => {
    if (!walletProvider) return undefined;
    if (xChainType === 'EVM') {
      // @ts-ignore
      return new EvmSpokeProvider(walletProvider, spokeChainConfig[spokeChainId]);
    }
    return undefined;
  }, [walletProvider, xChainType, spokeChainId]);

  return spokeProvider;
}
