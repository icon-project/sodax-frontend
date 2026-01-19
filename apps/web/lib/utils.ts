import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { isAddress as isEvmAddress, parseUnits, formatUnits } from 'viem';
import { PublicKey } from '@solana/web3.js';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { StrKey } from '@stellar/stellar-sdk';
import { bech32 } from 'bech32';
import BigNumber from 'bignumber.js';

import { getSupportedSolverTokens, supportedSpokeChains, moneyMarketSupportedTokens } from '@sodax/sdk';

import type { Token, XToken, SpokeChainId } from '@sodax/types';
import { INJECTIVE_MAINNET_CHAIN_ID, hubAssets } from '@sodax/types';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import type { ChainBalanceEntry } from '@/hooks/useAllChainBalances';

import { availableChains } from '@/constants/chains';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

function isValidInjectiveAddress(addr: string): boolean {
  try {
    return bech32.decode(addr).prefix === 'inj';
  } catch {
    return false;
  }
}

function isValidIconAddress(addr: string): boolean {
  return /^h[ cx]/.test(addr);
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

function normalizeToken(token: Token): Token {
  if (token.symbol === 'bnUSD (legacy)') {
    return { ...token, symbol: 'bnUSD' };
  }
  return token;
}

export const getAllSupportedSolverTokens = (): XToken[] => {
  const activeChains = supportedSpokeChains.filter(chainId => availableChains.some(chain => chain.id === chainId));

  return activeChains.flatMap(chainId => {
    try {
      const tokens = getSupportedSolverTokens(chainId).map(normalizeToken);

      return tokens.map(token => ({
        ...token,
        xChainId: chainId,
      }));
    } catch (error) {
      console.warn(`Failed to load tokens for chain ${chainId}`, error);
      return [];
    }
  });
};

export const getSupportedSolverTokensForChain = (chainId: SpokeChainId): XToken[] => {
  try {
    const tokens = getSupportedSolverTokens(chainId).map(normalizeToken);

    return tokens.map(token => ({
      ...token,
      xChainId: chainId,
    }));
  } catch (error) {
    console.warn(`Failed to load tokens for chain ${chainId}`, error);
    return [];
  }
};

export const groupTokensBySymbol = (tokens: XToken[]): Record<string, XToken[]> =>
  tokens.reduce<Record<string, XToken[]>>((acc, token) => {
    const key = token.symbol.toLowerCase();
    acc[key] ??= [];
    acc[key].push(token);
    return acc;
  }, {});

export const getUniqueTokenSymbols = (tokens: XToken[]): Array<{ symbol: string; tokens: XToken[] }> =>
  Object.values(groupTokensBySymbol(tokens)).map(group => ({
    symbol: group[0]?.symbol ?? '',
    tokens: group,
  }));

export function getChainBalance(balances: Record<string, ChainBalanceEntry[]>, token: XToken): bigint {
  return balances[token.address]?.find(e => e.chainId === token.xChainId)?.balance ?? 0n;
}

export function hasTokenBalance(balances: Record<string, ChainBalanceEntry[]>, token: XToken): boolean {
  return balances[token.address]?.some(e => e.chainId === token.xChainId) ?? false;
}

/**
 * Checks if a token group has any tokens with a balance greater than zero.
 * @param group - Token group with symbol and tokens array
 * @param balanceMap - Map of balance keys (format: "chainId-address") to balance strings
 * @returns true if any token in the group has a balance > 0
 */
export function hasFunds(group: { symbol: string; tokens: XToken[] }, balanceMap: Map<string, string>): boolean {
  return group.tokens.some(token => {
    const key = `${token.xChainId}-${token.address}`;
    const balance = balanceMap.get(key);
    return balance ? Number(balance) > 0 : false;
  });
}

export const calculateMaxAvailableAmount = (
  balance: bigint,
  tokenDecimals: number,
  solver: { getPartnerFee: (amount: bigint) => bigint },
): string => {
  if (balance === 0n) return '0';

  try {
    const balanceBigInt = parseUnits(formatUnits(balance, tokenDecimals), tokenDecimals);
    const available = balanceBigInt - solver.getPartnerFee(balanceBigInt);
    return available > 0n ? formatUnits(available, tokenDecimals) : '0';
  } catch (error) {
    console.error('Max amount calc failed:', error);
    return formatUnits(balance, tokenDecimals);
  }
};

export const hasSufficientBalanceWithFee = (
  amount: string,
  balance: bigint,
  tokenDecimals: number,
  solver: { getPartnerFee: (amount: bigint) => bigint },
): boolean => {
  if (!amount || Number(amount) <= 0) return false;

  try {
    const value = parseUnits(amount, tokenDecimals);
    return value + solver.getPartnerFee(value) <= balance;
  } catch {
    return parseUnits(amount, tokenDecimals) <= balance;
  }
};

export const formatBalance = (amount: string, price: number): string => {
  if (!amount || new BigNumber(amount).isZero() || Number(amount) < 0) return '0';
  const decimals = price >= 10000 ? 6 : 4;

  const value = new BigNumber(amount);
  return value.isInteger() ? value.toFixed(0) : value.decimalPlaces(decimals, BigNumber.ROUND_FLOOR).toFixed();
};

export const getSwapErrorMessage = (errorCode: string): { title: string; message: string } => {
  const map: Record<string, { title: string; message: string }> = {
    SUBMIT_TX_FAILED: {
      title: 'Transaction failed at source',
      message: 'Your transaction couldn’t be broadcast. Your funds remain unchanged.',
    },
    RELAY_TIMEOUT: {
      title: 'Transaction timed out',
      message: 'We couldn’t broadcast your transaction within the expected timeframe.',
    },
    CREATION_FAILED: {
      title: "Order couldn't be created.",
      message: 'There was a problem with your order. Please check your network and balance.',
    },
    POST_EXECUTION_FAILED: {
      title: 'Transaction failed at destination.',
      message: 'Your funds will return in roughly 5 minutes.',
    },
    INSUFFICIENT_BALANCE: {
      title: 'Insufficient balance',
      message: 'You do not have enough balance to swap.',
    },
    INVALID_SOURCE_AMOUNT: {
      title: 'Invalid source amount',
      message: 'The source amount is invalid.',
    },
  };

  return (
    map[errorCode] ?? {
      title: 'Something went wrong.',
      message: 'We can’t identify the issue right now.',
    }
  );
};

export const STABLECOINS = ['bnUSD', 'USDC', 'USDT'];

export function sortStablecoinsFirst(a: { symbol: string }, b: { symbol: string }): number {
  const aStable = STABLECOINS.includes(a.symbol);
  const bStable = STABLECOINS.includes(b.symbol);
  if (aStable && !bStable) return -1;
  if (!aStable && bStable) return 1;
  return 0;
}

export function flattenTokens(): XToken[] {
  return Object.entries(moneyMarketSupportedTokens)
    .flatMap(([chainId, items]) =>
      items.map((t: Token) =>
        chainId !== INJECTIVE_MAINNET_CHAIN_ID
          ? ({ ...t, xChainId: chainId as SpokeChainId } satisfies XToken)
          : undefined,
      ),
    )
    .filter(Boolean) as XToken[];
}

export function getUniqueByChain(tokens: XToken[]): XToken[] {
  const map = new Map<SpokeChainId, XToken>();
  tokens.forEach(t => {
    if (!map.has(t.xChainId)) map.set(t.xChainId, t);
  });
  return [...map.values()];
}

/**
 * Formats a large number into a compact, human-readable form.
 * Examples:
 *  - 2450000 → "2.45M"
 *  - 1180 → "1.18K"
 *  - 9520000000 → "9.52B"
 */
export function formatCompactNumber(value: string | number | bigint): string {
  const num = typeof value === 'bigint' ? Number(value) : typeof value === 'string' ? Number.parseFloat(value) : value;

  if (!Number.isFinite(num)) return '-';

  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(4).replace(/\.?0+$/, '')}B`;

  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(4).replace(/\.?0+$/, '')}M`;

  if (num >= 1_000) return `${(num / 1_000).toFixed(4).replace(/\.?0+$/, '')}K`;

  return num.toFixed(4);
}

