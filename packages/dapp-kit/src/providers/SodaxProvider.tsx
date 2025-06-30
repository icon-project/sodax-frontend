import type { ReactNode, ReactElement } from 'react';
import { EvmHubProvider, getHubChainConfig, Sodax, type SodaxConfig } from '@sodax/sdk';
import { SodaxContext } from '@/contexts';
import React, { useMemo } from 'react';

interface SodaxProviderProps {
  children: ReactNode;
  testnet?: boolean;
  config: SodaxConfig;
}

export const SodaxProvider = ({ children, testnet = false, config }: SodaxProviderProps): ReactElement => {
  const sodax = new Sodax(config);

  const hubChainId = config?.hubProviderConfig?.chainConfig.chain.id;
  const hubRpcUrl = config?.hubProviderConfig?.hubRpcUrl;

  const hubProvider = useMemo(() => {
    if (hubChainId && hubRpcUrl) {
      const hubChainCfg = getHubChainConfig(hubChainId);

      return new EvmHubProvider({
        hubRpcUrl: hubRpcUrl,
        chainConfig: hubChainCfg,
      });
    }
    return undefined;
  }, [hubChainId, hubRpcUrl]);

  return <SodaxContext.Provider value={{ sodax, testnet, hubProvider }}>{children}</SodaxContext.Provider>;
};
