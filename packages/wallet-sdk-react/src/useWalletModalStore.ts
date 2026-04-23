import type { ChainType } from '@sodax/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { XConnector } from './core/index.js';
import type { XAccount } from './types/index.js';

/**
 * Discriminated union for the wallet-modal flow state machine.
 * See `useWalletModal()` for transitions and consumer usage.
 */
export type WalletModalState =
  | { kind: 'closed' }
  | { kind: 'chainSelect' }
  | { kind: 'walletSelect'; chainType: ChainType }
  | { kind: 'connecting'; chainType: ChainType; connector: XConnector }
  | { kind: 'success'; chainType: ChainType; connector: XConnector; account: XAccount }
  | { kind: 'error'; chainType: ChainType; connector: XConnector; error: Error };

type WalletModalStore = {
  walletModal: WalletModalState;

  open: () => void;
  close: () => void;
  /**
   * Smart back: walletSelect → chainSelect; connecting/error → walletSelect
   * (preserve chainType so the user can pick another wallet or retry);
   * success → closed; closed/chainSelect → no-op.
   */
  back: () => void;
  selectChain: (chainType: ChainType) => void;
  setConnecting: (chainType: ChainType, connector: XConnector) => void;
  setSuccess: (chainType: ChainType, connector: XConnector, account: XAccount) => void;
  setError: (chainType: ChainType, connector: XConnector, error: Error) => void;
};

/**
 * Ephemeral UI store for the wallet-modal flow. Kept separate from
 * `useXWalletStore` because modal lifecycle is per-session UI state — it
 * has no business being co-located with persistent connection data and
 * doesn't share the persist/hydration concerns.
 *
 * Direct store access is intentionally not part of the package's public
 * surface; consumers go through `useWalletModal()`.
 */
export const useWalletModalStore = create<WalletModalStore>()(
  devtools(
    immer(set => ({
      walletModal: { kind: 'closed' },

      open: () => {
        set(state => {
          state.walletModal = { kind: 'chainSelect' };
        });
      },

      close: () => {
        set(state => {
          state.walletModal = { kind: 'closed' };
        });
      },

      back: () => {
        set(state => {
          const current = state.walletModal;
          switch (current.kind) {
            case 'walletSelect':
              state.walletModal = { kind: 'chainSelect' };
              return;
            case 'connecting':
            case 'error':
              state.walletModal = { kind: 'walletSelect', chainType: current.chainType };
              return;
            case 'success':
              state.walletModal = { kind: 'closed' };
              return;
            // 'closed' and 'chainSelect' have nowhere to go back to.
          }
        });
      },

      selectChain: (chainType: ChainType) => {
        set(state => {
          state.walletModal = { kind: 'walletSelect', chainType };
        });
      },

      setConnecting: (chainType: ChainType, connector: XConnector) => {
        set(state => {
          state.walletModal = { kind: 'connecting', chainType, connector };
        });
      },

      setSuccess: (chainType: ChainType, connector: XConnector, account: XAccount) => {
        set(state => {
          state.walletModal = { kind: 'success', chainType, connector, account };
        });
      },

      setError: (chainType: ChainType, connector: XConnector, error: Error) => {
        set(state => {
          state.walletModal = { kind: 'error', chainType, connector, error };
        });
      },
    })),
    { name: 'wallet-modal-store' },
  ),
);
