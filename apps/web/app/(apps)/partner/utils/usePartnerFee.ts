'use client';

import { getSupportedSolverTokens, SONIC_MAINNET_CHAIN_ID, type XToken } from '@sodax/types';
import { useXBalances } from '@sodax/wallet-sdk-react';
import { useMemo } from 'react';
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
  const tokens = useMemo(() => {
    const result = getSupportedSolverTokens(xChainId) as XToken[];
    console.log('[PartnerFees] supported solver tokens:', result);
    return result;
  }, [xChainId]);

  //always call the hook to avoid conditional hooks
  const {
    data: rawBalances,
    isLoading,
    error,
    refetch,
  } = useXBalances({
    xChainId,
    xTokens: tokens,
    address: address ?? undefined,
  });

  const safeRefetch = async () => {
    try {
      await refetch?.();
    } catch (err) {
      console.error('Failed to refetch balances:', err);
    }
  };

  console.log('[PartnerFees] address used:', address);
  console.log('[PartnerFees] isLoading:', isLoading);
  console.log('[PartnerFees] rawBalances:', rawBalances);

  // loading state
  if (isLoading || !rawBalances) {
    return {
      balances: [],
      isLoading: true,
      refetch: safeRefetch,
      error,
    };
  }

  // data is ready
  const balances = tokens.map(token => {
    const rawValue = rawBalances[token.address];

    return {
      currency: token,
      balance: formatUnits(rawValue ?? 0n, token.decimals),
    };
  });

  return { balances, isLoading, refetch: safeRefetch, error };
}
