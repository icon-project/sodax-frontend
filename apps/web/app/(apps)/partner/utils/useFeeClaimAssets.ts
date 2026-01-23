import { useMemo } from 'react';
import { formatUnits, parseUnits } from 'viem';

import { useFeeClaimBalances } from './useFeeClaimBalances';
import { useFeeClaimPreferences } from './useFeeClaimPreferences';

import type { Address, XToken } from '@sodax/types';
import type { AssetBalance } from '@sodax/sdk';
import { MIN_PARTNER_CLAIM_AMOUNT } from '@/constants/partner-claim';

export type FeeClaimAsset = {
  sdkAsset: AssetBalance;
  currency: XToken;
  balance: bigint;
  displayBalance: string;
  canClaim: boolean;
};

const USDC_SYMBOL = 'USDC';

export function useFeeClaimAssets(address?: Address) {
  const balancesQuery = useFeeClaimBalances(address);
  const prefsQuery = useFeeClaimPreferences(address);

  const assets = useMemo(() => {
    if (!balancesQuery.data) return [];

    return Array.from(balancesQuery.data.values()).map(asset => {
      const isUSDC = asset.symbol === USDC_SYMBOL;
      const minClaimAmount = parseUnits(MIN_PARTNER_CLAIM_AMOUNT.toString(), asset.decimal);
      const rawFormattedBalance = formatUnits(asset.balance, asset.decimal);

      return {
        sdkAsset: asset,
        currency: {
          symbol: asset.symbol,
          name: asset.name,
          address: asset.address as Address,
          decimals: asset.decimal,
          xChainId: asset.originalChain,
        },
        balance: asset.balance,
        displayBalance: rawFormattedBalance ? Number(rawFormattedBalance).toFixed(4) : '-',
        // Logic change: USDC doesn't STRICTLY need prefs to be "claimable" but the SDK 'swap' method might require them.
        isUSDC,
        canClaim: isUSDC ? asset.balance > 0n : !!prefsQuery.data && asset.balance >= minClaimAmount,
      };
    });
  }, [balancesQuery.data, prefsQuery.data]);

  return {
    assets,
    isLoading: balancesQuery.isLoading || prefsQuery.isLoading,
    hasPreferences: !!prefsQuery.data,
    refetch: balancesQuery.refetch,
  };
}
