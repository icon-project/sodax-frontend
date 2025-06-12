import type { ReactNode, ReactElement } from 'react';
import { Sodax, type SodaxConfig } from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { SodaxContext } from '@/contexts';
import React from 'react';

interface SodaxProviderProps {
  children: ReactNode;
  testnet?: boolean;
  config: SodaxConfig;
}

export const SodaxProvider = ({ children, testnet = false, config }: SodaxProviderProps): ReactElement => {
  const hubChainId = SONIC_MAINNET_CHAIN_ID;
  const hubRpcUrl = 'https://rpc.soniclabs.com';
  const sodax = new Sodax(config);

  return <SodaxContext.Provider value={{ sodax, testnet, hubChainId, hubRpcUrl }}>{children}</SodaxContext.Provider>;
};
