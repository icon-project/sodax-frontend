// apps/web/app/(apps)/save/_stores/save-store.ts
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

export enum DEPOSIT_STEP {
  TERMS = 0,
  APPROVE = 1,
  CONFIRM = 2,
}

export type SaveState = {
  depositValue: number;
  currentDepositStep: DEPOSIT_STEP;
  suppliedAssetCount: number;
  isSwitchingChain: boolean;
  activeAsset: string;
  scrollToCenter: boolean;
  isNetworkPickerOpened: boolean;
};

export type SaveActions = {
  setDepositValue: (value: number) => void;
  setCurrentDepositStep: (step: DEPOSIT_STEP) => void;
  setSuppliedAssetCount: (count: number) => void;
  setIsSwitchingChain: (isSwitching: boolean) => void;
  setActiveAsset: (value: string) => void;
  setScrollToCenter: (value: boolean) => void;
  setIsNetworkPickerOpened: (value: boolean) => void;
  resetSaveState: () => void;
};

export type SaveStore = SaveState & SaveActions;

export const defaultSaveState: SaveState = {
  depositValue: 0,
  currentDepositStep: DEPOSIT_STEP.TERMS,
  suppliedAssetCount: 0,
  isSwitchingChain: false,
  activeAsset: '',
  scrollToCenter: false,
  isNetworkPickerOpened: false,
};

export const createSaveStore = (initState: SaveState = defaultSaveState) => {
  return createStore<SaveStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setDepositValue: (value: number) => set({ depositValue: value }),
        setCurrentDepositStep: (step: DEPOSIT_STEP) => set({ currentDepositStep: step }),
        setSuppliedAssetCount: (count: number) => set({ suppliedAssetCount: count }),
        setIsSwitchingChain: (isSwitching: boolean) => set({ isSwitchingChain: isSwitching }),
        setActiveAsset: (value: string) => set({ activeAsset: value }),
        setScrollToCenter: (value: boolean) => set({ scrollToCenter: value }),
        setIsNetworkPickerOpened: (value: boolean) => set({ isNetworkPickerOpened: value }),
        resetSaveState: () => {
          set({
            currentDepositStep: DEPOSIT_STEP.TERMS,
            isSwitchingChain: false,
          });
        },
      }),
      {
        name: 'sodax-save-store',
        partialize: state => ({
          depositValue: state.depositValue,
          activeAsset: state.activeAsset,
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<SaveState> | null;
          if (!persisted) {
            return currentState;
          }
          return {
            ...currentState,
            ...persisted,
          };
        },
      },
    ),
  );
};
