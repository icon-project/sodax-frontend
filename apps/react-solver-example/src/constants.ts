import {
  ARBITRUM_MAINNET_CHAIN_ID,
  type CustomProvider,
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
