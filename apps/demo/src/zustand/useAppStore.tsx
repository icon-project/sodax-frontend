import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { StateCreator } from 'zustand';
import type { ChainId } from '@sodax/types';

type AppStore = {
  selectedChainId: ChainId;
  selectChainId: (chainId: ChainId) => void;
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
};

export const useAppStore = create<AppStore>()(
  immer((set, get) => ({
    selectedChainId: '0xa86a.avax',
    selectChainId: (chainId: ChainId) => set({ selectedChainId: chainId }),
    isWalletModalOpen: false,
    openWalletModal: () => set({ isWalletModalOpen: true }),
    closeWalletModal: () => set({ isWalletModalOpen: false }),
  })) as StateCreator<AppStore, [], []>,
);
