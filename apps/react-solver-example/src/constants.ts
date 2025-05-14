import { type CustomProvider, spokeChainConfig, type SpokeChainId, supportedSpokeChains, Token } from "@new-world/sdk";

declare global {
  interface Window { hanaWallet: {ethereum: CustomProvider}; }
}

const supportedChainIds: SpokeChainId[] = supportedSpokeChains;

export function chainIdToChainName(chainId: SpokeChainId): string {
  return spokeChainConfig[chainId].chain.name;
}

export const supportedTokensPerChain: Map<SpokeChainId, Token[]> = new Map(
  supportedSpokeChains.map(chainId => {
    return [chainId, spokeChainConfig[chainId].supportedTokens];
  }),
);