'use client';

import { type ReactNode, createContext, useRef, useContext } from 'react';
import { useStore } from 'zustand';

import { type PoolStore, createPoolStore } from './pool-store';

export type PoolStoreApi = ReturnType<typeof createPoolStore>;

export const PoolStoreContext = createContext<PoolStoreApi | undefined>(undefined);

export interface PoolStoreProviderProps {
  children: ReactNode;
}

export const PoolStoreProvider = ({ children }: PoolStoreProviderProps) => {
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
  const selectedChainId = usePoolStore(state => state.selectedChainId);
  const minPrice = usePoolStore(state => state.minPrice);
  const maxPrice = usePoolStore(state => state.maxPrice);
  const token0Amount = usePoolStore(state => state.token0Amount);
  const token1Amount = usePoolStore(state => state.token1Amount);
  const currentStep = usePoolStore(state => state.currentStep);
  const isNetworkPickerOpened = usePoolStore(state => state.isNetworkPickerOpened);
  const isPositionExpanded = usePoolStore(state => state.isPositionExpanded);
  const chartPeriod = usePoolStore(state => state.chartPeriod);
  const supplyError = usePoolStore(state => state.supplyError);
  const isSwitchingChain = usePoolStore(state => state.isSwitchingChain);
  const isDialogOpen = usePoolStore(state => state.isDialogOpen);
  const reset = usePoolStore(state => state.reset);
  return {
    selectedChainId,
    minPrice,
    maxPrice,
    token0Amount,
    token1Amount,
    currentStep,
    isNetworkPickerOpened,
    isPositionExpanded,
    chartPeriod,
    supplyError,
    isSwitchingChain,
    isDialogOpen,
    reset,
  };
};

export const usePoolActions = () => {
  const setSelectedChainId = usePoolStore(state => state.setSelectedChainId);
  const setMinPrice = usePoolStore(state => state.setMinPrice);
  const setMaxPrice = usePoolStore(state => state.setMaxPrice);
  const setToken0Amount = usePoolStore(state => state.setToken0Amount);
  const setToken1Amount = usePoolStore(state => state.setToken1Amount);
  const setCurrentStep = usePoolStore(state => state.setCurrentStep);
  const setIsNetworkPickerOpened = usePoolStore(state => state.setIsNetworkPickerOpened);
  const setIsPositionExpanded = usePoolStore(state => state.setIsPositionExpanded);
  const setChartPeriod = usePoolStore(state => state.setChartPeriod);
  const setSupplyError = usePoolStore(state => state.setSupplyError);
  const setIsSwitchingChain = usePoolStore(state => state.setIsSwitchingChain);
  const setIsDialogOpen = usePoolStore(state => state.setIsDialogOpen);
  const resetSupplyState = usePoolStore(state => state.resetSupplyState);
  const reset = usePoolStore(state => state.reset);
  return {
    setSelectedChainId,
    setMinPrice,
    setMaxPrice,
    setToken0Amount,
    setToken1Amount,
    setCurrentStep,
    setIsNetworkPickerOpened,
    setIsPositionExpanded,
    setChartPeriod,
    setSupplyError,
    setIsSwitchingChain,
    setIsDialogOpen,
    resetSupplyState,
    reset,
  };
};
