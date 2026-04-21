'use client';

import { useEffect } from 'react';
import { useDexPositions, type SavedDexPosition } from '@/hooks/useDexPositions';
import { DEX_POSITIONS_UPDATED_EVENT } from '@/lib/utils';
import { usePoolContext } from './usePoolContext';

type DexPositionsUpdatedDetail = {
  chainId: string | number;
  userAddress: string;
};

export type DexPositionsSync = {
  savedPositions: SavedDexPosition[];
};

export function useDexPositionsSync(): DexPositionsSync {
  const { hubWalletAddress, poolId, selectedChainId } = usePoolContext();

  const { savedPositions, refetch: refetchSavedPositions } = useDexPositions({
    hubWalletAddress,
    poolId,
    selectedNetworkChainId: selectedChainId,
  });

  useEffect((): (() => void) => {
    const onDexPositionsUpdated = (event: Event): void => {
      const customEvent = event as CustomEvent<DexPositionsUpdatedDetail>;
      if (!hubWalletAddress) {
        void refetchSavedPositions();
        return;
      }
      const eventAddress = customEvent.detail?.userAddress?.toLowerCase();
      if (eventAddress === hubWalletAddress.toLowerCase()) {
        void refetchSavedPositions();
      }
    };

    globalThis.addEventListener(DEX_POSITIONS_UPDATED_EVENT, onDexPositionsUpdated);
    return (): void => {
      globalThis.removeEventListener(DEX_POSITIONS_UPDATED_EVENT, onDexPositionsUpdated);
    };
  }, [hubWalletAddress, refetchSavedPositions]);

  return { savedPositions };
}
