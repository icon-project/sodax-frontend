import type { ChainId } from '@sodax/types';
import { useMemo } from 'react';
import { EvmWalletProvider, SuiWalletProvider } from '../wallet-providers';
import { getXChainType } from '../actions';
import { useWalletProviderOptions } from './useWalletProviderOptions';

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
        // @ts-ignore
        const { client, wallet, account } = walletProviderOptions;

        // @ts-ignore
        return new SuiWalletProvider({ client, wallet, account });
      }

      default:
        return undefined;
    }
  }, [xChainType, walletProviderOptions]);
}
