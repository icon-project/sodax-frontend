import { createStore } from 'zustand/vanilla';
import type { ChainType } from '@sodax/types';

export type AppState = {
  primaryChainType: ChainType;
};

export type AppActions = {
  setPrimaryChainType: (primaryChainType: ChainType) => void;
};

export type AppStore = AppState & AppActions;

export const initAppStore = (): AppState => {
  return { primaryChainType: 'EVM' };
};

export const defaultInitState: AppState = {
  primaryChainType: 'EVM',
};

export const createAppStore = (initState: AppState = defaultInitState) => {
  return createStore<AppStore>()((set, get) => ({
    ...initState,

    setPrimaryChainType: (primaryChainType: ChainType) => {
      set(prevState => {
        return {
          ...prevState,
          primaryChainType,
        };
      });
    },
  }));
};
