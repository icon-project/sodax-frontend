import { useCallback } from 'react';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '@/core/XConnector.js';
import type { XAccount } from '@/types/index.js';
import { useWalletModalStore, type WalletModalState } from '@/useWalletModalStore.js';
import { useXConnect } from './useXConnect.js';

export type { WalletModalState };

export type UseWalletModalOptions = {
  /**
   * Fires once after a successful connect attempt initiated through the modal,
   * before the consumer transitions away from the `success` state. Side-effects
   * the SDK shouldn't bake in (registration check, terms-of-service modal, app
   * routing) belong here.
   */
  onConnected?: (chainType: ChainType, account: XAccount) => void | Promise<void>;
};

export type UseWalletModalResult = {
  /** Discriminated union — switch on `state.kind` for type-narrowed fields. */
  state: WalletModalState;
  /** Transition `closed → chainSelect`. No-op if already open. */
  open: () => void;
  /** Transition any → `closed`. */
  close: () => void;
  /**
   * Smart back: walletSelect → chainSelect; connecting/error → walletSelect
   * (preserve chainType so user can pick another wallet or retry); success → closed;
   * closed/chainSelect → no-op.
   */
  back: () => void;
  /** Transition `chainSelect → walletSelect(chainType)`. */
  selectChain: (chainType: ChainType) => void;
  /**
   * Transition `walletSelect → connecting → success | error`. Composes
   * `useXConnect` internally; failures populate `state.error` instead of
   * throwing. Concurrent invocations while a connect is in flight return the
   * same promise.
   */
  selectWallet: (connector: XConnector) => Promise<XAccount | undefined>;
  /** Re-runs the last `selectWallet` from an `error` state. No-op otherwise. */
  retry: () => Promise<XAccount | undefined>;
};

/**
 * Headless modal lifecycle for multi-chain wallet connection. Owns the flow
 * `closed → chainSelect → walletSelect → connecting → success | error` as a
 * Zustand slice so multiple components (header CTA, inline buttons, settings)
 * see the same lifecycle without prop drilling.
 *
 * The hook is render-agnostic — pair it with any dialog/drawer/inline UI:
 *
 * @example
 * const modal = useWalletModal({
 *   onConnected: async (chainType, account) => {
 *     // App-specific side effect (e.g. terms-of-service check)
 *     await registerIfNew(chainType, account.address);
 *   },
 * });
 *
 * switch (modal.state.kind) {
 *   case 'closed':       return <button onClick={modal.open}>Connect</button>;
 *   case 'chainSelect':  return <ChainList onPick={modal.selectChain} onBack={modal.close} />;
 *   case 'walletSelect': return <WalletList chainType={modal.state.chainType} onPick={modal.selectWallet} onBack={modal.back} />;
 *   case 'connecting':   return <Spinner connector={modal.state.connector} />;
 *   case 'success':      return null; // onConnected fired; consumer can call modal.close()
 *   case 'error':        return <ErrorView error={modal.state.error} onRetry={modal.retry} onBack={modal.back} />;
 * }
 */
export function useWalletModal(options: UseWalletModalOptions = {}): UseWalletModalResult {
  const state = useWalletModalStore(s => s.walletModal);
  const open = useWalletModalStore(s => s.open);
  const close = useWalletModalStore(s => s.close);
  const back = useWalletModalStore(s => s.back);
  const selectChain = useWalletModalStore(s => s.selectChain);
  const setConnecting = useWalletModalStore(s => s.setConnecting);
  const setSuccess = useWalletModalStore(s => s.setSuccess);
  const setError = useWalletModalStore(s => s.setError);

  const { mutateAsync: connect } = useXConnect();
  const { onConnected } = options;

  const selectWallet = useCallback(
    async (connector: XConnector): Promise<XAccount | undefined> => {
      setConnecting(connector.xChainType, connector);
      try {
        const account = await connect(connector);
        if (account) {
          setSuccess(connector.xChainType, connector, account);
          await onConnected?.(connector.xChainType, account);
          return account;
        }
        // connect resolved with undefined — surface as a generic error so the
        // state machine reaches the error branch instead of getting stuck in
        // `connecting`.
        setError(
          connector.xChainType,
          connector,
          new Error(`useWalletModal: ${connector.id} connect resolved with no account`),
        );
        return undefined;
      } catch (raw) {
        const error = raw instanceof Error ? raw : new Error(String(raw));
        setError(connector.xChainType, connector, error);
        return undefined;
      }
    },
    [connect, onConnected, setConnecting, setError, setSuccess],
  );

  const retry = useCallback(async (): Promise<XAccount | undefined> => {
    if (state.kind !== 'error') return undefined;
    return selectWallet(state.connector);
  }, [state, selectWallet]);

  return { state, open, close, back, selectChain, selectWallet, retry };
}
