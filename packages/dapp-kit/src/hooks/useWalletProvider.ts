import { type XChainId, getXChainType, useWalletProviderOptions } from '@new-world/xwagmi';
import { useMemo } from 'react';
import { EvmWalletProvider } from '../wallet-providers';

export function useWalletProvider(xChainId: XChainId) {
  const xChainType = getXChainType(xChainId);
  const walletProviderOptions = useWalletProviderOptions(xChainId);

  return useMemo(() => {
    if (!walletProviderOptions) {
      return undefined;
    }

    switch (xChainType) {
      case 'EVM': {
        const { walletClient, publicClient } = walletProviderOptions;

        // @ts-ignore
        return new EvmWalletProvider({ walletClient, publicClient });
      }
      default:
        return undefined;
    }
  }, [xChainType, walletProviderOptions]);
}
