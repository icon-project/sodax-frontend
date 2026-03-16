import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import BigNumber from 'bignumber.js';
import {
  hubAssets,
  moneyMarketSupportedTokens,
  SolverIntentStatusCode,
  supportedSpokeChains,
  spokeChainConfig,
  type XToken,
  type SpokeChainId,
  type ChainId,
} from '@sodax/sdk';
import { getChainUI } from './chains';

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

/**
 * Truncates a decimal string to at most maxDecimals fractional digits (no rounding).
 * Trims trailing zeros. For non-zero values that truncate to "0" (e.g. 0.00005 with 4 decimals),
 * returns a "< threshold" hint instead so the user knows the value is small but non-zero.
 */
export function formatDecimalForDisplay(value: string, maxDecimals: number): string {
  if (value === '0') return '0';
  const [intPart, fracPart = ''] = value.split('.');
  const truncated = fracPart.slice(0, maxDecimals);
  const combined = truncated.length > 0 ? `${intPart}.${truncated}` : intPart;
  const trimmed = combined.replace(/\.?0+$/, '');

  if (trimmed === '0' && Number.parseFloat(value) > 0) {
    const threshold = `0.${'0'.repeat(Math.max(0, maxDecimals - 1))}1`;
    return `<${threshold}`;
  }

  return trimmed;
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

export function getHealthFactorState(hf: number) {
  if (hf < 1) {
    return { label: 'At risk', className: 'text-negative' };
  }
  if (hf < 2) {
    return { label: 'Moderate Risk', className: 'text-yellow-dark' };
  }
  return { label: 'Low Risk', className: 'text-cherry-soda' };
}

export function getChainsWithThisToken(token: XToken) {
  return supportedSpokeChains.filter(chainId =>
    moneyMarketSupportedTokens[chainId].some(t => t.symbol === token.symbol),
  );
}

export function getTokenOnChain(symbol: string, chainId: ChainId): XToken | undefined {
  const normalizedChainId = String(chainId).toLowerCase();

  return Object.values(moneyMarketSupportedTokens)
    .flat()
    .find(t => t.symbol === symbol && t.xChainId === normalizedChainId);
}

export const getChainExplorerTxUrl = (chainId: string, txHash: string): string | undefined => {
  const chain = getChainUI(chainId);
  if (!chain?.explorerTxUrl) return undefined;
  return `${chain.explorerTxUrl}${txHash}`;
};
export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);

  if (abs < 1000) {
    return `$${value.toLocaleString()}`;
  }

  if (abs < 1_000_000) {
    const num = (value / 1000).toFixed(1);
    return `$${trimZeros(num)}K`;
  }

  const num = (value / 1_000_000).toFixed(2);
  return `$${trimZeros(num)}M`;
}

function trimZeros(num: string) {
  return num.replace(/\.?0+$/, '');
}

export function isTxHash(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && value.startsWith('0x');
}

/** Returns the full error message/code for display in MM modals (exact error text). */
export function getMmErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const o = error as { message?: string; code?: string; data?: { payload?: string; error?: unknown } };
    
    // Handle relay timeout errors with a user-friendly message
    if (o.code === 'RELAY_TIMEOUT') {
      const txHash = o.data?.payload;
      if (txHash && typeof txHash === 'string') {
        return `Transaction timed out while waiting for relay. The transaction may still be processing.\n\nTransaction hash: ${txHash}\n\nPlease check the transaction status on the explorer.`;
      }
      return 'Transaction timed out while waiting for relay. The transaction may still be processing. Please check the transaction status on the explorer.';
    }
    
    // Handle submit tx failed errors
    if (o.code === 'SUBMIT_TX_FAILED') {
      return 'Failed to submit transaction to relay. Please try again.';
    }

    // Repay/create intent failed (e.g. deposit simulation reverted on hub with "External call failed")
    if (o.code === 'CREATE_REPAY_INTENT_FAILED') {
      const detail = o.data?.error;
      const msg = typeof detail === 'string' ? detail : '';
      if (msg.includes('External call failed') || msg.includes('Simulation failed')) {
        return 'Repay simulation failed on the hub. The transfer may not be allowed in current state (e.g. contract conditions). Please try again or use a smaller amount.';
      }
      return msg || 'Repay intent could not be created. Please try again.';
    }

    // Generic repay failure (e.g. unexpected throw)
    if (o.code === 'REPAY_UNKNOWN_ERROR') {
      return 'Repay failed. Please try again. If the problem persists, check your balance and allowance.';
    }
    
    const part = o.message ?? o.code;
    if (typeof part === 'string') return part;
  }
  return String(error);
}

/**
 * Gets the native token symbol for a given chain ID (e.g., ETH for Arbitrum, AVAX for Avalanche).
 * Used for displaying gas fee requirements to users.
 */
export function getNativeTokenSymbol(chainId: ChainId): string {
  const config = spokeChainConfig[chainId as SpokeChainId];
  if (!config) return 'native token';
  
  // Find the token with address matching nativeToken (0x0000... for EVM chains)
  const nativeTokenAddress = config.nativeToken;
  const nativeToken = Object.values(config.supportedTokens).find(
    token => token.address.toLowerCase() === nativeTokenAddress.toLowerCase()
  );
  
  return nativeToken?.symbol ?? 'native token';
}
