'use client';

import { getSupportedSolverTokens, SONIC_MAINNET_CHAIN_ID, type XToken } from '@sodax/types';
import { useXBalances } from '@sodax/wallet-sdk-react';
import { formatUnits } from 'viem';

/**
 * Hook to manage partner fee data.
 * Handles fetching all supported tokens and getting balances.
 */

type PartnerFeeBalance = {
  currency: XToken;
  balance: string;
};

type UsePartnerFeesResult = {
  balances: PartnerFeeBalance[];
  isLoading: boolean;
  refetch: () => Promise<void>;
  error?: unknown;
};

export function usePartnerFees(address?: string | null): UsePartnerFeesResult {
  const xChainId = SONIC_MAINNET_CHAIN_ID;
  const tokens = getSupportedSolverTokens(xChainId) as XToken[];

  const query = useXBalances({
    xChainId: xChainId,
    xTokens: tokens,
    address: address || '',
  });

  if (!address) {
    return {
      balances: [],
      isLoading: false,
      refetch: async () => {},
      error: 'Wallet not connected',
    };
  }

  const { data: rawBalances, isLoading, error, refetch } = query;

  const safeRefetch = async () => {
    try {
      await refetch?.();
    } catch (err) {
      console.error('Failed to refetch balances:', err);
    }
  };

  //if data isn't ready yet, return empty array
  if (!rawBalances) {
    return { balances: [], isLoading, refetch: safeRefetch, error };
  }

  const balances = tokens.map(token => {
    const rawValue = rawBalances[token.address] || 0n;

    const formattedValue = formatUnits(rawValue, token.decimals);

    return {
      currency: token,
      balance: formattedValue,
    };
  });

  return { balances, isLoading, refetch: safeRefetch, error };
}
