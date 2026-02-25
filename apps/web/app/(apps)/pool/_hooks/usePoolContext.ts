'use client';

import { useMemo } from 'react';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { usePools, usePoolData, usePoolBalances, useSpokeProvider, useSodaxContext } from '@sodax/dapp-kit';
import type { PoolData, PoolKey, SpokeProvider, PoolSpokeAssets } from '@sodax/sdk';
import { dexPools } from '@sodax/sdk';
import { usePoolState } from '../_stores/pool-store-provider';
import type { ChainId } from '@sodax/types';

// Default pool: SODA/xSODA
const DEFAULT_POOL_CURRENCY0 = dexPools.ASODA_XSODA.currency0.toLowerCase();
const DEFAULT_POOL_CURRENCY1 = dexPools.ASODA_XSODA.currency1.toLowerCase();

/**
 * Centralized hook that provides real pool data from the SDK.
 * Replaces all mock pool config usage across pool components.
 *
 * Uses: usePools() for available pools, usePoolData() for on-chain state,
 * usePoolBalances() for user deposit balances, useSpokeProvider() for tx signing.
 */
export function usePoolContext() {
  const { selectedChainId, selectedPoolIndex } = usePoolState();

  // Wallet
  const { address: spokeAddress } = useXAccount(selectedChainId ?? undefined);
  const walletProvider = useWalletProvider(selectedChainId ?? undefined);
  const spokeProvider = useSpokeProvider(selectedChainId ?? undefined, walletProvider) as SpokeProvider | null;

  // Pool list (cached indefinitely — pool list is static)
  const { data: pools = [], isLoading: isLoadingPools } = usePools();

  // Selected pool key — default to SODA/xSODA pool
  const selectedPoolKey: PoolKey | null = useMemo(() => {
    if (pools.length === 0) return null;

    // If user explicitly selected a pool (non-zero index), use it
    if (selectedPoolIndex > 0 && pools[selectedPoolIndex]) {
      return pools[selectedPoolIndex];
    }

    // Default: find SODA/xSODA pool
    const sodaPool = pools.find(
      pk =>
        pk.currency0.toLowerCase() === DEFAULT_POOL_CURRENCY0 && pk.currency1.toLowerCase() === DEFAULT_POOL_CURRENCY1,
    );
    return sodaPool ?? pools[0] ?? null;
  }, [pools, selectedPoolIndex]);

  // On-chain pool data (refetches every 30s)
  const {
    data: poolData,
    isLoading: isLoadingPoolData,
    error: poolDataError,
  } = usePoolData({ poolKey: selectedPoolKey });

  // User's deposit balances for the pool tokens
  const { data: balances } = usePoolBalances({
    poolData: poolData ?? null,
    poolKey: selectedPoolKey,
    spokeProvider,
  });

  const { sodax } = useSodaxContext();

  // Spoke wallet balances (ERC20 balances on spoke chain, not HUB deposits)
  const spokeAssets = useMemo<PoolSpokeAssets | null>(() => {
    if (!spokeProvider || !selectedPoolKey) return null;
    try {
      return sodax.dex.clService.getAssetsForPool(spokeProvider, selectedPoolKey);
    } catch {
      return null;
    }
  }, [sodax, spokeProvider, selectedPoolKey]);

  const xTokens = useMemo(() => (spokeAssets ? [spokeAssets.token0, spokeAssets.token1] : []), [spokeAssets]);

  const { data: walletBalances } = useXBalances({
    xChainId: (selectedChainId ?? 'base') as ChainId,
    xTokens,
    address: spokeAddress,
  });

  return {
    // Pool data
    pools,
    selectedPoolKey,
    poolData: (poolData ?? null) as PoolData | null,
    isLoadingPools,
    isLoadingPoolData,
    poolDataError,

    // User balances on hub
    token0Balance: balances?.token0Balance ?? 0n,
    token1Balance: balances?.token1Balance ?? 0n,

    // Spoke wallet balances (for "Buy SODA" / "Insufficient balance" checks)
    walletToken0Balance: spokeAssets && walletBalances ? (walletBalances[spokeAssets.token0.address] ?? 0n) : 0n,
    walletToken1Balance: spokeAssets && walletBalances ? (walletBalances[spokeAssets.token1.address] ?? 0n) : 0n,
    spokeAssets,

    // Wallet/provider
    spokeAddress,
    spokeProvider,
  };
}
