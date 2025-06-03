import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { StateCreator } from 'zustand';
import type { XChainId } from '@new-world/xwagmi';

type AppStore = {
  selectedChain: XChainId;
  changeChain: (chain: XChainId) => void;
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
};

export const useAppStore = create<AppStore>()(
  immer((set, get) => ({
    selectedChain: '0xa86a.avax',
    changeChain: (chain: XChainId) => set({ selectedChain: chain }),
    isWalletModalOpen: false,
    openWalletModal: () => set({ isWalletModalOpen: true }),
    closeWalletModal: () => set({ isWalletModalOpen: false }),
  })) as StateCreator<AppStore, [], []>,
);
