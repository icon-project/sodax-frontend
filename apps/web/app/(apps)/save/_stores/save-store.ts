// apps/web/app/(apps)/save/_stores/save-store.ts
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import type { XToken } from '@sodax/types';

export enum DEPOSIT_STEP {
  TERMS = 0,
  APPROVE = 1,
  CONFIRM = 2,
}

export type SaveState = {
  depositValue: number;
  currentDepositStep: DEPOSIT_STEP;
  totalDepositedUsdValue: number;
  isSwitchingChain: boolean;
  activeAsset: string;
  scrollToCenter: boolean;
  isNetworkPickerOpened: boolean;
  isAssetListBlurred: boolean;
  isShowDeposits: boolean;
  selectedToken: XToken | null;
  suppliedAssetCount: number;
};

export type SaveActions = {
  setDepositValue: (value: number) => void;
  setCurrentDepositStep: (step: DEPOSIT_STEP) => void;
  setTotalDepositedUsdValue: (value: number) => void;
  setIsSwitchingChain: (isSwitching: boolean) => void;
  setActiveAsset: (value: string) => void;
  setScrollToCenter: (value: boolean) => void;
  setIsNetworkPickerOpened: (value: boolean) => void;
  setIsAssetListBlurred: (value: boolean) => void;
  setIsShowDeposits: (value: boolean) => void;
  setSelectedToken: (token: XToken | null) => void;
  resetSaveState: () => void;
  setSuppliedAssetCount: (count: number) => void;
};

export type SaveStore = SaveState & SaveActions;

export const defaultSaveState: SaveState = {
  depositValue: 0,
  currentDepositStep: DEPOSIT_STEP.TERMS,
  totalDepositedUsdValue: 0,
  isSwitchingChain: false,
  activeAsset: '',
  scrollToCenter: false,
  isNetworkPickerOpened: false,
  isAssetListBlurred: false,
  isShowDeposits: false,
  selectedToken: null,
  suppliedAssetCount: 0,
};

export const createSaveStore = (initState: SaveState = defaultSaveState) => {
  return createStore<SaveStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setDepositValue: (value: number) => set({ depositValue: value }),
        setCurrentDepositStep: (step: DEPOSIT_STEP) => set({ currentDepositStep: step }),
        setTotalDepositedUsdValue: (value: number) => set({ totalDepositedUsdValue: value }),
        setIsSwitchingChain: (isSwitching: boolean) => set({ isSwitchingChain: isSwitching }),
        setActiveAsset: (value: string) => set({ activeAsset: value }),
        setScrollToCenter: (value: boolean) => set({ scrollToCenter: value }),
        setIsNetworkPickerOpened: (value: boolean) => set({ isNetworkPickerOpened: value }),
        setIsAssetListBlurred: (value: boolean) => set({ isAssetListBlurred: value }),
        setIsShowDeposits: (value: boolean) => set({ isShowDeposits: value }),
        setSelectedToken: (token: XToken | null) => set({ selectedToken: token }),
        resetSaveState: () => {
          set({
            currentDepositStep: DEPOSIT_STEP.TERMS,
            isSwitchingChain: false,
          });
        },
        setSuppliedAssetCount: (count: number) => set({ suppliedAssetCount: count }), // <--- Add this
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
