import { EvmSpokeProvider, spokeChainConfig } from '@new-world/sdk';
import { type XChainId, getXChainType } from '@new-world/xwagmi';
import { useMemo } from 'react';
import { sdkChainIdMap } from './useHubWallet';
import { useWalletProvider } from './useWalletProvider';

export function useSpokeProvider(spokeChainId: XChainId) {
  const xChainType = getXChainType(spokeChainId);
  const walletProvider = useWalletProvider(spokeChainId);
  const spokeProvider = useMemo(() => {
    if (!walletProvider) return undefined;
    if (xChainType === 'EVM') {
      console.log('sdkChainIdMap[xChainId]', sdkChainIdMap[spokeChainId]);
      // @ts-ignore
      return new EvmSpokeProvider(walletProvider, spokeChainConfig[sdkChainIdMap[spokeChainId]]);
    }
    return undefined;
  }, [walletProvider, xChainType, spokeChainId]);

  return spokeProvider;
}
