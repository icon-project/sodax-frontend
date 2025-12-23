// apps/web/app/(apps)/save/_stores/save-store.ts
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

export type SaveState = {
  depositValue: number;
  currentStep: number;
};

export type SaveActions = {
  setDepositValue: (value: number) => void;
  setCurrentStep: (step: number) => void;
  resetSaveState: () => void;
};

export type SaveStore = SaveState & SaveActions;

export const defaultSaveState: SaveState = {
  depositValue: 0,
  currentStep: 1,
};

export const createSaveStore = (initState: SaveState = defaultSaveState) => {
  return createStore<SaveStore>()(
    persist(
      set => ({
        ...initState,
        setDepositValue: (value: number) => set({ depositValue: value }),
        setCurrentStep: (step: number) => set({ currentStep: step }),
        resetSaveState: () => set(defaultSaveState),
      }),
      {
        name: 'sodax-save-store',
        partialize: state => ({
          depositValue: state.depositValue,
        }),
      },
    ),
  );
};
