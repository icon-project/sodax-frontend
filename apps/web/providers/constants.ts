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
import type { RpcConfig } from '@sodax/types';

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
const hubRpcUrl = 'https://sonic-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg';
// const hubRpcUrl = 'https://rpc.soniclabs.com'; // if rpc is failing, use this in dev mode

const hubConfig = {
  hubRpcUrl,
  chainConfig: getHubChainConfig(),
} satisfies SodaxConfig['hubProviderConfig'];

const moneyMarketConfig = getMoneyMarketConfig(hubChainId);

export const partnerFeePercentage = {
  address: '0x93D5CE288b3BF6b33F913b98FD1fA844Acc462d4', // NOTE: replace with actual partner address
  percentage: 10, // 100 basis points = 1%
} satisfies PartnerFee;

export const mainnetSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  // solverApiEndpoint: 'https://api.sodax.com/v1/intent',
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  partnerFee: partnerFeePercentage, // fee to be paid to the partner address
} satisfies SolverConfigParams;

export const sodaxConfig = {
  hubProviderConfig: hubConfig,
  moneyMarket: moneyMarketConfig,
  swaps: mainnetSolverConfig,
  relayerApiEndpoint: testnet
    ? 'https://testnet-xcall-relay.nw.iconblockchain.xyz'
    : 'https://xcall-relay.nw.iconblockchain.xyz',
} satisfies SodaxConfig;

export const rpcConfig: RpcConfig = {
  // EVM chains
  sonic: 'https://sonic-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',
  '0xa86a.avax': 'https://avax-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',
  '0xa4b1.arbitrum': 'https://arb-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',
  '0x2105.base': 'https://base-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',
  '0x38.bsc': 'https://bnb-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',
  '0xa.optimism': 'https://opt-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',
  '0x89.polygon': 'https://polygon-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',
  ethereum: 'https://eth-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',
  hyper: 'https://hyperliquid-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',

  // evm in dev mode
  // sonic: 'https://sonic-rpc.publicnode.com',
  // '0xa86a.avax': 'https://avalanche-c-chain-rpc.publicnode.com',
  // '0xa4b1.arbitrum': 'https://arbitrum.drpc.org',
  // '0x2105.base': 'https://base.drpc.org',
  // '0x38.bsc': 'https://bsc.drpc.org',
  // '0xa.optimism': 'https://optimism-rpc.publicnode.com',
  // '0x89.polygon': 'https://polygon-bor-rpc.publicnode.com',
  // ethereum: 'https://ethereum-rpc.publicnode.com',
  // hyper: 'https://rpc.hyperliquid.xyz/evm',

  // Other chains
  '0x1.icon': 'https://ctz.solidwallet.io/api/v3',
  solana: 'https://solana-mainnet.g.alchemy.com/v2/fnxOcaJJQBJZeMMFpLqwg',
  sui: 'https://fullnode.mainnet.sui.io',
  'injective-1': 'https://sentry.tm.injective.network:26657',
  stellar: {
    horizonRpcUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://magical-bitter-frost.stellar-mainnet.quiknode.pro/78709b736890cf5a9bcb36e118b9d18e8ecdb7ee',
  },
};
