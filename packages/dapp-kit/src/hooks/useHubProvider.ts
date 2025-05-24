import { EvmHubProvider, getHubChainConfig } from '@new-world/sdk';
import { type XChainId, getXChainType } from '@new-world/xwagmi';
import { useMemo } from 'react';
import { sdkChainIdMap } from './useHubWallet';

const IS_TESTNET = true;
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';

export function useHubProvider(xChainId: XChainId): EvmHubProvider | undefined {
  const xChainType = getXChainType(xChainId);
  const hubProvider = useMemo(() => {
    if (xChainType === 'EVM') {
      // @ts-ignore
      const hubChainCfg = getHubChainConfig(sdkChainIdMap[xChainId]);

      if (!hubChainCfg) return undefined;

      return new EvmHubProvider({
        hubRpcUrl: HUB_RPC_URL,
        chainConfig: hubChainCfg,
      });
    }
    return undefined;
  }, [xChainType, xChainId]);

  return hubProvider;
}
