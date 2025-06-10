import { getXChainType } from '@/actions';
import { useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import type { XChainId } from '../types';
import { getWagmiChainId } from '../utils';

export function useWalletProviderOptions(xChainId: XChainId) {
  const xChainType = getXChainType(xChainId);

  const evmPublicClient = usePublicClient({
    chainId: getWagmiChainId(xChainId),
  });
  const { data: evmWalletClient } = useWalletClient({
    chainId: getWagmiChainId(xChainId),
  });

  return useMemo(() => {
    switch (xChainType) {
      case 'EVM': {
        return { walletClient: evmWalletClient, publicClient: evmPublicClient };
      }
      default:
        return undefined;
    }
  }, [xChainType, evmPublicClient, evmWalletClient]);
}
