// apps/web/app/(apps)/save/_stores/save-store.ts
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

export type SaveState = {
  depositValue: number;
  currentStep: number;
  tokenCount: number;
  isSwitchingChain: boolean;
  showCarousel: boolean;
};

export type SaveActions = {
  setDepositValue: (value: number) => void;
  setCurrentStep: (step: number) => void;
  setTokenCount: (count: number) => void;
  setIsSwitchingChain: (isSwitching: boolean) => void;
  setShowCarousel: (show: boolean) => void;
  resetSaveState: () => void;
};

export type SaveStore = SaveState & SaveActions;

export const defaultSaveState: SaveState = {
  depositValue: 0,
  currentStep: 1,
  tokenCount: 0,
  isSwitchingChain: false,
  showCarousel: false,
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
        setShowCarousel: (show: boolean) => set({ showCarousel: show }),
        resetSaveState: () => {
          const currentState = get();
          set({
            ...defaultSaveState,
            showCarousel: currentState.showCarousel,
          });
        },
      }),
      {
        name: 'sodax-save-store',
        partialize: state => ({
          depositValue: state.depositValue,
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
