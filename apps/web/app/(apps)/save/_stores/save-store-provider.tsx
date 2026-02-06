// apps/web/app/(apps)/save/_stores/save-store-provider.tsx
'use client';

import { type ReactNode, createContext, useRef, useContext } from 'react';
import { useStore } from 'zustand';

import { type SaveStore, createSaveStore } from './save-store';

export type SaveStoreApi = ReturnType<typeof createSaveStore>;

export const SaveStoreContext = createContext<SaveStoreApi | undefined>(undefined);

export interface SaveStoreProviderProps {
  children: ReactNode;
}

export const SaveStoreProvider = ({ children }: SaveStoreProviderProps) => {
  const storeRef = useRef<SaveStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createSaveStore();
  }

  return <SaveStoreContext.Provider value={storeRef.current}>{children}</SaveStoreContext.Provider>;
};

export const useSaveStore = <T,>(selector: (store: SaveStore) => T): T => {
  const saveStoreContext = useContext(SaveStoreContext);

  if (!saveStoreContext) {
    throw new Error('useSaveStore must be used within SaveStoreProvider');
  }

  return useStore(saveStoreContext, selector);
};

export const useSaveState = () => {
  const depositValue = useSaveStore(state => state.depositValue);
  const currentDepositStep = useSaveStore(state => state.currentDepositStep);
  const totalDepositedUsdValue = useSaveStore(state => state.totalDepositedUsdValue);
  const isSwitchingChain = useSaveStore(state => state.isSwitchingChain);
  const activeAsset = useSaveStore(state => state.activeAsset);
  const scrollToCenter = useSaveStore(state => state.scrollToCenter);
  const isNetworkPickerOpened = useSaveStore(state => state.isNetworkPickerOpened);
  const isAssetListBlurred = useSaveStore(state => state.isAssetListBlurred);
  const isShowDeposits = useSaveStore(state => state.isShowDeposits);
  const selectedToken = useSaveStore(state => state.selectedToken);
  return {
    depositValue,
    currentDepositStep,
    totalDepositedUsdValue,
    isSwitchingChain,
    activeAsset,
    scrollToCenter,
    isNetworkPickerOpened,
    isAssetListBlurred,
    isShowDeposits,
    selectedToken,
  };
};

export const useSaveActions = () => {
  const setDepositValue = useSaveStore(state => state.setDepositValue);
  const setCurrentDepositStep = useSaveStore(state => state.setCurrentDepositStep);
  const setTotalDepositedUsdValue = useSaveStore(state => state.setTotalDepositedUsdValue);
  const setIsSwitchingChain = useSaveStore(state => state.setIsSwitchingChain);
  const setActiveAsset = useSaveStore(state => state.setActiveAsset);
  const setScrollToCenter = useSaveStore(state => state.setScrollToCenter);
  const setIsNetworkPickerOpened = useSaveStore(state => state.setIsNetworkPickerOpened);
  const setIsAssetListBlurred = useSaveStore(state => state.setIsAssetListBlurred);
  const setIsShowDeposits = useSaveStore(state => state.setIsShowDeposits);
  const setSelectedToken = useSaveStore(state => state.setSelectedToken);
  const resetSaveState = useSaveStore(state => state.resetSaveState);

  return {
    setDepositValue,
    setCurrentDepositStep,
    setTotalDepositedUsdValue,
    setIsSwitchingChain,
    setActiveAsset,
    setScrollToCenter,
    setIsNetworkPickerOpened,
    setIsAssetListBlurred,
    setIsShowDeposits,
    setSelectedToken,
    resetSaveState,
  };
};
