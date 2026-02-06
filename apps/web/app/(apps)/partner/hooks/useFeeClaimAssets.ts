import { useMemo } from 'react';
import { formatUnits } from 'viem';

import { useFeeClaimBalances } from './useFeeClaimBalances';
import { useFeeClaimPreferences } from './useFeeClaimPreferences';

import type { Address, XToken } from '@sodax/types';
import type { PartnerFeeClaimAssetBalance } from '@sodax/sdk';
import { MIN_PARTNER_CLAIM_USD_AMOUNT } from '@/constants/partner-claim';
import { FeeClaimAssetStatus } from '../utils/fee-claim';

export type FeeClaimAsset = {
  sdkAsset: PartnerFeeClaimAssetBalance;
  currency: XToken;
  balance: bigint;
  displayBalance: string;
  status: FeeClaimAssetStatus;
  requiresApproval: boolean;
  usdEstimate?: number | null;
};

/**
 * Transforms raw SDK balances into UI-ready partner fee assets.
 *
 * WHAT IT DOES:
 * - Formats balances for display
 * - Applies minimum claim amount rules
 * - Decides each asset's "claim status"
 *
 * WHAT IT DOES NOT DO:
 * - Does not trigger claims
 * - Does not approve tokens
 * - Does not handle UI interactions
 *
 * Think of this as:
 * "Given balances + preferences, what state is each asset in?"
 */
export function useFeeClaimAssets(address?: Address) {
  const balancesQuery = useFeeClaimBalances(address);
  const prefsQuery = useFeeClaimPreferences(address);

  const assets = useMemo(() => {
    if (!balancesQuery.data) return [];

    return Array.from(balancesQuery.data.values()).map(asset => {
      const rawFormattedBalance = formatUnits(asset.balance, asset.decimal);
      const hasPrefs = !!prefsQuery.data;

      // --- Calculate USD Estimate ---
      let usdEstimate: number | null = null;
      const balanceNum = Number(rawFormattedBalance);

      if (asset.symbol.toLowerCase().includes('usd')) {
        usdEstimate = balanceNum; // Stablecoins are 1:1
      } else if (asset.usdPrice != null) {
        usdEstimate = balanceNum * asset.usdPrice;
      }

      // --- Determine Status based on USD Value ---
      let status: FeeClaimAssetStatus = FeeClaimAssetStatus.READY;

      if (asset.balance === 0n) {
        status = FeeClaimAssetStatus.CLAIMED;
      } else if (!hasPrefs) {
        status = FeeClaimAssetStatus.NO_PREFS;
      }
      // Check against the $10 threshold
      else if (usdEstimate !== null && usdEstimate < MIN_PARTNER_CLAIM_USD_AMOUNT) {
        status = FeeClaimAssetStatus.BELOW_MIN;
      }
      // If price is unknown (null), you might want a fallback
      // or let it be READY so users can try to claim anyway
      else if (usdEstimate === null) {
        status = FeeClaimAssetStatus.READY;
      }

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
        displayBalance: rawFormattedBalance ? Number(rawFormattedBalance).toFixed(4) : '0.0000',
        status,
        requiresApproval: true,
        usdEstimate,
      };
    });
  }, [balancesQuery.data, prefsQuery.data]);

  return {
    assets,
    isLoading: balancesQuery.isLoading || prefsQuery.isLoading,
    refetch: balancesQuery.refetch,
  };
}
