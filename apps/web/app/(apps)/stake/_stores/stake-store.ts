// apps/web/app/(apps)/stake/_stores/stake-store.ts
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import type { XToken } from '@sodax/types';

export enum STAKE_MODE {
  STAKING = 'staking',
  UNSTAKING = 'unstaking',
}

export enum STAKE_STEP {
  TERMS = 0,
  APPROVE = 1,
  CONFIRM = 2,
}

export type StakeState = {
  selectedToken: XToken | null;
  stakeMode: STAKE_MODE;
  stakeValue: number;
  currentStakeStep: STAKE_STEP;
  totalStakedUsdValue: number;
};

export type StakeActions = {
  setStakeValue: (value: number) => void;
  setCurrentStakeStep: (step: STAKE_STEP) => void;
  setTotalStakedUsdValue: (value: number) => void;
  setSelectedToken: (token: XToken | null) => void;
  setStakeMode: (mode: STAKE_MODE) => void;
  resetStakeState: () => void;
};

export type StakeStore = StakeState & StakeActions;

export const defaultStakeState: StakeState = {
  selectedToken: null,
  stakeMode: STAKE_MODE.STAKING,
  stakeValue: 0,
  currentStakeStep: STAKE_STEP.TERMS,
  totalStakedUsdValue: 0,
};

export const createStakeStore = (initState: StakeState = defaultStakeState) => {
  return createStore<StakeStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setStakeValue: (value: number) => set({ stakeValue: value }),
        setCurrentStakeStep: (step: STAKE_STEP) => set({ currentStakeStep: step }),
        setTotalStakedUsdValue: (value: number) => set({ totalStakedUsdValue: value }),
        setSelectedToken: (token: XToken | null) => set({ selectedToken: token }),
        setStakeMode: (mode: STAKE_MODE) => set({ stakeMode: mode }),
        resetStakeState: () => {
          set({
            currentStakeStep: STAKE_STEP.TERMS,
          });
        },
      }),
      {
        name: 'sodax-stake-store',
        partialize: state => ({
          stakeValue: state.stakeValue,
          currentStakeStep: state.currentStakeStep,
          totalStakedUsdValue: state.totalStakedUsdValue,
          selectedToken: state.selectedToken,
          stakeMode: state.stakeMode,
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<StakeState> | null;
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
