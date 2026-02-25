'use client';

import { useMemo } from 'react';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { useGetUserHubWalletAddress, useBackendAMMNftPositions } from '@sodax/dapp-kit';
import type { SpokeChainId, AMMNftPosition } from '@sodax/types';
import { usePoolState } from '../_stores/pool-store-provider';

/**
 * Fetches raw AMM NFT position identifiers from the backend API.
 * Does NOT enrich with on-chain data — enrichment happens per-card
 * via usePositionInfo in PositionCardWithData.
 *
 * Flow:
 * 1. Get spoke address from wallet for the selected chain
 * 2. Derive the hub wallet address (positions live on hub/Sonic)
 * 3. Fetch position list from /amm/nft-positions using the hub address
 */
export function usePoolPositions(): {
  positions: AMMNftPosition[];
  isLoading: boolean;
  error: Error | null;
} {
  const { selectedChainId } = usePoolState();

  const { address: spokeAddress } = useXAccount(selectedChainId ?? undefined);

  const { data: hubAddress, isLoading: isHubLoading } = useGetUserHubWalletAddress(
    selectedChainId as SpokeChainId | undefined,
    spokeAddress,
  );

  const {
    data: positionsData,
    isLoading: isPositionsLoading,
    error: positionsError,
  } = useBackendAMMNftPositions(
    hubAddress
      ? {
          owner: hubAddress,
          pagination: { offset: 0, limit: 50 },
        }
      : undefined,
  );

  const positions = useMemo<AMMNftPosition[]>(() => {
    if (!positionsData?.items) return [];
    return positionsData.items;
  }, [positionsData]);

  return {
    positions,
    isLoading: isHubLoading || isPositionsLoading,
    error: positionsError,
  };
}
