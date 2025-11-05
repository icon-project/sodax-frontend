import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import BigNumber from 'bignumber.js';
import {
  type AggregatedReserveData,
  SolverIntentStatusCode,
  type SpokeChainId,
  type UserReserveData,
  type XToken,
} from '@sodax/sdk';
import { getSpokeTokenAddressByVault } from '@sodax/dapp-kit';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scaleTokenAmount(amount: number | string, decimals: number): bigint {
  // Return 0n if amount is NaN (for both string and number types)
  if (
    (typeof amount === 'number' && Number.isNaN(amount)) ||
    (typeof amount === 'string' && (amount.trim() === '' || Number.isNaN(Number(amount))))
  ) {
    return 0n;
  }
  return BigInt(
    new BigNumber(amount.toString()).multipliedBy(new BigNumber(10).pow(decimals)).toFixed(0, BigNumber.ROUND_DOWN),
  );
}

export function normaliseTokenAmount(amount: number | string | bigint, decimals: number): string {
  return new BigNumber(amount.toString())
    .dividedBy(new BigNumber(10).pow(decimals))
    .toFixed(decimals, BigNumber.ROUND_DOWN);
}

export function formatTokenAmount(amount: number | string | bigint, decimals: number, displayDecimals = 2): string {
  return new BigNumber(amount.toString())
    .dividedBy(new BigNumber(10).pow(decimals))
    .toFixed(displayDecimals, BigNumber.ROUND_DOWN);
}

export function calculateExchangeRate(amount: BigNumber, toAmount: BigNumber): BigNumber {
  return new BigNumber(1).dividedBy(amount).multipliedBy(toAmount);
}

export function statusCodeToMessage(status: SolverIntentStatusCode): string {
  switch (status) {
    case SolverIntentStatusCode.NOT_FOUND:
      return 'NOT_FOUND';
    case SolverIntentStatusCode.NOT_STARTED_YET:
      return 'NOT_STARTED_YET';
    case SolverIntentStatusCode.SOLVED:
      return 'SOLVED';
    case SolverIntentStatusCode.STARTED_NOT_FINISHED:
      return 'STARTED_NOT_FINISHED';
    case SolverIntentStatusCode.FAILED:
      return 'FAILED';
    default:
      return 'UNKNOWN';
  }
}

// Helper function to format seconds for display
export function formatSeconds(seconds: bigint): string {
  return Number(seconds).toLocaleString();
}

// Helper function to calculate time remaining for unstaking
export function getTimeRemaining(startTime: bigint, unstakingPeriod: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const start = Number(startTime);
  const period = Number(unstakingPeriod);
  const elapsed = now - start;
  const remaining = period - elapsed;

  if (remaining <= 0) {
    return 'Ready to claim';
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m remaining`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

export function findReserveByUnderlyingAsset(
  underlyingAsset: string,
  reserves: readonly AggregatedReserveData[],
): AggregatedReserveData {
  const reserve = reserves.find(reserve => reserve.underlyingAsset.toLowerCase() === underlyingAsset.toLowerCase());
  if (!reserve) {
    throw new Error(`Reserve not found for underlying asset: ${underlyingAsset}`);
  }
  return reserve;
}

export function findUserReserveBySpokeTokenAddress(
  userReserves: readonly UserReserveData[],
  selectedChainId: SpokeChainId,
  token: XToken,
): UserReserveData {
  const result = userReserves.find(
    r => getSpokeTokenAddressByVault(selectedChainId, r.underlyingAsset)?.toLowerCase() === token.address.toLowerCase(),
  );

  if (!result) {
    throw new Error(`User reserve not found for spoke token address: ${token.address}`);
  }
  return result;
}

// Utility function to format numbers according to specified rules
export const formatBalance = (amount: string, price: number): string => {
  if (!amount || amount === '') return '';

  const decimals = price >= 10000 ? 6 : 4;
  if (new BigNumber(amount).isZero()) {
    return '0';
  }
  return new BigNumber(amount).decimalPlaces(decimals, BigNumber.ROUND_FLOOR).toFixed(decimals);
};
