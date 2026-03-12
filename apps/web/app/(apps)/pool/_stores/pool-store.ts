// apps/web/app/(apps)/pool/_stores/pool-store.ts
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId } from '@sodax/types';
import type { XToken } from '@sodax/types';

export const INITIAL_PRICE = 1;
export const INITIAL_MIN_PRICE = +(INITIAL_PRICE * 0.85).toFixed(2);
export const INITIAL_MAX_PRICE = +(INITIAL_PRICE * 1.15).toFixed(2);

export type PoolState = {
  selectedNetworkChainId: SpokeChainId;
  selectedToken: XToken | null;
  minPrice: number;
  maxPrice: number;
  sodaAmount: string;
  xSodaAmount: string;
  isNetworkPickerOpened: boolean;
};

export type PoolActions = {
  setSelectedToken: (token: XToken | null) => void;
  setMinPrice: (price: number) => void;
  setMaxPrice: (price: number) => void;
  setSodaAmount: (amount: string) => void;
  setXSodaAmount: (amount: string) => void;
  setIsNetworkPickerOpened: (isOpened: boolean) => void;
  resetPoolState: () => void;
};

export type PoolStore = PoolState & PoolActions;

export const defaultPoolState: PoolState = {
  selectedNetworkChainId: SONIC_MAINNET_CHAIN_ID,
  selectedToken: null,
  minPrice: INITIAL_MIN_PRICE,
  maxPrice: INITIAL_MAX_PRICE,
  sodaAmount: '',
  xSodaAmount: '',
  isNetworkPickerOpened: false,
};

export const createPoolStore = (initState: PoolState = defaultPoolState) => {
  return createStore<PoolStore>()(
    persist(
      set => ({
        ...initState,
        setSelectedToken: (token: XToken | null) =>
          set(state => ({
            selectedToken: token,
            selectedNetworkChainId: (token?.xChainId as SpokeChainId) ?? state.selectedNetworkChainId,
          })),
        setMinPrice: (price: number) => set({ minPrice: price }),
        setMaxPrice: (price: number) => set({ maxPrice: price }),
        setSodaAmount: (amount: string) => set({ sodaAmount: amount }),
        setXSodaAmount: (amount: string) => set({ xSodaAmount: amount }),
        setIsNetworkPickerOpened: (isOpened: boolean) => set({ isNetworkPickerOpened: isOpened }),
        resetPoolState: () => set(defaultPoolState),
      }),
      {
        name: 'sodax-pool-store',
      },
    ),
  );
};
