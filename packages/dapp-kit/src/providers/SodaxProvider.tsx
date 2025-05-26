import type { ReactNode, ReactElement } from 'react';
import { Sodax, type SodaxConfig } from '@new-world/sdk';
import {
  getHubChainConfig,
  getMoneyMarketConfig,
  SONIC_MAINNET_CHAIN_ID,
  SONIC_TESTNET_CHAIN_ID,
} from '@new-world/sdk';
import { SodaxContext } from '@/contexts';
import React from 'react';

interface SodaxProviderProps {
  children: ReactNode;
  testnet?: boolean;
}

export const SodaxProvider = ({ children, testnet = false }: SodaxProviderProps): ReactElement => {
  const hubChainId = testnet ? SONIC_TESTNET_CHAIN_ID : SONIC_MAINNET_CHAIN_ID;
  const hubRpcUrl = testnet ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';

  const hubConfig = {
    hubRpcUrl,
    chainConfig: getHubChainConfig(hubChainId),
  } satisfies SodaxConfig['hubProviderConfig'];

  const moneyMarketConfig = getMoneyMarketConfig(hubChainId);

  const sodax = new Sodax({
    moneyMarket: moneyMarketConfig,
    hubProviderConfig: hubConfig,
  } satisfies SodaxConfig);

  return <SodaxContext.Provider value={{ sodax, testnet, hubChainId }}>{children}</SodaxContext.Provider>;
};
