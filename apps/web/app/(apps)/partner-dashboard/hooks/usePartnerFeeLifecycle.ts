import type { Address } from '@sodax/types';
import { useFeeClaimPreferences } from './useFeeClaimPreferences';
import { useFeeClaimAssets } from './useFeeClaimAssets';
import { useRef } from 'react';

/**
 * High-level lifecycle hook for the Partner Fee Dashboard.
 *
 * WHAT IT DOES:
 * - Combines preferences + assets into one UI-friendly API
 * - Exposes derived page states (loading, refreshing, setup done)
 *
 * WHAT IT DOES NOT DO:
 * - Does not calculate asset eligibility
 * - Does not format balances
 *
 * Think of this as:
 * "Everything the Partner Dashboard page needs."
 */
export function usePartnerFeeLifecycle(partnerAddress?: Address) {
  const hasLoadedOnce = useRef(false);

  // 1. Fetch Auto-Swap Settings (Destination Chain/Token)
  const {
    data: activePreferences,
    isFetching: isPrefsSyncing,
    updateMutation,
  } = useFeeClaimPreferences(partnerAddress);
  // 2. Fetch Claimable Balances
  const {
    assets: claimableFees,
    isLoading: isAssetsLoading,
    refetch: refreshBalances,
  } = useFeeClaimAssets(partnerAddress);

  if (!isAssetsLoading) {
    hasLoadedOnce.current = true;
  }
  const hasSetupDestination = updateMutation.isSuccess || !!activePreferences;

  // skeleton ONLY on first load
  const isInitialLoading = !hasLoadedOnce.current && isAssetsLoading;

  const isRefreshing = isPrefsSyncing || updateMutation.isPending;

  return {
    activePreferences,
    claimableFees,
    hasSetupDestination,
    isInitialLoading,
    isRefreshing,
    refreshBalances,
    updateMutation,
  };
}
