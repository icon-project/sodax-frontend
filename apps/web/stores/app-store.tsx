import { createStore } from 'zustand/vanilla';
import type { ChainType } from '@sodax/types';

export type AppState = {
  primaryChainType: ChainType;
  isSwitchingPage: boolean;
  triggerAnimation: boolean;
};

export type AppActions = {
  setPrimaryChainType: (primaryChainType: ChainType) => void;
  setIsSwitchingPage: (isSwitchingPage: boolean) => void;
  setTriggerAnimation: (triggerAnimation: boolean) => void;
};

export type AppStore = AppState & AppActions;

export const initAppStore = (): AppState => {
  return { primaryChainType: 'EVM', isSwitchingPage: true, triggerAnimation: false };
};

export const defaultInitState: AppState = {
  primaryChainType: 'EVM',
  isSwitchingPage: true,
  triggerAnimation: false,
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

    setIsSwitchingPage: (isSwitchingPage: boolean) => {
      set(prevState => {
        return {
          ...prevState,
          isSwitchingPage,
        };
      });
    },

    setTriggerAnimation: (triggerAnimation: boolean) => {
      set(prevState => {
        return {
          ...prevState,
          triggerAnimation,
        };
      });
    },
  }));
};
