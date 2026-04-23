import { useCallback } from 'react';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '@/core/XConnector.js';
import type { XAccount } from '@/types/index.js';
import { WALLET_MODAL_HYDRATION_TIMEOUT_MS } from '@/constants.js';
import { useWalletModalStore, type WalletModalState } from '@/useWalletModalStore.js';
import { useXWalletStore } from '@/useXWalletStore.js';
import { useXConnect } from './useXConnect.js';

/**
 * Subscribe to `useXWalletStore` for an `xConnections[chainType].xAccount`
 * with a non-empty address, resolving with the account when it appears or
 * `undefined` when the timeout expires.
 *
 * Provider-managed chains (EVM, Solana, Sui) populate `xConnections` via
 * their Hydrator components — `useXConnect`'s mutation resolves with
 * `undefined` because the account materializes asynchronously after wagmi
 * / wallet-adapter reports the connect as ready.
 */
function waitForXConnection(
  chainType: ChainType,
  timeoutMs = WALLET_MODAL_HYDRATION_TIMEOUT_MS,
): Promise<XAccount | undefined> {
  return new Promise(resolve => {
    let settled = false;
    const finish = (account: XAccount | undefined) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(account);
    };

    const timer = setTimeout(() => finish(undefined), timeoutMs);

    const unsubscribe = useXWalletStore.subscribe(state => {
      const account = state.xConnections[chainType]?.xAccount;
      if (account?.address) finish(account);
    });

    // Immediate check — Hydrator may have already populated synchronously.
    const initial = useXWalletStore.getState().xConnections[chainType]?.xAccount;
    if (initial?.address) finish(initial);
  });
}

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
      // Pre-check installation. Some legacy connectors (e.g. IconHanaXConnector)
      // imperatively `window.open(installUrl)` from inside `connect()` when
      // the extension isn't injected — that hides the error and leaves the
      // state machine stuck in `connecting` until the timeout. Surface it
      // up-front so the modal renders an actionable error immediately.
      if (!connector.isInstalled) {
        const installHint = connector.installUrl ? ' Install the extension and reload the page.' : '';
        setError(
          connector.xChainType,
          connector,
          new Error(`${connector.name} is not installed.${installHint}`),
        );
        return undefined;
      }

      setConnecting(connector.xChainType, connector);
      try {
        // Non-provider-managed chains (Bitcoin, ICON, Stellar, NEAR, Stacks,
        // Injective) return the account directly. Provider-managed chains
        // (EVM, Solana, Sui) resolve with `undefined` and populate
        // xConnections via their Hydrator — wait for that.
        const direct = await connect(connector);
        const account = direct?.address ? direct : await waitForXConnection(connector.xChainType);

        if (account?.address) {
          setSuccess(connector.xChainType, connector, account);
          await onConnected?.(connector.xChainType, account);
          return account;
        }

        // Hydrator never populated within the timeout window — most likely
        // the user closed the popup or the wallet failed silently.
        setError(
          connector.xChainType,
          connector,
          new Error('Connection did not complete. Did you close the wallet popup?'),
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
