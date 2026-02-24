'use client';

import { useMemo } from 'react';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { useGetUserHubWalletAddress, useBackendAMMNftPositions } from '@sodax/dapp-kit';
import { spokeChainConfig } from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import type { SpokeChainId, XToken } from '@sodax/types';
import { usePoolState } from '../_stores/pool-store-provider';
import type { EnrichedPosition } from '../_mocks';

/**
 * Fetches real AMM NFT positions from the backend API and enriches them
 * for display in the PositionOverview component.
 *
 * Flow:
 * 1. Get spoke address from wallet for the selected chain
 * 2. Derive the hub wallet address (positions live on hub/Sonic)
 * 3. Fetch positions from /amm/nft-positions using the hub address
 * 4. Enrich raw API data into EnrichedPosition[] for the UI
 *
 * On-chain fields (amounts, prices, fees) are placeholders until AMMService exists.
 */
export function usePoolPositions(): {
  positions: EnrichedPosition[];
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

  // Build address→symbol lookup from hub chain token config
  const hubTokenSymbols = useMemo(() => {
    const map: Record<string, string> = {};
    const sonicConfig = spokeChainConfig[SONIC_MAINNET_CHAIN_ID];
    if (sonicConfig?.supportedTokens) {
      for (const token of Object.values(sonicConfig.supportedTokens)) {
        const xToken = token as XToken;
        if (xToken?.address) {
          map[xToken.address.toLowerCase()] = xToken.symbol;
        }
      }
    }
    return map;
  }, []);

  const positions = useMemo<EnrichedPosition[]>(() => {
    if (!positionsData?.items) return [];

    // Debug: log raw API response
    console.log('[usePoolPositions] raw API data:', JSON.stringify(positionsData, null, 2));
    console.log('[usePoolPositions] hubTokenSymbols:', hubTokenSymbols);

    return positionsData.items.map(item => ({
      tokenId: item.tokenId,
      owner: item.owner,
      poolId200: item.poolId200,
      currency0: item.currency0,
      currency1: item.currency1,
      symbol0: hubTokenSymbols[item.currency0.toLowerCase()] ?? item.currency0,
      symbol1: hubTokenSymbols[item.currency1.toLowerCase()] ?? item.currency1,
      chainId: 'sonic' as const,
      // Placeholder values — requires on-chain AMMService to read real data
      amount0: '0',
      amount1: '0',
      valueUsd: 0,
      earnedFeesUsd: 0,
      priceLower: 0,
      priceUpper: 0,
      inRange: true,
    }));
  }, [positionsData, hubTokenSymbols]);

  return {
    positions,
    isLoading: isHubLoading || isPositionsLoading,
    error: positionsError,
  };
}
