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

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Shortens a blockchain address for display purposes
 * Supports both Ethereum (0x...) and Cosmos (inj1..., osmo1..., etc.) style addresses
 * @param address The full address to shorten
 * @param chars Number of characters to show at the beginning and end (default: 4 for Cosmos, 7 for Ethereum)
 * @returns Shortened address in format "0x1234...5678" or "inj1kq...5d3n"
 */
export function shortenAddress(address: string, chars?: number): string {
  if (!address) return '';

  // For Cosmos-style addresses (start with letters like inj1, osmo1, etc.)
  if (/^[a-z]+\d/.test(address)) {
    const defaultChars = 4;
    const charCount = chars ?? defaultChars;
    return `${address.substring(0, charCount + 2)}...${address.substring(address.length - charCount)}`;
  }

  // For Ethereum-style addresses (start with 0x)
  const defaultChars = 4;
  const charCount = chars ?? defaultChars;
  return `${address.substring(0, charCount + 2)}...${address.substring(address.length - charCount)}`;
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

  // Filter out Nibiru chain from supported chains
  const filteredSupportedChains = supportedSpokeChains.filter(chainId => chainId !== 'nibiru');

  for (const chainId of filteredSupportedChains) {
    try {
      // const supportedTokens = spokeChainConfig[chainId].supportedTokens;
      const supportedTokens = getSupportedSolverTokens(chainId);
      // Filter out legacy tokens to prevent duplicates
      let filteredTokens = supportedTokens;
      filteredTokens.map(token => {
        if (token.symbol === 'bnUSD (legacy)') {
          token.symbol = 'bnUSD';
        }
      });

      if (chainId !== '0x1.icon') filteredTokens = filterLegacyTokens(Object.values(supportedTokens));

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

    let filteredTokens = supportedTokens;

    filteredTokens.map(token => {
      if (token.symbol === 'bnUSD (legacy)') {
        token.symbol = 'bnUSD';
      }
    });

    if (chainId !== '0x1.icon') filteredTokens = filterLegacyTokens(Object.values(supportedTokens));

    return filteredTokens.map((token: Token) => ({
      ...token,
      xChainId: chainId,
    }));
  } catch (error) {
    console.warn(`Failed to get supported tokens for chain ${chainId}:`, error);
    return [];
  }
};

export const getSwapErrorMessage = (errorCode: string): { title: string; message: string } => {
  switch (errorCode) {
    case 'SUBMIT_TX_FAILED':
      return {
        title: 'Transaction failed at source',
        message: 'Your transaction couldn’t be broadcast or was rejected, your balance is unchanged.',
      };
    case 'RELAY_TIMEOUT':
      return {
        title: 'Transaction timed out',
        message: "Your transaction couldn't be broadcast within the allowed time.",
      };
    case 'CREATION_FAILED':
      return {
        title: "Order couldn't be created",
        message: 'Your order seems to be misformated, please check balances and supported chains before trying again.',
      };
    case 'POST_EXECUTION_FAILED':
      return {
        title: 'Transaction failed at destination',
        message:
          'A transaction couldn’t be broadcast or was rejected, your balance will be retrieved within 5 minutes.',
      };
    case 'INSUFFICIENT_BALANCE':
      return {
        title: 'Insufficient balance',
        message: 'You do not have enough balance to swap.',
      };
    case 'INVALID_SOURCE_AMOUNT':
      return {
        title: 'Invalid source amount',
        message: 'The source amount is invalid.',
      };
    case 'INVALID_QUOTED_AMOUNT':
      return {
        title: 'Invalid quoted amount',
        message: 'The quoted amount is invalid.',
      };
    case 'SOURCE_PROVIDER_NOT_AVAILABLE':
      return {
        title: 'Source provider not available',
        message: 'The source provider is not available.',
      };
    case 'SOURCE_ADDRESS_NOT_AVAILABLE':
      return {
        title: 'Source address not available',
        message: 'The source address is not available.',
      };
    case 'DESTINATION_ADDRESS_NOT_AVAILABLE':
      return {
        title: 'Destination address not available',
        message: 'The destination address is not available.',
      };
    case 'QUOTE_NOT_AVAILABLE':
      return {
        title: 'Quote not available',
        message: 'The quote is not available.',
      };
    default:
      return {
        title: 'Sorry, something went wrong',
        message: "We can't identify the issue right now, for help please follow the link below.",
      };
  }
};
