import { createStore } from 'zustand/vanilla';

export enum MODAL_ID {
  WALLET_MODAL = 'WALLET_MODAL',
  WALLET_MODAL2 = 'WALLET_MODAL2',
  TERMS_CONFIRMATION_MODAL = 'TERMS_CONFIRMATION_MODAL',
}

export type ModalState = {
  modals: Partial<
    Record<
      MODAL_ID,
      {
        open: boolean;
        modalData: unknown;
      }
    >
  >;
};

export type ModalActions = {
  openModal: (id: MODAL_ID, modalData?: unknown) => void;
  closeModal: (id: MODAL_ID) => void;
  getModalData: (id: MODAL_ID) => unknown;
  setModalData: (id: MODAL_ID, modalData: unknown) => void;
};

export type ModalStore = ModalState & ModalActions;

export const initModalStore = (): ModalState => {
  return { modals: {} };
};

export const defaultInitState: ModalState = {
  modals: {},
};

export const createModalStore = (initState: ModalState = defaultInitState) => {
  return createStore<ModalStore>()((set, get) => ({
    ...initState,

    setModalData: (id: MODAL_ID, modalData: unknown) => {
      set(prevState => {
        return {
          ...prevState,
          modals: { ...prevState.modals, [id]: { open: true, modalData } },
        };
      });
    },
    getModalData: (id: MODAL_ID) => {
      return get().modals[id]?.modalData;
    },

    openModal: (id: MODAL_ID, modalData = null) => {
      set(prevState => {
        return {
          ...prevState,
          modals: {
            ...prevState.modals,
            [id]: { open: true, modalData },
          },
        };
      });
    },
    closeModal: (id: MODAL_ID) => {
      set(prevState => {
        return {
          ...prevState,
          modals: {
            ...prevState.modals,
            [id]: { open: false, modalData: null },
          },
        };
      });
    },
  }));
};
