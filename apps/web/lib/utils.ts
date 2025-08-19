import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import {
  getSupportedSolverTokens,
  supportedSpokeChains,
  spokeChainConfig,
  isLegacybnUSDToken,
  isNewbnUSDToken,
} from '@sodax/sdk';
import type { XToken, SpokeChainId, Token } from '@sodax/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Filter out legacy tokens to prevent duplicates
 * Uses SDK utilities to identify legacy tokens and only includes current versions
 * @param tokens Array of tokens to filter
 * @returns Filtered array with legacy tokens removed
 */
const filterLegacyTokens = (tokens: readonly Token[]): Token[] => {
  return tokens.filter((token: Token) => {
    // Use SDK utilities to identify legacy tokens
    const isLegacy = isLegacybnUSDToken(token);
    const isNew = isNewbnUSDToken(token);

    // For bnUSD tokens, only include the new version
    if (token.symbol === 'bnUSD') {
      return isNew && !isLegacy;
    }

    // For other tokens, exclude legacy versions
    return !isLegacy;
  });
};

/**
 * Get all supported solver tokens from all chains
 * Filters out legacy tokens to prevent duplicates
 * @returns Array of XToken objects with chain information
 */
export const getAllSupportedSolverTokens = (): XToken[] => {
  const allTokens: XToken[] = [];

  for (const chainId of supportedSpokeChains) {
    try {
      const supportedTokens = spokeChainConfig[chainId].supportedTokens;

      // Filter out legacy tokens to prevent duplicates
      const filteredTokens = filterLegacyTokens(Object.values(supportedTokens));

      const xTokens: XToken[] = filteredTokens.map((token: Token) => ({
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
 * Filters out legacy tokens to prevent duplicates
 * @param chainId The chain ID to get tokens for
 * @returns Array of XToken objects for the specified chain
 */
export const getSupportedSolverTokensForChain = (chainId: SpokeChainId): XToken[] => {
  try {
    const supportedTokens = getSupportedSolverTokens(chainId);

    // Filter out legacy tokens to prevent duplicates
    const filteredTokens = filterLegacyTokens(supportedTokens);

    return filteredTokens.map((token: Token) => ({
      ...token,
      xChainId: chainId,
    }));
  } catch (error) {
    console.warn(`Failed to get supported tokens for chain ${chainId}:`, error);
    return [];
  }
};
