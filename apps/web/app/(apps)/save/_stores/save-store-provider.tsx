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
  const suppliedAssetCount = useSaveStore(state => state.suppliedAssetCount);
  const isSwitchingChain = useSaveStore(state => state.isSwitchingChain);
  const activeAsset = useSaveStore(state => state.activeAsset);
  const scrollToCenter = useSaveStore(state => state.scrollToCenter);
  const isNetworkPickerOpened = useSaveStore(state => state.isNetworkPickerOpened);
  return {
    depositValue,
    currentDepositStep,
    suppliedAssetCount,
    isSwitchingChain,
    activeAsset,
    scrollToCenter,
    isNetworkPickerOpened,
  };
};

export const useSaveActions = () => {
  const setDepositValue = useSaveStore(state => state.setDepositValue);
  const setCurrentDepositStep = useSaveStore(state => state.setCurrentDepositStep);
  const setSuppliedAssetCount = useSaveStore(state => state.setSuppliedAssetCount);
  const setIsSwitchingChain = useSaveStore(state => state.setIsSwitchingChain);
  const setActiveAsset = useSaveStore(state => state.setActiveAsset);
  const setScrollToCenter = useSaveStore(state => state.setScrollToCenter);
  const setIsNetworkPickerOpened = useSaveStore(state => state.setIsNetworkPickerOpened);
  const resetSaveState = useSaveStore(state => state.resetSaveState);

  return {
    setDepositValue,
    setCurrentDepositStep,
    setSuppliedAssetCount,
    setIsSwitchingChain,
    setActiveAsset,
    setScrollToCenter,
    setIsNetworkPickerOpened,
    resetSaveState,
  };
};
