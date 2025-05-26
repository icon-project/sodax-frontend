import {
  EvmSpokeProvider,
  isEvmSpokeChainConfig,
  spokeChainConfig,
  type SpokeChainId,
  type Address,
} from '@new-world/sdk';
import { useMemo } from 'react';
import { type EvmWalletProvider, useWalletProvider } from './useWalletProvider';

export function useSpokeProvider(xChainId: SpokeChainId, address: Address) {
  const chainConfig = spokeChainConfig[xChainId];
  const walletProvider: EvmWalletProvider = useWalletProvider(xChainId, address);

  const spokeProvider = useMemo(() => {
    if (!walletProvider) return undefined;
    if (isEvmSpokeChainConfig(chainConfig)) {
      return new EvmSpokeProvider(walletProvider, chainConfig);
    }
    return undefined;
  }, [walletProvider, chainConfig]);

  return spokeProvider;
}
