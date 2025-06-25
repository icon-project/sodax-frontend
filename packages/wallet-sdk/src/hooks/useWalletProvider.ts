import type { ChainId } from '@sodax/types';
import { useMemo } from 'react';
import { EvmWalletProvider, IconWalletProvider, SuiWalletProvider } from '../wallet-providers';
import { getXChainType } from '../actions';
import { useWalletProviderOptions } from './useWalletProviderOptions';
import type { Account, Chain, CustomTransport, HttpTransport, WalletClient, PublicClient } from 'viem';
import type { IconEoaAddress } from '../wallet-providers/IconWalletProvider';
import { InjectiveWalletProvider } from '../wallet-providers/InjectiveWalletProvider';
import type { InjectiveEoaAddress } from '@sodax/types';
import type { ChainGrpcWasmApi } from '@injectivelabs/sdk-ts';

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

      case 'ICON': {
        const { walletAddress, rpcUrl } = walletProviderOptions;

        return new IconWalletProvider({
          walletAddress: walletAddress as IconEoaAddress | undefined,
          rpcUrl: rpcUrl as `http${string}`,
        });
      }

      case 'INJECTIVE': {
        const { walletAddress, client, chainGrpcWasmApi } = walletProviderOptions;
        return new InjectiveWalletProvider({
          walletAddress: walletAddress as InjectiveEoaAddress | undefined,
          client: client,
          chainGrpcWasmApi: chainGrpcWasmApi as ChainGrpcWasmApi,
        });
      }

      default:
        return undefined;
    }
  }, [xChainType, walletProviderOptions]);
}
