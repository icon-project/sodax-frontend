import type { ChainId } from '@sodax/types';
import { useMemo } from 'react';
import { EvmWalletProvider, IconWalletProvider, SuiWalletProvider } from '../wallet-providers';
import { getXChainType } from '../actions';
import type { Account, Chain, CustomTransport, HttpTransport, WalletClient, PublicClient } from 'viem';
import type { IconEoaAddress } from '../wallet-providers/IconWalletProvider';
import { InjectiveWalletProvider } from '../wallet-providers/InjectiveWalletProvider';
import type { InjectiveEoaAddress } from '@sodax/types';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getWagmiChainId } from '../utils';
import { type StellarXService, useXAccount, useXService } from '..';
import type { SuiXService } from '../xchains/sui/SuiXService';
import { CHAIN_INFO, SupportedChainId } from '../xchains/icon/IconXService';
import type { InjectiveXService } from '../xchains/injective/InjectiveXService';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';
import { StellarWalletProvider } from '../wallet-providers/StellarWalletProvider';

export function useWalletProvider(xChainId: ChainId) {
  const xChainType = getXChainType(xChainId);

  // EVM-specific hooks
  const evmPublicClient = usePublicClient({
    chainId: getWagmiChainId(xChainId),
  });
  const { data: evmWalletClient } = useWalletClient({
    chainId: getWagmiChainId(xChainId),
  });

  // Cross-chain hooks
  const xService = useXService(getXChainType(xChainId));
  const xAccount = useXAccount(xChainId);

  return useMemo(() => {
    switch (xChainType) {
      case 'EVM': {
        return new EvmWalletProvider({
          walletClient: evmWalletClient as WalletClient<CustomTransport | HttpTransport, Chain, Account> | undefined,
          publicClient: evmPublicClient as PublicClient<CustomTransport | HttpTransport>,
        });
      }

      case 'SUI': {
        const suiXService = xService as SuiXService;
        const { client, wallet, account } = {
          client: suiXService.suiClient,
          wallet: suiXService.suiWallet,
          account: suiXService.suiAccount,
        };

        return new SuiWalletProvider({ client, wallet, account });
      }

      case 'ICON': {
        const { walletAddress, rpcUrl } = {
          walletAddress: xAccount.address,
          rpcUrl: CHAIN_INFO[SupportedChainId.MAINNET].APIEndpoint,
        };

        return new IconWalletProvider({
          walletAddress: walletAddress as IconEoaAddress | undefined,
          rpcUrl: rpcUrl as `http${string}`,
        });
      }

      case 'INJECTIVE': {
        const injectiveXService = xService as InjectiveXService;
        const endpoints = getNetworkEndpoints(Network.Mainnet);
        const { walletAddress, client, rpcUrl } = {
          walletAddress: xAccount.address,
          client: injectiveXService.msgBroadcastClient,
          rpcUrl: endpoints.rpc,
        };

        return new InjectiveWalletProvider({
          walletAddress: walletAddress as InjectiveEoaAddress | undefined,
          client: client,
          rpcUrl: rpcUrl as string,
        });
      }

      case 'STELLAR': {
        const stellarXService = xService as StellarXService;

        return new StellarWalletProvider({
          type: 'BROWSER_EXTENSION',
          walletsKit: stellarXService.walletsKit,
          network: 'PUBLIC',
        });
      }

      default:
        return undefined;
    }
  }, [xChainType, evmPublicClient, evmWalletClient, xService, xAccount]);
}
