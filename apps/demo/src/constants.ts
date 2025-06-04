import {
  ARBITRUM_MAINNET_CHAIN_ID,
  type CustomProvider,
  getHubChainConfig,
  getMoneyMarketConfig,
  type PartnerFee,
  type SodaxConfig,
  type SolverConfigParams,
  SONIC_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type SpokeChainId,
  supportedSpokeChains,
  type Token,
} from '@new-world/sdk';

declare global {
  interface Window {
    hanaWallet: { ethereum: CustomProvider };
  }
}

export const defaultSourceChainId = ARBITRUM_MAINNET_CHAIN_ID;

export function chainIdToChainName(chainId: SpokeChainId): string {
  return spokeChainConfig[chainId].chain.name;
}

export const supportedTokensPerChain: Map<SpokeChainId, Token[]> = new Map(
  supportedSpokeChains.map(chainId => {
    return [chainId, spokeChainConfig[chainId].supportedTokens];
  }),
);

const testnet = import.meta.env.VITE_TESTNET === 'YES';
const hubChainId = SONIC_MAINNET_CHAIN_ID;
const hubRpcUrl = 'https://rpc.soniclabs.com';

const hubConfig = {
  hubRpcUrl,
  chainConfig: getHubChainConfig(hubChainId),
} satisfies SodaxConfig['hubProviderConfig'];

const moneyMarketConfig = getMoneyMarketConfig(hubChainId);

export const partnerFeePercentage = {
  address: '0x0Ab764AB3816cD036Ea951bE973098510D8105A6', // NOTE: replace with actual partner address
  percentage: 100, // 100 basis points = 1%
} satisfies PartnerFee;

export const mainnetSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz',
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
