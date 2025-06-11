import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { StateCreator } from 'zustand';
import type { ChainId } from '@sodax/types';

type AppStore = {
  selectedChain: ChainId;
  changeChain: (chain: ChainId) => void;
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
};

export const useAppStore = create<AppStore>()(
  immer((set, get) => ({
    selectedChain: '0xa86a.avax',
    changeChain: (chain: ChainId) => set({ selectedChain: chain }),
    isWalletModalOpen: false,
    openWalletModal: () => set({ isWalletModalOpen: true }),
    closeWalletModal: () => set({ isWalletModalOpen: false }),
  })) as StateCreator<AppStore, [], []>,
);
