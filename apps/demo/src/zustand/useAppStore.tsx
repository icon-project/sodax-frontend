import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { StateCreator } from 'zustand';
import { ChainKeys, type SpokeChainKey } from '@sodax/types';

export const DEFAULT_SELECTED_CHAIN = ChainKeys.ARBITRUM_MAINNET;

export enum SolverEnv {
  Production = 'Production',
  Staging = 'Staging',
  Dev = 'Dev',
}

type AppStore = {
  selectedChainId: SpokeChainKey;
  selectChainId: (chainId: SpokeChainKey) => void;
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  solverEnvironment: SolverEnv;
  setSolverEnvironment: (env: SolverEnv) => void;
};

export const useAppStore = create<AppStore>()(
  immer((set, get) => ({
    selectedChainId: ChainKeys.ARBITRUM_MAINNET,
    selectChainId: (chainId: SpokeChainKey) => set({ selectedChainId: chainId }),
    isWalletModalOpen: false,
    openWalletModal: () => set({ isWalletModalOpen: true }),
    closeWalletModal: () => set({ isWalletModalOpen: false }),
    solverEnvironment: SolverEnv.Production,
    setSolverEnvironment: (env: SolverEnv) => set({ solverEnvironment: env }),
  })) as StateCreator<AppStore, [], []>,
);
