import type { ReactNode, ReactElement } from 'react';
import { Sodax, type SodaxConfig, type PartnerFee, type SolverConfig } from '@new-world/sdk';
import {
  getHubChainConfig,
  getMoneyMarketConfig,
  SONIC_MAINNET_CHAIN_ID,
  SONIC_TESTNET_CHAIN_ID,
} from '@new-world/sdk';
import { SodaxContext } from '@/contexts';
import React from 'react';

export const partnerFeePercentage = {
  address: '0x0Ab764AB3816cD036Ea951bE973098510D8105A6', // NOTE: replace with actual partner address
  percentage: 100, // 100 basis points = 1%
} satisfies PartnerFee;

export const solverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz',
  relayerApiEndpoint: 'https://xcall-relay.nw.iconblockchain.xyz',
  partnerFee: partnerFeePercentage, // fee to be paid to the partner address
} satisfies SolverConfig;

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
    solver: solverConfig,
    hubProviderConfig: hubConfig,
  } satisfies SodaxConfig);

  return <SodaxContext.Provider value={{ sodax, testnet, hubChainId, hubRpcUrl }}>{children}</SodaxContext.Provider>;
};
