import { type CustomProvider, type SolverConfigParams, spokeChainConfig } from '@sodax/sdk';
import type { SpokeChainId } from '@sodax/types';

declare global {
  interface Window {
    hanaWallet: { ethereum: CustomProvider };
  }
}

export function chainIdToChainName(chainId: SpokeChainId): string {
  return spokeChainConfig[chainId].chain.name;
}

export const stagingSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
} satisfies SolverConfigParams;

export const productionSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://api.sodax.com/v1/intent',
} satisfies SolverConfigParams;
