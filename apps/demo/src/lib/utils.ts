import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import BigNumber from 'bignumber.js';
import { hubAssets, SolverIntentStatusCode, type SpokeChainId } from '@sodax/sdk';

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

export function BigIntMin(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
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

export function getSpokeTokenAddressByVault(chainId: SpokeChainId, vaultAddress: string): string | undefined {
  const chainAssets = hubAssets[chainId];
  if (!chainAssets) return undefined;

  // The KEY in hubAssets is the spoke token address!
  for (const [spokeTokenAddress, info] of Object.entries(chainAssets)) {
    if (info.vault.toLowerCase() === vaultAddress.toLowerCase()) {
      return spokeTokenAddress;
    }
  }
  return undefined;
}

export function getReadableTxError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Something went wrong. Please try again.';
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const message = (error as any)?.shortMessage || (error as any)?.message || '';

  if (message.includes('gas price below minimum')) {
    return 'Network gas fee is too low. Please try again in a moment.';
  }

  if (message.includes('User rejected')) {
    return 'Transaction was rejected in your wallet.';
  }

  return 'Transaction failed. Please try again.';
}

export function createDexTokenIdsStorageKey(chainId: SpokeChainId, userAddress: string): string {
  return `sodax-dex-positions-${chainId}-${userAddress}`;
}

export function saveTokenIdToLocalStorage(userAddress: string, chainId: SpokeChainId, tokenId: string): void {
  const cleanId = tokenId.trim().toLowerCase();
  const positions = getTokenIdsFromLocalStorage(chainId, userAddress);

  const hasDuplicate = positions.some(id => id.trim().toLowerCase() === cleanId);

  if (!hasDuplicate) {
    positions.push(tokenId.trim());
    localStorage.setItem(
      createDexTokenIdsStorageKey(chainId, userAddress),
      positions.join(',')
    );
  } else {
    console.warn(`Token ID ${tokenId} already exists for user ${userAddress}`);
  }
}

export function getTokenIdsFromLocalStorage(chainId: SpokeChainId, userAddress: string): string[] {
  const positions = localStorage.getItem(createDexTokenIdsStorageKey(chainId, userAddress));
  if (!positions) {
    return [];
  }
  return positions.split(',').map(v => v.trim());
}

export function removeTokenIdFromLocalStorage(chainId: SpokeChainId, userAddress: string, tokenId: string): void {
  const positions = getTokenIdsFromLocalStorage(chainId, userAddress);
  if (!positions) {
    return;
  }
  if (positions.includes(tokenId)) {
    positions.splice(positions.indexOf(tokenId), 1);
    localStorage.setItem(`sodax-dex-positions-${userAddress}`, positions.join(','));
  } else {
    console.warn(`Token ID ${tokenId} not found for user ${userAddress}`);
  }
}

export function clearTokenIdsFromLocalStorage(userAddress: string): void {
  localStorage.removeItem(`sodax-dex-positions-${userAddress}`);
}

export function getHealthFactorState(hf: number) {
  if (hf < 1) {
    return { label: 'At risk', className: 'text-negative' };
  }
  if (hf < 2) {
    return { label: 'Moderate Risk', className: 'text-yellow-dark' };
  }
  return { label: 'Low Risk', className: 'text-cherry-soda' };
}
