'use client';

import { type ReactNode, createContext, useRef, useContext } from 'react';
import { useStore } from 'zustand';

import { type MODAL_ID, type ModalStore, createModalStore, initModalStore } from '@/stores/modal-store';

export type ModalStoreApi = ReturnType<typeof createModalStore>;

export const ModalStoreContext = createContext<ModalStoreApi | undefined>(undefined);

export interface ModalStoreProviderProps {
  children: ReactNode;
}

export const ModalStoreProvider = ({ children }: ModalStoreProviderProps) => {
  const storeRef = useRef<ModalStoreApi | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = createModalStore(initModalStore());
  }

  return <ModalStoreContext.Provider value={storeRef.current}>{children}</ModalStoreContext.Provider>;
};

export const useModalStore = <T,>(selector: (store: ModalStore) => T): T => {
  const modalStoreContext = useContext(ModalStoreContext);

  if (!modalStoreContext) {
    throw new Error('useModalStore must be used within ModalStoreProvider');
  }

  return useStore(modalStoreContext, selector);
};

export function useModalOpen(id: MODAL_ID): boolean {
  const modalOpen = useModalStore(state => state.modals?.[id]?.open);
  return modalOpen ?? false;
}

export function useModalData(id: MODAL_ID): unknown {
  return useModalStore(state => state.modals?.[id]?.modalData) || {};
}
