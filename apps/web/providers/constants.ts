import {
  type CustomProvider,
  getHubChainConfig,
  getMoneyMarketConfig,
  type PartnerFee,
  type SodaxConfig,
  type SolverConfigParams,
  spokeChainConfig,
} from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId, ARBITRUM_MAINNET_CHAIN_ID } from '@sodax/types';
import type { RpcConfig } from '@sodax/dapp-kit';

declare global {
  interface Window {
    hanaWallet: { ethereum: CustomProvider };
  }
}

export const defaultSourceChainId = ARBITRUM_MAINNET_CHAIN_ID;

export function chainIdToChainName(chainId: SpokeChainId): string {
  return spokeChainConfig[chainId].chain.name;
}

const testnet = process.env.NEXT_PUBLIC_TESTNET === 'YES';
const hubChainId = SONIC_MAINNET_CHAIN_ID;
const hubRpcUrl = 'https://rpc.soniclabs.com';

const hubConfig = {
  hubRpcUrl,
  chainConfig: getHubChainConfig(hubChainId),
} satisfies SodaxConfig['hubProviderConfig'];

const moneyMarketConfig = getMoneyMarketConfig(hubChainId);

export const partnerFeePercentage = {
  address: '0x93D5CE288b3BF6b33F913b98FD1fA844Acc462d4', // NOTE: replace with actual partner address
  percentage: 10, // 100 basis points = 1%
} satisfies PartnerFee;

export const mainnetSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  partnerFee: partnerFeePercentage, // fee to be paid to the partner address
} satisfies SolverConfigParams;

export const sodaxConfig = {
  hubProviderConfig: hubConfig,
  moneyMarket: moneyMarketConfig,
  solver: mainnetSolverConfig,
  relayerApiEndpoint: testnet
    ? 'https://testnet-xcall-relay.nw.iconblockchain.xyz'
    : 'https://xcall-relay.nw.iconblockchain.xyz',
} satisfies SodaxConfig;

export const rpcConfig: RpcConfig = {
  // EVM chains
  sonic: 'https://rpc.soniclabs.com',
  '0xa86a.avax': 'https://api.avax.network/ext/bc/C/rpc',
  '0xa4b1.arbitrum': 'https://arb1.arbitrum.io/rpc',
  '0x2105.base': 'https://mainnet.base.org',
  '0x38.bsc': 'https://bsc-dataseed1.binance.org',
  '0xa.optimism': 'https://mainnet.optimism.io',
  '0x89.polygon': 'https://polygon-rpc.com',

  // Other chains
  '0x1.icon': 'https://ctz.solidwallet.io/api/v3',
  solana: 'https://api.mainnet-beta.solana.com',
  sui: 'https://fullnode.mainnet.sui.io',
  'injective-1': 'https://sentry.tm.injective.network:26657',
};
