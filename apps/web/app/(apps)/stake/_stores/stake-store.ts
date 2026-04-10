import { createStore } from 'zustand/vanilla';
import type { XToken } from '@sodax/types';
import BigNumber from 'bignumber.js';
import { formatUnits } from 'viem';

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
  stakeTypedValue: string;
  selectedToken: XToken | null;
  stakeMode: STAKE_MODE;
  currentStakeStep: STAKE_STEP;
  totalStakedUsdValue: number;
  unstakeMethod: UNSTAKE_METHOD;
  currentUnstakeStep: UNSTAKE_STEP;
  isNetworkPickerOpened: boolean;
};

export type StakeActions = {
  setStakeTypedValue: (value: string) => void;
  setStakeValueByPercent: (percent: number, maxValue: bigint, decimals?: number) => void;
  setCurrentStakeStep: (step: STAKE_STEP) => void;
  setTotalStakedUsdValue: (value: number) => void;
  setSelectedToken: (token: XToken | null) => void;
  setStakeMode: (mode: STAKE_MODE) => void;
  resetStakeState: () => void;
  setUnstakeMethod: (method: UNSTAKE_METHOD) => void;
  setCurrentUnstakeStep: (step: UNSTAKE_STEP) => void;
  resetUnstakeState: () => void;
  setIsNetworkPickerOpened: (value: boolean) => void;
  reset: () => void;
};

export type StakeStore = StakeState & StakeActions;

export const defaultStakeState: StakeState = {
  selectedToken: null,
  stakeMode: STAKE_MODE.STAKING,
  stakeTypedValue: '0',
  currentStakeStep: STAKE_STEP.STAKE_TERMS,
  totalStakedUsdValue: 0,
  unstakeMethod: UNSTAKE_METHOD.REGULAR,
  currentUnstakeStep: UNSTAKE_STEP.UNSTAKE_CHOOSE_TYPE,
  isNetworkPickerOpened: false,
};

export const createStakeStore = (initState: StakeState = defaultStakeState) => {
  return createStore<StakeStore>()((set, get) => ({
    ...initState,

    setStakeTypedValue: (value: string) => {
      set({ stakeTypedValue: value });
    },

    setStakeValueByPercent: (percent: number, maxValue: bigint, decimals = 18) => {
      let value: bigint;
      if (percent >= 100) {
        value = maxValue;
      } else {
        value = BigInt(
          new BigNumber(maxValue.toString()).multipliedBy(Math.round(percent)).dividedBy(100).toFixed(0),
        );
      }
      const raw = formatUnits(value, decimals);
      const formatted = new BigNumber(raw).toFixed(2, BigNumber.ROUND_DOWN);
      set({ stakeTypedValue: formatted });
    },

    setCurrentStakeStep: (step: STAKE_STEP) => set({ currentStakeStep: step }),
    setTotalStakedUsdValue: (value: number) => set({ totalStakedUsdValue: value }),
    setSelectedToken: (token: XToken | null) => set({ selectedToken: token }),
    setStakeMode: (mode: STAKE_MODE) => set({ stakeMode: mode, stakeTypedValue: '' }),
    resetStakeState: () => set({ currentStakeStep: STAKE_STEP.STAKE_TERMS }),
    setUnstakeMethod: (method: UNSTAKE_METHOD) => set({ unstakeMethod: method }),
    setCurrentUnstakeStep: (step: UNSTAKE_STEP) => set({ currentUnstakeStep: step }),
    reset: () => set(defaultStakeState),
    resetUnstakeState: () =>
      set({
        currentUnstakeStep: UNSTAKE_STEP.UNSTAKE_CHOOSE_TYPE,
        unstakeMethod: UNSTAKE_METHOD.REGULAR,
      }),

    setIsNetworkPickerOpened: (value: boolean) => set({ isNetworkPickerOpened: value }),
  }));
};
