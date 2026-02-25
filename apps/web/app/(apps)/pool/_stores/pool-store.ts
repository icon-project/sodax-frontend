import { createStore } from 'zustand/vanilla';
import type { ChainId } from '@sodax/types';

export enum POOL_STEP {
  INFO = 0,
  DEPOSIT_TOKEN0 = 1,
  DEPOSIT_TOKEN1 = 2,
  APPROVE = 3,
  SUPPLY = 4,
}

export type PoolState = {
  // Pair & network
  selectedChainId: ChainId | null;

  // Pool selection (index into pools array from usePools)
  selectedPoolIndex: number;

  // Range
  minPrice: string;
  maxPrice: string;

  // Amounts (managed by useLiquidityAmounts, kept here for dialog access)
  token0Amount: string;
  token1Amount: string;

  // Slippage
  slippageTolerance: string;

  // Position management (tokenId of position being managed, for add-to-existing flow)
  positionIdToManage: string | null;

  // UI state
  currentStep: POOL_STEP;
  isNetworkPickerOpened: boolean;
  isPositionExpanded: boolean;
  chartPeriod: '1H' | '1D' | '1W' | '1M' | '1Y' | 'ALL';

  // Transaction
  supplyError: { title: string; message: string } | null;
  isSwitchingChain: boolean;
  isDialogOpen: boolean;
};

export type PoolActions = {
  setSelectedChainId: (chainId: ChainId | null) => void;
  setSelectedPoolIndex: (index: number) => void;
  setMinPrice: (price: string) => void;
  setMaxPrice: (price: string) => void;
  setToken0Amount: (amount: string) => void;
  setToken1Amount: (amount: string) => void;
  setSlippageTolerance: (value: string) => void;
  setPositionIdToManage: (id: string | null) => void;
  setCurrentStep: (step: POOL_STEP) => void;
  setIsNetworkPickerOpened: (value: boolean) => void;
  setIsPositionExpanded: (value: boolean) => void;
  setChartPeriod: (period: '1H' | '1D' | '1W' | '1M' | '1Y' | 'ALL') => void;
  setSupplyError: (error: { title: string; message: string } | null) => void;
  setIsSwitchingChain: (value: boolean) => void;
  setIsDialogOpen: (value: boolean) => void;
  resetSupplyState: () => void;
  reset: () => void;
};

export type PoolStore = PoolState & PoolActions;

export const defaultPoolState: PoolState = {
  selectedChainId: null,
  selectedPoolIndex: 0,
  minPrice: '',
  maxPrice: '',
  token0Amount: '',
  token1Amount: '',
  slippageTolerance: '0.5',
  positionIdToManage: null,
  currentStep: POOL_STEP.INFO,
  isNetworkPickerOpened: false,
  isPositionExpanded: false,
  chartPeriod: '1D',
  supplyError: null,
  isSwitchingChain: false,
  isDialogOpen: false,
};

export const createPoolStore = (initState: PoolState = defaultPoolState) => {
  return createStore<PoolStore>()(set => ({
    ...initState,
    setSelectedChainId: chainId => set({ selectedChainId: chainId }),
    setSelectedPoolIndex: index => set({ selectedPoolIndex: index }),
    setMinPrice: price => set({ minPrice: price }),
    setMaxPrice: price => set({ maxPrice: price }),
    setToken0Amount: amount => set({ token0Amount: amount }),
    setToken1Amount: amount => set({ token1Amount: amount }),
    setSlippageTolerance: value => set({ slippageTolerance: value }),
    setPositionIdToManage: id => set({ positionIdToManage: id }),
    setCurrentStep: step => set({ currentStep: step }),
    setIsNetworkPickerOpened: value => set({ isNetworkPickerOpened: value }),
    setIsPositionExpanded: value => set({ isPositionExpanded: value }),
    setChartPeriod: period => set({ chartPeriod: period }),
    setSupplyError: error => set({ supplyError: error }),
    setIsSwitchingChain: value => set({ isSwitchingChain: value }),
    setIsDialogOpen: value => set({ isDialogOpen: value }),
    resetSupplyState: () => {
      set({
        currentStep: POOL_STEP.INFO,
        isSwitchingChain: false,
        supplyError: null,
      });
    },
    reset: () => set(defaultPoolState),
  }));
};
