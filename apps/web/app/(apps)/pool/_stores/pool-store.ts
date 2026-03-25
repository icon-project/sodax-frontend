// apps/web/app/(apps)/pool/_stores/pool-store.ts
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import type { SpokeChainId } from '@sodax/types';
import type { XToken } from '@sodax/types';

export const INITIAL_PRICE = 1;
export const INITIAL_MIN_PRICE = +(INITIAL_PRICE * 0.85).toFixed(2);
export const INITIAL_MAX_PRICE = +(INITIAL_PRICE * 1.15).toFixed(2);
const APY_POOL_ID = '0x1fbed2bab018dd01756162d135964186addbab00158eda8013de8a15948995cd';

type PoolApyApiResponse = {
  apy?: number | null;
};

type PoolApyStatus = 'idle' | 'loading' | 'success' | 'error';

function getValidatedApy(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

export type PoolState = {
  selectedNetworkChainId: SpokeChainId | null;
  selectedToken: XToken | null;
  minPrice: number;
  maxPrice: number;
  sodaAmount: string;
  xSodaAmount: string;
  isNetworkPickerOpened: boolean;
  poolApyPercent: number | null;
  poolApyStatus: PoolApyStatus;
};

export type PoolActions = {
  setSelectedToken: (token: XToken | null) => void;
  setMinPrice: (price: number) => void;
  setMaxPrice: (price: number) => void;
  setSodaAmount: (amount: string) => void;
  setXSodaAmount: (amount: string) => void;
  setIsNetworkPickerOpened: (isOpened: boolean) => void;
  fetchPoolApy: () => Promise<void>;
  resetPoolState: () => void;
};

export type PoolStore = PoolState & PoolActions;

export const defaultPoolState: PoolState = {
  selectedNetworkChainId: null,
  selectedToken: null,
  minPrice: INITIAL_MIN_PRICE,
  maxPrice: INITIAL_MAX_PRICE,
  sodaAmount: '',
  xSodaAmount: '',
  isNetworkPickerOpened: false,
  poolApyPercent: null,
  poolApyStatus: 'idle',
};

export const createPoolStore = (initState: PoolState = defaultPoolState) => {
  return createStore<PoolStore>()(
    persist(
      (set, get) => ({
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
        fetchPoolApy: async (): Promise<void> => {
          const currentStatus = get().poolApyStatus;
          if (currentStatus === 'loading' || currentStatus === 'success') {
            return;
          }

          set({ poolApyStatus: 'loading' });
          try {
            const response = await fetch(`/api/pool/apy?poolId=${encodeURIComponent(APY_POOL_ID)}`, {
              method: 'GET',
              cache: 'no-store',
            });

            if (!response.ok) {
              set({ poolApyPercent: null, poolApyStatus: 'error' });
              return;
            }

            const data: unknown = await response.json();
            if (typeof data !== 'object' || data === null) {
              set({ poolApyPercent: null, poolApyStatus: 'error' });
              return;
            }

            const apyData = data as PoolApyApiResponse;
            const validatedApy = getValidatedApy(apyData.apy);
            set({
              poolApyPercent: validatedApy,
              poolApyStatus: validatedApy === null ? 'error' : 'success',
            });
          } catch {
            set({ poolApyPercent: null, poolApyStatus: 'error' });
          }
        },
        resetPoolState: () =>
          set(state => ({
            ...defaultPoolState,
            poolApyPercent: state.poolApyPercent,
            poolApyStatus: state.poolApyStatus,
          })),
      }),
      {
        name: 'sodax-pool-store',
        partialize: (state): PoolState => ({
          selectedNetworkChainId: state.selectedNetworkChainId,
          selectedToken: state.selectedToken,
          minPrice: state.minPrice,
          maxPrice: state.maxPrice,
          sodaAmount: state.sodaAmount,
          xSodaAmount: state.xSodaAmount,
          isNetworkPickerOpened: state.isNetworkPickerOpened,
          poolApyPercent: null,
          poolApyStatus: 'idle',
        }),
      },
    ),
  );
};
