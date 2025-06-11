import { getXChainType, useWalletProviderOptions } from '@sodax/wallet-sdk';
import type { XChainId } from '@sodax/types';
import { useMemo } from 'react';
import { EvmWalletProvider, SuiWalletProvider } from '../wallet-providers';

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

      case 'SUI': {
        const { client, wallet, account } = walletProviderOptions;

        // @ts-ignore
        return new SuiWalletProvider({ client, wallet, account });
      }

      default:
        return undefined;
    }
  }, [xChainType, walletProviderOptions]);
}
