import type { ReactNode, ReactElement } from 'react';
import { Sodax, type SodaxConfig } from '@new-world/sdk';
import { SONIC_MAINNET_CHAIN_ID, SONIC_TESTNET_CHAIN_ID } from '@new-world/sdk';
import { SodaxContext } from '@/contexts';
import React from 'react';

interface SodaxProviderProps {
  children: ReactNode;
  testnet?: boolean;
  config: SodaxConfig;
}

export const SodaxProvider = ({ children, testnet = false, config }: SodaxProviderProps): ReactElement => {
  const hubChainId = testnet ? SONIC_TESTNET_CHAIN_ID : SONIC_MAINNET_CHAIN_ID;
  const hubRpcUrl = testnet ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';
  const sodax = new Sodax(config);

  return <SodaxContext.Provider value={{ sodax, testnet, hubChainId, hubRpcUrl }}>{children}</SodaxContext.Provider>;
};
