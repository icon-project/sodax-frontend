import { getXChainType } from '@/actions';
import { useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import type { ChainId } from '@sodax/types';
import { getWagmiChainId } from '../utils';
import { useXAccount, useXService } from '..';
import type { SuiXService } from '../xchains/sui/SuiXService';
import { CHAIN_INFO, SupportedChainId } from '../xchains/icon/IconXService';
import type { InjectiveXService } from '../xchains/injective/InjectiveXService';

export function useWalletProviderOptions(xChainId: ChainId) {
  const xChainType = getXChainType(xChainId);

  const evmPublicClient = usePublicClient({
    chainId: getWagmiChainId(xChainId),
  });
  const { data: evmWalletClient } = useWalletClient({
    chainId: getWagmiChainId(xChainId),
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
        return {
          walletAddress: xAccount.address,
          client: injectiveXService.msgBroadcastClient,
          chainGrpcWasmApi: injectiveXService.chainGrpcWasmApi,
        };
      }
      default:
        return undefined;
    }
  }, [xChainType, evmPublicClient, evmWalletClient, xService, xAccount]);
}
