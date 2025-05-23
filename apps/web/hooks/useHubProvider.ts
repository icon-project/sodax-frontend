import { EvmHubProvider, getHubChainConfig } from '@new-world/sdk';
import { type XChainId, getXChainType } from '@new-world/xwagmi';
import { useMemo } from 'react';
import { sdkChainIdMap } from './useHubWallet';
import { useWalletProvider } from './useWalletProvider';

export function useHubProvider(xChainId: XChainId): EvmHubProvider | undefined {
  const xChainType = getXChainType(xChainId);
  const walletProvider = useWalletProvider(xChainId);
  const hubProvider = useMemo(() => {
    if (!walletProvider) return undefined;
    if (xChainType === 'EVM') {
      // @ts-ignore
      const hubChainCfg = getHubChainConfig(sdkChainIdMap[xChainId]);

      return new EvmHubProvider(walletProvider, hubChainCfg);
    }
    return undefined;
  }, [walletProvider, xChainType, xChainId]);

  return hubProvider;
}
