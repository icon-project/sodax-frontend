// apps/web/app/(apps)/pool/_stores/pool-store-provider.tsx
'use client';

import { type ReactNode, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { createPoolStore, type PoolStore } from './pool-store';

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
  const selectedNetworkChainId = usePoolStore(state => state.selectedNetworkChainId);
  const selectedToken = usePoolStore(state => state.selectedToken);
  const minPrice = usePoolStore(state => state.minPrice);
  const maxPrice = usePoolStore(state => state.maxPrice);
  const sodaAmount = usePoolStore(state => state.sodaAmount);
  const xSodaAmount = usePoolStore(state => state.xSodaAmount);
  const isNetworkPickerOpened = usePoolStore(state => state.isNetworkPickerOpened);

  return {
    selectedNetworkChainId,
    selectedToken,
    minPrice,
    maxPrice,
    sodaAmount,
    xSodaAmount,
    isNetworkPickerOpened,
  };
};

export const usePoolActions = () => {
  const setSelectedToken = usePoolStore(state => state.setSelectedToken);
  const setMinPrice = usePoolStore(state => state.setMinPrice);
  const setMaxPrice = usePoolStore(state => state.setMaxPrice);
  const setSodaAmount = usePoolStore(state => state.setSodaAmount);
  const setXSodaAmount = usePoolStore(state => state.setXSodaAmount);
  const setIsNetworkPickerOpened = usePoolStore(state => state.setIsNetworkPickerOpened);
  const resetPoolState = usePoolStore(state => state.resetPoolState);

  return {
    setSelectedToken,
    setMinPrice,
    setMaxPrice,
    setSodaAmount,
    setXSodaAmount,
    setIsNetworkPickerOpened,
    resetPoolState,
  };
};
