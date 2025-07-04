import { getXChainType } from '@/actions';
import { useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import type { ChainId } from '@sodax/types';
import { getWagmiChainId } from '../utils';
import { useXAccount, useXService } from '..';
import type { SuiXService } from '../xchains/sui/SuiXService';
import { CHAIN_INFO, SupportedChainId } from '../xchains/icon/IconXService';
import type { InjectiveXService } from '../xchains/injective/InjectiveXService';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';

export function useWalletProviderOptions(xChainId: ChainId | undefined) {
  const xChainType = getXChainType(xChainId);

  const evmPublicClient = usePublicClient({
    chainId: xChainId ? getWagmiChainId(xChainId) : undefined,
  });
  const { data: evmWalletClient } = useWalletClient({
    chainId: xChainId ? getWagmiChainId(xChainId) : undefined,
  });

  const xService = useXService(getXChainType(xChainId));
  const xAccount = useXAccount(xChainId);

  return useMemo(() => {
    switch (xChainType) {
      case 'EVM': {
        return { walletClient: evmWalletClient, publicClient: evmPublicClient };
      }
      case 'SUI': {
        const suiXService = xService as SuiXService;
        return { client: suiXService.suiClient, wallet: suiXService.suiWallet, account: suiXService.suiAccount };
      }
      case 'ICON': {
        return { walletAddress: xAccount.address, rpcUrl: CHAIN_INFO[SupportedChainId.MAINNET].APIEndpoint };
      }
      case 'INJECTIVE': {
        const injectiveXService = xService as InjectiveXService;
        const endpoints = getNetworkEndpoints(Network.Mainnet);

        return {
          walletAddress: xAccount.address,
          client: injectiveXService.msgBroadcastClient,
          rpcUrl: endpoints.rpc,
        };
      }
      default:
        return undefined;
    }
  }, [xChainType, evmPublicClient, evmWalletClient, xService, xAccount]);
}
