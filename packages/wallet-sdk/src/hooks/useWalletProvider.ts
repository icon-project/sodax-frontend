import type { ChainId } from '@sodax/types';
import { useMemo } from 'react';
import { EvmWalletProvider, SuiWalletProvider } from '../wallet-providers';
import { getXChainType } from '../actions';
import { useWalletProviderOptions } from './useWalletProviderOptions';
import type { Account, Chain, CustomTransport, HttpTransport, WalletClient, PublicClient } from 'viem';

export function useWalletProvider(xChainId: ChainId) {
  const xChainType = getXChainType(xChainId);
  const walletProviderOptions = useWalletProviderOptions(xChainId);

  return useMemo(() => {
    if (!walletProviderOptions) {
      return undefined;
    }

    switch (xChainType) {
      case 'EVM': {
        const { walletClient, publicClient } = walletProviderOptions as {
          walletClient: WalletClient<CustomTransport | HttpTransport, Chain, Account> | undefined;
          publicClient: PublicClient<CustomTransport | HttpTransport>;
        };

        return new EvmWalletProvider({ walletClient, publicClient });
      }

      case 'SUI': {
        const { client, wallet, account } = walletProviderOptions;

        return new SuiWalletProvider({ client, wallet, account });
      }

      default:
        return undefined;
    }
  }, [xChainType, walletProviderOptions]);
}
