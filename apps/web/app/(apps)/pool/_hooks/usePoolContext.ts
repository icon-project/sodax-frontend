'use client';

import { useMemo } from 'react';
import type { SpokeChainId } from '@sodax/types';
import type { PoolData, PoolSpokeAssets } from '@sodax/sdk';
import {
  useGetUserHubWalletAddress,
  usePoolData,
  useSodaxContext,
  useSpokeProvider,
} from '@sodax/dapp-kit';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { usePoolState } from '../_stores/pool-store-provider';
import { POOL_KEY } from '../_constants';

export type PoolContext = {
  selectedChainId: SpokeChainId | null;
  address: string | undefined;
  hubWalletAddress: string | undefined;
  poolData: PoolData | null;
  poolId: string | null;
  pairPrice: number | null;
  spokeProvider: ReturnType<typeof useSpokeProvider>;
  poolSpokeAssets: PoolSpokeAssets | null;
};

export function usePoolContext(): PoolContext {
  const { selectedToken } = usePoolState();
  const selectedChainId = selectedToken ? (selectedToken.xChainId as SpokeChainId) : null;

  const { address } = useXAccount(selectedChainId as SpokeChainId);
  const { data: hubWalletAddress } = useGetUserHubWalletAddress(selectedChainId as SpokeChainId, address);

  const { data: poolDataRaw } = usePoolData({ poolKey: POOL_KEY });
  const poolData = poolDataRaw ?? null;
  const poolId = poolData?.poolId ?? null;

  const pairPrice = useMemo((): number | null => {
    if (!poolData) {
      return null;
    }
    const parsedPrice = Number(poolData.price.toSignificant(6));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return null;
    }
    return parsedPrice;
  }, [poolData]);

  const { sodax } = useSodaxContext();
  const walletProvider = useWalletProvider(selectedChainId as SpokeChainId);
  const spokeProvider = useSpokeProvider(selectedChainId as SpokeChainId, walletProvider);

  const poolSpokeAssets = useMemo((): PoolSpokeAssets | null => {
    if (!spokeProvider) {
      return null;
    }
    try {
      return sodax.dex.clService.getAssetsForPool(spokeProvider, POOL_KEY);
    } catch {
      return null;
    }
  }, [sodax, spokeProvider]);

  return {
    selectedChainId,
    address,
    hubWalletAddress,
    poolData,
    poolId,
    pairPrice,
    spokeProvider,
    poolSpokeAssets,
  };
}
