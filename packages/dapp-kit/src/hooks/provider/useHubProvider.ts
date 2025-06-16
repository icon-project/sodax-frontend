import { EvmHubProvider, getHubChainConfig, type HubChainId } from '@sodax/sdk';
import { getXChainType } from '@sodax/wallet-sdk';
import { useMemo } from 'react';
import { useSodaxContext } from '../shared/useSodaxContext';

export function useHubProvider(): EvmHubProvider | undefined {
  const { sodax } = useSodaxContext();
  const hubChainId = sodax.config?.hubProviderConfig?.chainConfig.chain.id;
  const hubRpcUrl = sodax.config?.hubProviderConfig?.hubRpcUrl;
  const xChainType = getXChainType(hubChainId);
  const hubProvider = useMemo(() => {
    if (xChainType === 'EVM' && hubChainId && hubRpcUrl) {
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
