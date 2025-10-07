import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import BigNumber from 'bignumber.js';
import { SolverIntentStatusCode } from '@sodax/sdk';

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
