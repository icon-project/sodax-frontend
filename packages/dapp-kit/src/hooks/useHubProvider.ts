import { EvmHubProvider, getHubChainConfig } from '@new-world/sdk';
import { getXChainType } from '@new-world/xwagmi';
import { useMemo } from 'react';
import { useSodaxContext } from '../hooks/useSodaxContext';

const IS_TESTNET = true;
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';

export function useHubProvider(): EvmHubProvider | undefined {
  const { hubChainId } = useSodaxContext();
  const xChainType = getXChainType(hubChainId);
  const hubProvider = useMemo(() => {
    if (xChainType === 'EVM') {
      // @ts-ignore
      const hubChainCfg = getHubChainConfig(hubChainId);

      if (!hubChainCfg) return undefined;

      return new EvmHubProvider({
        hubRpcUrl: HUB_RPC_URL,
        chainConfig: hubChainCfg,
      });
    }
    return undefined;
  }, [xChainType, hubChainId]);

  return hubProvider;
}
