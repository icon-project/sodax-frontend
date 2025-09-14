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

// Convenience hook for getting all swap state
export const useSwapState = () => {
  const sourceToken = useSwapStore(state => state.sourceToken);
  const destinationToken = useSwapStore(state => state.destinationToken);
  const sourceAmount = useSwapStore(state => state.sourceAmount);
  const destinationAmount = useSwapStore(state => state.destinationAmount);
  const isSwapAndSend = useSwapStore(state => state.isSwapAndSend);
  const customDestinationAddress = useSwapStore(state => state.customDestinationAddress);
  const slippageTolerance = useSwapStore(state => state.slippageTolerance);

  return {
    sourceToken,
    destinationToken,
    sourceAmount,
    destinationAmount,
    isSwapAndSend,
    customDestinationAddress,
    slippageTolerance,
  };
};

// Convenience hook for getting all swap actions
export const useSwapActions = () => {
  const setSourceToken = useSwapStore(state => state.setSourceToken);
  const setDestinationToken = useSwapStore(state => state.setDestinationToken);
  const setSourceAmount = useSwapStore(state => state.setSourceAmount);
  const setDestinationAmount = useSwapStore(state => state.setDestinationAmount);
  const setIsSwapAndSend = useSwapStore(state => state.setIsSwapAndSend);
  const setCustomDestinationAddress = useSwapStore(state => state.setCustomDestinationAddress);
  const setSlippageTolerance = useSwapStore(state => state.setSlippageTolerance);
  const switchTokens = useSwapStore(state => state.switchTokens);
  const resetSwapState = useSwapStore(state => state.resetSwapState);

  return {
    setSourceToken,
    setDestinationToken,
    setSourceAmount,
    setDestinationAmount,
    setIsSwapAndSend,
    setCustomDestinationAddress,
    setSlippageTolerance,
    switchTokens,
    resetSwapState,
  };
};
