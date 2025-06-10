import { EvmHubProvider, getHubChainConfig } from '@sodax/sdk';
import { getXChainType } from '@sodax/xwagmi';
import { useMemo } from 'react';
import { useSodaxContext } from '../shared/useSodaxContext';

export function useHubProvider(): EvmHubProvider | undefined {
  const { hubChainId, hubRpcUrl } = useSodaxContext();
  const xChainType = getXChainType(hubChainId);
  const hubProvider = useMemo(() => {
    if (xChainType === 'EVM') {
      // @ts-ignore
      const hubChainCfg = getHubChainConfig(hubChainId);

      if (!hubChainCfg) return undefined;

      return new EvmHubProvider({
        hubRpcUrl: hubRpcUrl,
        chainConfig: hubChainCfg,
      });
    }
    return undefined;
  }, [xChainType, hubChainId, hubRpcUrl]);

  return hubProvider;
}
