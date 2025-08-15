import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { getSupportedSolverTokens, supportedSpokeChains } from '@sodax/sdk';
import type { XToken, SpokeChainId, Token } from '@sodax/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get all supported solver tokens from all chains
 * @returns Array of XToken objects with chain information
 */
export const getAllSupportedSolverTokens = (): XToken[] => {
  const allTokens: XToken[] = [];

  for (const chainId of supportedSpokeChains) {
    try {
      const supportedTokens = getSupportedSolverTokens(chainId);

      const xTokens: XToken[] = supportedTokens.map((token: Token) => ({
        ...token,
        xChainId: chainId,
      }));

      allTokens.push(...xTokens);
    } catch (error) {
      console.warn(`Failed to get supported tokens for chain ${chainId}:`, error);
    }
  }

  return allTokens;
};

/**
 * Get supported solver tokens for a specific chain
 * @param chainId The chain ID to get tokens for
 * @returns Array of XToken objects for the specified chain
 */
export const getSupportedSolverTokensForChain = (chainId: SpokeChainId): XToken[] => {
  try {
    const supportedTokens = getSupportedSolverTokens(chainId);

    return supportedTokens.map((token: Token) => ({
      ...token,
      xChainId: chainId,
    }));
  } catch (error) {
    console.warn(`Failed to get supported tokens for chain ${chainId}:`, error);
    return [];
  }
};