/**
 * Calculates APY (Annual Percentage Yield) for a token based on reserve data.
 * Finds the vault address from hubAssets, matches it with formatted reserves,
 * and calculates APY using the liquidity rate.
 *
 * @param formattedReserves - Array of formatted reserve data with USD values
 * @param isFormattedReservesLoading - Whether reserves are currently loading
 * @param token - The token to calculate APY for
 * @returns Formatted APY string (e.g., "5.25%") or "-" if unavailable
 */
export function calculateAPY(
  formattedReserves: FormatReserveUSDResponse[] | undefined,
  isFormattedReservesLoading: boolean,
  token: XToken,
): string {
  if (isFormattedReservesLoading || !formattedReserves || formattedReserves.length === 0) {
    return '-';
  }

  try {
    const vault = hubAssets[token.xChainId]?.[token.address]?.vault;
    if (!vault) {
      return '-';
    }

    const entry = formattedReserves.find(r => vault.toLowerCase() === r.underlyingAsset.toLowerCase());
    if (!entry) {
      return '-';
    }

    const SECONDS = 31536000;
    const liquidityRate = Number(entry.liquidityRate) / 1e27;
    const apyValue = ((1 + liquidityRate / SECONDS) ** SECONDS - 1) * 100;
    return `${apyValue.toFixed(2)}%`;
  } catch {
    return '-';
  }
}
