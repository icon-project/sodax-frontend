'use client';

import { type ReactNode, createContext, useRef, useContext, useMemo } from 'react';
import { useStore } from 'zustand';

import { type SwapStore, createSwapStore } from './swap-store';
import { parseUnits } from 'viem';
import { getXChainType, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { validateChainAddress } from '@/lib/utils';

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
  const swapStatus = useSwapStore(state => state.swapStatus);
  const swapError = useSwapStore(state => state.swapError);
  const dstTxHash = useSwapStore(state => state.dstTxHash);
  const allowanceConfirmed = useSwapStore(state => state.allowanceConfirmed);

  return {
    inputToken,
    outputToken,
    inputAmount,
    isSwapAndSend,
    customDestinationAddress,
    slippageTolerance,
    swapStatus,
    swapError,
    dstTxHash,
    allowanceConfirmed,
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
  const setSwapStatus = useSwapStore(state => state.setSwapStatus);
  const setSwapError = useSwapStore(state => state.setSwapError);
  const setDstTxHash = useSwapStore(state => state.setDstTxHash);
  const setAllowanceConfirmed = useSwapStore(state => state.setAllowanceConfirmed);
  const resetSwapExecutionState = useSwapStore(state => state.resetSwapExecutionState);

  return {
    setInputToken,
    setOutputToken,
    setInputAmount,
    setIsSwapAndSend,
    setCustomDestinationAddress,
    setSlippageTolerance,
    switchTokens,
    resetSwapState,
    setSwapStatus,
    setSwapError,
    setDstTxHash,
    setAllowanceConfirmed,
    resetSwapExecutionState,
  };
};

export const useSwapInfo = () => {
  const inputToken = useSwapStore(state => state.inputToken);
  const outputToken = useSwapStore(state => state.outputToken);
  const inputAmount = useSwapStore(state => state.inputAmount);
  const isSwapAndSend = useSwapStore(state => state.isSwapAndSend);
  const customDestinationAddress = useSwapStore(state => state.customDestinationAddress);
  const slippageTolerance = useSwapStore(state => state.slippageTolerance);

  const { address: sourceAddress } = useXAccount(inputToken.xChainId);
  const { data: balances } = useXBalances({
    xChainId: inputToken.xChainId,
    xTokens: [inputToken],
    address: sourceAddress,
  });

  const sourceBalance = balances?.[inputToken.address] || 0n;

  const inputError = useMemo(() => {
    if (inputAmount === '0' || inputAmount === '') {
      return 'Enter Amount';
    }
    if (isSwapAndSend && customDestinationAddress === '') {
      return 'Enter destination address';
    }
    if (isSwapAndSend && !validateChainAddress(customDestinationAddress, getXChainType(outputToken.xChainId) || '')) {
      return 'Address is not valid';
    }
    if (sourceBalance < parseUnits(inputAmount, inputToken.decimals)) {
      return 'Insufficient balance';
    }
    return null;
  }, [inputAmount, isSwapAndSend, customDestinationAddress, outputToken.xChainId, sourceBalance, inputToken.decimals]);

  return {
    inputToken,
    outputToken,
    inputAmount,
    isSwapAndSend,
    customDestinationAddress,
    slippageTolerance,
    sourceBalance,
    inputError,
  };
};
