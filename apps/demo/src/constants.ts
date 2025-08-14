import {
  type CustomProvider,
  getHubChainConfig,
  getMoneyMarketConfig,
  type SodaxConfig,
  type SolverConfigParams,
  spokeChainConfig,
} from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId, ARBITRUM_MAINNET_CHAIN_ID } from '@sodax/types';

declare global {
  interface Window {
    hanaWallet: { ethereum: CustomProvider };
  }
}

export const defaultSourceChainId = ARBITRUM_MAINNET_CHAIN_ID;

export function chainIdToChainName(chainId: SpokeChainId): string {
  return spokeChainConfig[chainId].chain.name;
}

const testnet = import.meta.env.VITE_TESTNET === 'YES';
const hubChainId = SONIC_MAINNET_CHAIN_ID;
const hubRpcUrl = 'https://rpc.soniclabs.com';

const hubConfig = {
  hubRpcUrl,
  chainConfig: getHubChainConfig(hubChainId),
} satisfies SodaxConfig['hubProviderConfig'];

const moneyMarketConfig = getMoneyMarketConfig(hubChainId);

export const stagingSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
} satisfies SolverConfigParams;

export const productionSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver.iconblockchain.xyz',
} satisfies SolverConfigParams;

export const sodaxConfig = {
  hubProviderConfig: hubConfig,
  moneyMarket: moneyMarketConfig,
  solver: stagingSolverConfig,
  relayerApiEndpoint: testnet
    ? 'https://testnet-xcall-relay.nw.iconblockchain.xyz'
    : 'https://xcall-relay.nw.iconblockchain.xyz',
} satisfies SodaxConfig;
