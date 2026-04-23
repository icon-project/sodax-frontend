// apps/web/app/(apps)/pool/_stores/pool-store-provider.tsx
'use client';

import { type ReactNode, createContext, useContext, useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import { createPoolStore, type PoolStore } from './pool-store';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId } from '@sodax/types';
import { usePoolData } from '@sodax/dapp-kit';
import { dexPools } from '@sodax/sdk';

const PRICE_FALLBACK = 1;

export type PoolStoreApi = ReturnType<typeof createPoolStore>;

export const PoolStoreContext = createContext<PoolStoreApi | undefined>(undefined);

export interface PoolStoreProviderProps {
  children: ReactNode;
}

export const PoolStoreProvider = ({ children }: PoolStoreProviderProps): React.JSX.Element => {
  const storeRef = useRef<PoolStoreApi | null>(null);

  if (storeRef.current === null) {
    storeRef.current = createPoolStore();
  }

  return <PoolStoreContext.Provider value={storeRef.current}>{children}</PoolStoreContext.Provider>;
};

export const usePoolStore = <T,>(selector: (store: PoolStore) => T): T => {
  const poolStoreContext = useContext(PoolStoreContext);

  if (!poolStoreContext) {
    throw new Error('usePoolStore must be used within PoolStoreProvider');
  }

  return useStore(poolStoreContext, selector);
};

export const usePoolState = () => {
  const selectedToken = usePoolStore(state => state.selectedToken);
  const rawMinPrice = usePoolStore(state => state.minPrice);
  const rawMaxPrice = usePoolStore(state => state.maxPrice);
  const sodaAmount = usePoolStore(state => state.sodaAmount);
  const xSodaAmount = usePoolStore(state => state.xSodaAmount);
  const isNetworkPickerOpened = usePoolStore(state => state.isNetworkPickerOpened);
  const isManagePositionDialogOpen = usePoolStore(state => state.isManagePositionDialogOpen);
  const selectedChainId = (selectedToken?.xChainId as SpokeChainId | undefined) ?? SONIC_MAINNET_CHAIN_ID;

  const { data: poolData } = usePoolData({ poolKey: dexPools.ASODA_XSODA });
  const currentPairPrice = useMemo((): number | null => {
    if (!poolData) {
      return null;
    }
    const parsed = Number(poolData.price.toSignificant(6));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [poolData]);

  const minPrice = rawMinPrice ?? currentPairPrice ?? PRICE_FALLBACK;
  const maxPrice = rawMaxPrice ?? currentPairPrice ?? PRICE_FALLBACK;

  return {
    selectedChainId,
    selectedToken,
    minPrice,
    maxPrice,
    sodaAmount,
    xSodaAmount,
    isNetworkPickerOpened,
    isManagePositionDialogOpen,
  };
};

export const usePoolActions = () => {
  const setSelectedToken = usePoolStore(state => state.setSelectedToken);
  const setMinPrice = usePoolStore(state => state.setMinPrice);
  const setMaxPrice = usePoolStore(state => state.setMaxPrice);
  const setSodaAmount = usePoolStore(state => state.setSodaAmount);
  const setXSodaAmount = usePoolStore(state => state.setXSodaAmount);
  const setIsNetworkPickerOpened = usePoolStore(state => state.setIsNetworkPickerOpened);
  const setIsManagePositionDialogOpen = usePoolStore(state => state.setIsManagePositionDialogOpen);
  const resetPoolState = usePoolStore(state => state.resetPoolState);

  return {
    setSelectedToken,
    setMinPrice,
    setMaxPrice,
    setSodaAmount,
    setXSodaAmount,
    setIsNetworkPickerOpened,
    setIsManagePositionDialogOpen,
    resetPoolState,
  };
};
