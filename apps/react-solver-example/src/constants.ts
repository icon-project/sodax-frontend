import {
  ARBITRUM_MAINNET_CHAIN_ID,
  type CustomProvider,
  type PartnerFee,
  Sodax,
  type SolverConfig,
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

const supportedChainIds: SpokeChainId[] = supportedSpokeChains;

export function chainIdToChainName(chainId: SpokeChainId): string {
  return spokeChainConfig[chainId].chain.name;
}

export const supportedTokensPerChain: Map<SpokeChainId, Token[]> = new Map(
  supportedSpokeChains.map(chainId => {
    return [chainId, spokeChainConfig[chainId].supportedTokens];
  }),
);

export const partnerFeePercentage = {
  address: '0x0Ab764AB3816cD036Ea951bE973098510D8105A6', // NOTE: replace with actual partner address
  percentage: 100, // 100 basis points = 1%
} satisfies PartnerFee;

// NOTE: replace with non-test values
export const solverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz',
  relayerApiEndpoint: 'https://xcall-relay.nw.iconblockchain.xyz',
  partnerFee: partnerFeePercentage, // fee to be paid to the partner address
} satisfies SolverConfig;

// main instance to be used for all SODAX features
export const sodax = new Sodax({
  solver: solverConfig,
});
