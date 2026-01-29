import { useMemo } from 'react';
import { formatUnits, parseUnits } from 'viem';

import { useFeeClaimBalances } from './useFeeClaimBalances';
import { useFeeClaimPreferences } from './useFeeClaimPreferences';

import type { Address, XToken } from '@sodax/types';
import type { AssetBalance } from '@sodax/sdk';
import { MIN_PARTNER_CLAIM_AMOUNT } from '@/constants/partner-claim';
import { FeeClaimAssetStatus } from '../utils/fee-claim';

export type FeeClaimAsset = {
  sdkAsset: AssetBalance;
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
      const minClaimAmount = parseUnits(MIN_PARTNER_CLAIM_AMOUNT.toString(), asset.decimal);

      const rawFormattedBalance = formatUnits(asset.balance, asset.decimal);
      const hasPrefs = !!prefsQuery.data;

      let usdEstimate: number | null | undefined = undefined;

      // USD token → leave undefined
      if (!asset.symbol.toLowerCase().includes('usd')) {
        if (asset.usdPrice != null) {
          // non-USD, price known
          usdEstimate = Number(rawFormattedBalance) * asset.usdPrice;
        } else {
          // non-USD, price unknown
          usdEstimate = null;
        }
      }

      let status: FeeClaimAssetStatus = FeeClaimAssetStatus.READY;

      // 1️⃣ Already claimed (balance is zero)
      if (asset.balance === 0n) {
        status = FeeClaimAssetStatus.CLAIMED;
      }
      // 2️⃣ Destination not set (non-USDC)
      else if (!hasPrefs) {
        status = FeeClaimAssetStatus.NO_PREFS;
      }
      // 3️⃣ Below minimum
      else if (asset.balance < minClaimAmount) {
        status = FeeClaimAssetStatus.BELOW_MIN;
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
