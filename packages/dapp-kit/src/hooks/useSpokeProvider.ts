import { EvmSpokeProvider, spokeChainConfig, SuiSpokeProvider, type SpokeChainId } from '@new-world/sdk';
import { type XChainId, getXChainType } from '@new-world/xwagmi';
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
    if (xChainType === 'SUI') {
      // @ts-ignore
      return new SuiSpokeProvider(spokeChainConfig[spokeChainId], walletProvider);
    }
    return undefined;
  }, [walletProvider, xChainType, spokeChainId]);

  return spokeProvider;
}
