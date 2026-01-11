// apps/web/app/(apps)/save/_stores/save-store.ts
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

export type SaveState = {
  depositValue: number;
  currentStep: number;
  tokenCount: number;
  isSwitchingChain: boolean;
  openAsset: string;
  scrollToCenter: boolean;
};

export type SaveActions = {
  setDepositValue: (value: number) => void;
  setCurrentStep: (step: number) => void;
  setTokenCount: (count: number) => void;
  setIsSwitchingChain: (isSwitching: boolean) => void;
  setOpenAsset: (value: string) => void;
  setScrollToCenter: (value: boolean) => void;
  resetSaveState: () => void;
};

export type SaveStore = SaveState & SaveActions;

export const defaultSaveState: SaveState = {
  depositValue: 0,
  currentStep: 1,
  tokenCount: 0,
  isSwitchingChain: false,
  openAsset: '',
  scrollToCenter: false,
};

export const createSaveStore = (initState: SaveState = defaultSaveState) => {
  return createStore<SaveStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setDepositValue: (value: number) => set({ depositValue: value }),
        setCurrentStep: (step: number) => set({ currentStep: step }),
        setTokenCount: (count: number) => set({ tokenCount: count }),
        setIsSwitchingChain: (isSwitching: boolean) => set({ isSwitchingChain: isSwitching }),
        setOpenAsset: (value: string) => set({ openAsset: value }),
        setScrollToCenter: (value: boolean) => set({ scrollToCenter: value }),
        resetSaveState: () => {
          set({
            currentStep: 1,
            isSwitchingChain: false,
          });
        },
      }),
      {
        name: 'sodax-save-store',
        partialize: state => ({
          depositValue: state.depositValue,
          openAsset: state.openAsset,
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
