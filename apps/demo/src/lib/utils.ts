import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import BigNumber from 'bignumber.js';
import { SolverIntentStatusCode } from '@sodax/sdk';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
