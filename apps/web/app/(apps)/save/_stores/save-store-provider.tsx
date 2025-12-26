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
  const currentStep = useSaveStore(state => state.currentStep);
  const tokenCount = useSaveStore(state => state.tokenCount);
  const isSwitchingChain = useSaveStore(state => state.isSwitchingChain);

  return {
    depositValue,
    currentStep,
    tokenCount,
    isSwitchingChain,
  };
};

export const useSaveActions = () => {
  const setDepositValue = useSaveStore(state => state.setDepositValue);
  const setCurrentStep = useSaveStore(state => state.setCurrentStep);
  const setTokenCount = useSaveStore(state => state.setTokenCount);
  const setIsSwitchingChain = useSaveStore(state => state.setIsSwitchingChain);
  const resetSaveState = useSaveStore(state => state.resetSaveState);

  return {
    setDepositValue,
    setCurrentStep,
    setTokenCount,
    setIsSwitchingChain,
    resetSaveState,
  };
};
