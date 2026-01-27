import { useMemo } from 'react';
import { formatUnits, parseUnits } from 'viem';

import { useFeeClaimBalances } from './useFeeClaimBalances';
import { useFeeClaimPreferences } from './useFeeClaimPreferences';

import type { Address, XToken } from '@sodax/types';
import type { AssetBalance } from '@sodax/sdk';
import { MIN_PARTNER_CLAIM_AMOUNT } from '@/constants/partner-claim';

export enum FeeClaimAssetStatus {
  NO_PREFS = 'NO_PREFS',
  BELOW_MIN = 'BELOW_MIN',
  READY = 'READY',
}

export type FeeClaimAsset = {
  sdkAsset: AssetBalance;
  currency: XToken;
  balance: bigint;
  displayBalance: string;
  status: FeeClaimAssetStatus;
  requiresApproval: boolean;
};

const USDC_SYMBOL = 'USDC';

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

    return (
      Array.from(balancesQuery.data.values())
        .map(asset => {
          const isUSDC = asset.symbol === USDC_SYMBOL;
          const minClaimAmount = parseUnits(MIN_PARTNER_CLAIM_AMOUNT.toString(), asset.decimal);

          const rawFormattedBalance = formatUnits(asset.balance, asset.decimal);
          const hasPrefs = !!prefsQuery.data;

          /**
           * Asset status meaning:
           * - NO_PREFS   → user must set destination first
           * - BELOW_MIN  → balance exists but too small to claim
           * - READY      → can proceed with approval / claim
           */
          let status: FeeClaimAssetStatus = FeeClaimAssetStatus.READY;

          if (!hasPrefs && !isUSDC) {
            status = FeeClaimAssetStatus.NO_PREFS;
          } else if (asset.balance < minClaimAmount) {
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
            displayBalance: rawFormattedBalance ? Number(rawFormattedBalance).toFixed(4) : '-',

            status,
            // Approval is a separate concern handled elsewhere
            requiresApproval: true,
          };
        })
        // Hide zero-balance assets from the UI
        .filter(asset => Number(asset.displayBalance) > 0)
    );
  }, [balancesQuery.data, prefsQuery.data]);

  return {
    assets,
    isLoading: balancesQuery.isLoading || prefsQuery.isLoading,
    refetch: balancesQuery.refetch,
  };
}
