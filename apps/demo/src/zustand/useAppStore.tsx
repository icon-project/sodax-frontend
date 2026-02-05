import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { StateCreator } from 'zustand';
import type { ChainId } from '@sodax/types';

export type SolverEnv = 'Production' | 'Staging' | 'Dev';

type AppStore = {
  selectedChainId: ChainId;
  selectChainId: (chainId: ChainId) => void;
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  solverEnvironment: SolverEnv;
  setSolverEnvironment: (env: SolverEnv) => void;
};

export const useAppStore = create<AppStore>()(
  immer((set, get) => ({
    selectedChainId: '0xa4b1.arbitrum',
    selectChainId: (chainId: ChainId) => set({ selectedChainId: chainId }),
    isWalletModalOpen: false,
    openWalletModal: () => set({ isWalletModalOpen: true }),
    closeWalletModal: () => set({ isWalletModalOpen: false }),
    solverEnvironment: 'Production',
    setSolverEnvironment: (env: SolverEnv) => set({ solverEnvironment: env }),
  })) as StateCreator<AppStore, [], []>,
);
