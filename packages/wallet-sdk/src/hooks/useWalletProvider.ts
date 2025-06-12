import { useMemo } from 'react';
import type { ChainId } from '@sodax/types';
import { useWalletProviderOptions } from './useWalletProviderOptions';
import { EvmWalletProvider, SuiWalletProvider } from '../wallet-providers';
import { getXChainType } from '../actions';

export function useWalletProvider(xChainId: ChainId) {
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
