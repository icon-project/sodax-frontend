'use client';

import { type ReactNode, createContext, useRef, useContext } from 'react';
import { useStore } from 'zustand';

import { type SwapStore, createSwapStore } from './swap-store';

export type SwapStoreApi = ReturnType<typeof createSwapStore>;

export const SwapStoreContext = createContext<SwapStoreApi | undefined>(undefined);

export interface SwapStoreProviderProps {
  children: ReactNode;
}

export const SwapStoreProvider = ({ children }: SwapStoreProviderProps) => {
  const storeRef = useRef<SwapStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createSwapStore();
  }

  return <SwapStoreContext.Provider value={storeRef.current}>{children}</SwapStoreContext.Provider>;
};

export const useSwapStore = <T,>(selector: (store: SwapStore) => T): T => {
  const swapStoreContext = useContext(SwapStoreContext);

  if (!swapStoreContext) {
    throw new Error('useSwapStore must be used within SwapStoreProvider');
  }

  return useStore(swapStoreContext, selector);
};

export const useSwapState = () => {
  const inputToken = useSwapStore(state => state.inputToken);
  const outputToken = useSwapStore(state => state.outputToken);
  const inputAmount = useSwapStore(state => state.inputAmount);
  const isSwapAndSend = useSwapStore(state => state.isSwapAndSend);
  const customDestinationAddress = useSwapStore(state => state.customDestinationAddress);
  const slippageTolerance = useSwapStore(state => state.slippageTolerance);

  return {
    inputToken,
    outputToken,
    inputAmount,
    isSwapAndSend,
    customDestinationAddress,
    slippageTolerance,
  };
};

export const useSwapActions = () => {
  const setInputToken = useSwapStore(state => state.setInputToken);
  const setOutputToken = useSwapStore(state => state.setOutputToken);
  const setInputAmount = useSwapStore(state => state.setInputAmount);
  const setIsSwapAndSend = useSwapStore(state => state.setIsSwapAndSend);
  const setCustomDestinationAddress = useSwapStore(state => state.setCustomDestinationAddress);
  const setSlippageTolerance = useSwapStore(state => state.setSlippageTolerance);
  const switchTokens = useSwapStore(state => state.switchTokens);
  const resetSwapState = useSwapStore(state => state.resetSwapState);

  return {
    setInputToken,
    setOutputToken,
    setInputAmount,
    setIsSwapAndSend,
    setCustomDestinationAddress,
    setSlippageTolerance,
    switchTokens,
    resetSwapState,
  };
};
