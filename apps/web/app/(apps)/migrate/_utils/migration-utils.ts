import BigNumber from 'bignumber.js';
import { parseUnits } from 'viem';
import { getChainName } from '@/constants/chains';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeChainId } from '@sodax/types';

export const normaliseTokenAmount = (amount: number | string | bigint, decimals: number): string => {
  if (!amount || amount === 0n || amount === '0' || Number.isNaN(Number(amount))) {
    return '0';
  }

  return new BigNumber(amount.toString()).dividedBy(new BigNumber(10).pow(decimals)).toFixed(4, BigNumber.ROUND_DOWN);
};

export const calculateMaxAvailableAmount = (balance: bigint, tokenDecimals: number, gasFeeEstimate: bigint): string => {
  if (balance === 0n) {
    return '0';
  }

  try {
    const fullBalance = normaliseTokenAmount(balance, tokenDecimals);
    const fullBalanceBigInt = parseUnits(fullBalance, tokenDecimals);

    // Subtract gas fee from balance
    const availableBalanceBigInt = fullBalanceBigInt - gasFeeEstimate;

    if (availableBalanceBigInt > 0n) {
      return normaliseTokenAmount(availableBalanceBigInt, tokenDecimals);
    }

    return '0';
  } catch (error) {
    console.error('Error calculating max available amount:', error);
    return normaliseTokenAmount(balance, tokenDecimals);
  }
};

// Helper function to get chain display name
export const getChainDisplayName = (chainId: SpokeChainId): string => {
  // Try to get the name from the UI constants first
  const uiName = getChainName(chainId);
  if (uiName) return uiName;

  // Fallback to the provider's chain name
  try {
    return chainIdToChainName(chainId);
  } catch {
    // Final fallback to the chain ID itself
    return chainId;
  }
};
