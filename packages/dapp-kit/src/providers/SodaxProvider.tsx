import type { ReactNode, ReactElement } from 'react';
import React from 'react';

import { Sodax, type SodaxConfig } from '@sodax/sdk';
import { SodaxContext } from '@/contexts';
import type { RpcConfig } from '@sodax/types';

interface SodaxProviderProps {
  children: ReactNode;
  testnet?: boolean;
  config?: SodaxConfig;
  rpcConfig: RpcConfig;
}

export const SodaxProvider = ({ children, testnet = false, config, rpcConfig }: SodaxProviderProps): ReactElement => {
  const sodax = new Sodax(config);

  return <SodaxContext.Provider value={{ sodax, testnet, rpcConfig }}>{children}</SodaxContext.Provider>;
};
