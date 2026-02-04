// apps/web/app/(apps)/stake/_stores/stake-store.ts
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import type { XToken } from '@sodax/types';

export enum STAKE_MODE {
  STAKING = 'staking',
  UNSTAKING = 'unstaking',
}

export enum STAKE_STEP {
  STAKE_TERMS = 0,
  STAKE_APPROVE = 1,
  STAKE_CONFIRM = 2,
}

export enum UNSTAKE_METHOD {
  REGULAR = 'regular', // Wait 180 days
  INSTANT = 'instant', // Instant unstake
}

export enum UNSTAKE_STEP {
  UNSTAKE_CHOOSE_TYPE = 0,
  UNSTAKE_APPROVE = 1,
  UNSTAKE_CONFIRM = 2,
}

export type StakeState = {
  stakeValue: bigint;
  stakeTypedValue: string;
  selectedToken: XToken | null;
  stakeMode: STAKE_MODE;
  currentStakeStep: STAKE_STEP;
  totalStakedUsdValue: number;
  unstakeMethod: UNSTAKE_METHOD;
  currentUnstakeStep: UNSTAKE_STEP;
};

export type StakeActions = {
  setStakeValue: (value: bigint) => void;
  setStakeTypedValue: (value: string) => void;
  setCurrentStakeStep: (step: STAKE_STEP) => void;
  setTotalStakedUsdValue: (value: number) => void;
  setSelectedToken: (token: XToken | null) => void;
  setStakeMode: (mode: STAKE_MODE) => void;
  resetStakeState: () => void;
  setUnstakeMethod: (method: UNSTAKE_METHOD) => void;
  setCurrentUnstakeStep: (step: UNSTAKE_STEP) => void;
  resetUnstakeState: () => void;
};

export type StakeStore = StakeState & StakeActions;

export const defaultStakeState: StakeState = {
  selectedToken: null,
  stakeMode: STAKE_MODE.STAKING,
  stakeValue: 0n,
  stakeTypedValue: '',
  currentStakeStep: STAKE_STEP.STAKE_TERMS,
  totalStakedUsdValue: 0,
  unstakeMethod: UNSTAKE_METHOD.REGULAR,
  currentUnstakeStep: UNSTAKE_STEP.UNSTAKE_CHOOSE_TYPE,
};

export const createStakeStore = (initState: StakeState = defaultStakeState) => {
  return createStore<StakeStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setStakeValue: (value: bigint) => set({ stakeValue: value }),
        setStakeTypedValue: (value: string) => {
          const numericValue = Number(value);
          if (Number.isNaN(numericValue)) {
            set({ stakeValue: 0n });
          } else {
            set({ stakeTypedValue: value, stakeValue: BigInt(numericValue * 10 ** 18) });
          }
        },
        setCurrentStakeStep: (step: STAKE_STEP) => set({ currentStakeStep: step }),
        setTotalStakedUsdValue: (value: number) => set({ totalStakedUsdValue: value }),
        setSelectedToken: (token: XToken | null) => set({ selectedToken: token }),
        setStakeMode: (mode: STAKE_MODE) => set({ stakeMode: mode, stakeValue: 0n, stakeTypedValue: '' }),
        resetStakeState: () => {
          set({
            currentStakeStep: STAKE_STEP.STAKE_TERMS,
          });
        },
        setUnstakeMethod: (method: UNSTAKE_METHOD) => set({ unstakeMethod: method }),
        setCurrentUnstakeStep: (step: UNSTAKE_STEP) => set({ currentUnstakeStep: step }),
        resetUnstakeState: () => {
          set({
            currentUnstakeStep: UNSTAKE_STEP.UNSTAKE_CHOOSE_TYPE,
            unstakeMethod: UNSTAKE_METHOD.REGULAR,
          });
        },
      }),
      {
        name: 'sodax-stake-store',
        partialize: state => ({
          stakeValue: state.stakeValue.toString(),
          stakeTypedValue: state.stakeTypedValue,
          currentStakeStep: state.currentStakeStep,
          totalStakedUsdValue: state.totalStakedUsdValue,
          selectedToken: state.selectedToken,
          stakeMode: state.stakeMode,
          unstakeMethod: state.unstakeMethod,
          currentUnstakeStep: state.currentUnstakeStep,
        }),
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<StakeState & { stakeValue: string }> | null;
          if (!persisted) {
            return currentState;
          }
          return {
            ...currentState,
            ...persisted,
            stakeValue:
              typeof persisted.stakeValue === 'string'
                ? BigInt(persisted.stakeValue)
                : (persisted.stakeValue ?? currentState.stakeValue),
          };
        },
      },
    ),
  );
};
