import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isAddress as isEvmAddress, parseUnits } from 'viem';
import { PublicKey } from '@solana/web3.js';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { StrKey } from '@stellar/stellar-sdk';
import { bech32 } from 'bech32';
import BigNumber from 'bignumber.js';

import { getSupportedSolverTokens, supportedSpokeChains, isLegacybnUSDToken, isNewbnUSDToken } from '@sodax/sdk';
import type { XToken, SpokeChainId, Token } from '@sodax/types';
import { formatUnits } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

import { availableChains } from '@/constants/chains';

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
  const filteredSupportedChains = supportedSpokeChains.filter(chainId =>
    availableChains.find(chain => chain.id === chainId),
  );

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

      if (chainId !== '0x1.icon') {
        filteredTokens = filterLegacyTokens(Object.values(supportedTokens));
      }

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

    if (chainId !== '0x1.icon') {
      filteredTokens = filterLegacyTokens(Object.values(supportedTokens));
    }

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
        message: 'Your transaction couldn’t be broadcast. Your funds remain unchanged.',
      };
    case 'RELAY_TIMEOUT':
      return {
        title: 'Transaction timed out',
        message: 'We couldn’t broadcast your transaction within the expected timeframe.',
      };
    case 'CREATION_FAILED':
      return {
        title: "Order couldn't be created.",
        message: 'There was a problem with your order. Please check your network and balance.',
      };
    case 'POST_EXECUTION_FAILED':
      return {
        title: 'Transaction failed at destination.',
        message: "The transaction couldn't be broadcast. Your funds will return in roughly 5 minutes.",
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
    default:
      return {
        title: 'Something went wrong.',
        message: 'We can’t identify the issue right now. For help, follow the link below.',
      };
  }
};

function isValidInjectiveAddress(addr: string) {
  try {
    const dec = bech32.decode(addr);
    return dec.prefix === 'inj'; // or other valid prefix
  } catch {
    return false;
  }
}

function isValidIconAddress(addr: string) {
  if (!/^h[ cx]/.test(addr)) return false;
  // Additional checks via ICON SDK can go here.
  return true;
}

export function validateChainAddress(address: string | null | undefined, chain: string): boolean {
  if (!address) return false;
  try {
    switch (chain) {
      case 'EVM':
        return isEvmAddress(address);
      case 'SOLANA':
        new PublicKey(address);
        return true;
      case 'SUI':
        return isValidSuiAddress(address);
      case 'STELLAR':
        return StrKey.isValidEd25519PublicKey(address);
      case 'INJECTIVE':
        return isValidInjectiveAddress(address);
      case 'ICON':
        return isValidIconAddress(address);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export const calculateMaxAvailableAmount = (
  balance: bigint,
  tokenDecimals: number,
  solver: { getPartnerFee: (amount: bigint) => bigint },
): string => {
  if (balance === 0n) {
    return '0';
  }

  try {
    const fullBalance = formatUnits(balance, tokenDecimals);
    const fullBalanceBigInt = parseUnits(fullBalance, tokenDecimals);
    const feeAmount = solver.getPartnerFee(fullBalanceBigInt);

    const availableBalanceBigInt = fullBalanceBigInt - feeAmount;

    if (availableBalanceBigInt > 0n) {
      return formatUnits(availableBalanceBigInt, tokenDecimals);
    }

    return '0';
  } catch (error) {
    console.error('Error calculating max available amount:', error);
    return formatUnits(balance, tokenDecimals);
  }
};

export const hasSufficientBalanceWithFee = (
  amount: string,
  balance: bigint,
  tokenDecimals: number,
  solver: { getPartnerFee: (amount: bigint) => bigint },
): boolean => {
  if (!amount || amount === '0' || amount === '' || Number.isNaN(Number(amount))) {
    return false;
  }

  try {
    const amountBigInt = parseUnits(amount, tokenDecimals);
    const feeAmount = solver.getPartnerFee(amountBigInt);
    const totalRequired = amountBigInt + feeAmount;

    return totalRequired <= balance;
  } catch (error) {
    console.error('Error checking sufficient balance with fee:', error);
    const amountBigInt = parseUnits(amount, tokenDecimals);
    return amountBigInt <= balance;
  }
};

// Utility function to format numbers according to specified rules
export const formatBalance = (amount: string, price: number): string => {
  if (!amount || amount === '') return '';

  const decimals = price >= 10000 ? 6 : 4;
  if (new BigNumber(amount).isZero()) {
    return '0';
  }
  return new BigNumber(amount).decimalPlaces(decimals, BigNumber.ROUND_FLOOR).toFixed(decimals);
};
