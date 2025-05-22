// const avalancheFujiEvmSpokeProvider = useMemo(
//   () =>
//     avalancheFujiEvmWallet ? new EvmSpokeProvider(avalancheFujiEvmWallet, avalancheFujiSpokeChainConfig) : undefined,
//   [avalancheFujiEvmWallet],
// );

import { EvmSpokeProvider, spokeChainConfig } from '@new-world/sdk';
import { type XChainId, getXChainType } from '@new-world/xwagmi';
import { useMemo } from 'react';
import { sdkChainIdMap } from './useHubWallet';
import { useWalletProvider } from './useWalletProvider';
export function useSpokeProvider(xChainId: XChainId) {
  const xChainType = getXChainType(xChainId);
  const walletProvider = useWalletProvider(xChainId);
  const spokeProvider = useMemo(() => {
    if (!walletProvider) return undefined;
    if (xChainType === 'EVM') {
      // @ts-ignore
      return new EvmSpokeProvider(walletProvider, spokeChainConfig[sdkChainIdMap[xChainId]]);
    }
    return undefined;
  }, [walletProvider, xChainType, xChainId]);

  return spokeProvider;
}
