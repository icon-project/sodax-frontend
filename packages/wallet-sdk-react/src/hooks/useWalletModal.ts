import { useCallback, useRef } from 'react';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '@/core/XConnector.js';
import type { XAccount, XConnection } from '@/types/index.js';
import { useWalletModalStore, type WalletModalState } from '@/useWalletModalStore.js';
import { useXWalletStore } from '@/useXWalletStore.js';
import { useXConnect } from './useXConnect.js';

/** Default max wait for the Hydrator to populate `xConnections` after a
 *  provider-managed connect. Overridable per consumer via
 *  `UseWalletModalOptions.hydrationTimeoutMs`. */
const DEFAULT_HYDRATION_TIMEOUT_MS = 5_000;

/**
 * Subscribe to `useXWalletStore` for a connection whose `xConnectorId`
 * matches the connector we just asked to connect AND whose `xAccount` has
 * a non-empty address. Resolves with the account when it appears or
 * `undefined` when the timeout expires.
 *
 * Matching on `xConnectorId` is required — checking address alone is unsafe
 * when the chain already has a residual connection from a previous wallet
 * (e.g. user is on MetaMask for EVM and picks Rabby through the modal).
 * The existing `xConnections.EVM.xAccount.address` would otherwise satisfy
 * the wait immediately and the modal would `setSuccess(rabby, metamask_account)`
 * before the Hydrator replaces the connection.
 *
 * Provider-managed chains (EVM, Solana, Sui) populate `xConnections` via
 * their Hydrator components — `useXConnect`'s mutation resolves with
 * `undefined` because the account materializes asynchronously after wagmi
 * / wallet-adapter reports the connect as ready.
 */
function waitForXConnection(
  chainType: ChainType,
  expectedConnectorId: string,
  timeoutMs = DEFAULT_HYDRATION_TIMEOUT_MS,
): Promise<XAccount | undefined> {
  return new Promise(resolve => {
    let settled = false;
    const matches = (connection: XConnection | undefined): boolean =>
      connection?.xConnectorId === expectedConnectorId && !!connection?.xAccount?.address;

    const finish = (account: XAccount | undefined) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(account);
    };

    const timer = setTimeout(() => finish(undefined), timeoutMs);

    const unsubscribe = useXWalletStore.subscribe(state => {
      const connection = state.xConnections[chainType];
      if (matches(connection)) finish(connection?.xAccount);
    });

    // Immediate check — Hydrator may have already populated synchronously,
    // but only accept it when the connector identity matches. A residual
    // connection from a previously-connected wallet must NOT satisfy this wait.
    const initial = useXWalletStore.getState().xConnections[chainType];
    if (matches(initial)) finish(initial?.xAccount);
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
  /**
   * How long (ms) to wait for a provider-managed chain's Hydrator to populate
   * `xConnections[chainType]` with an account whose `xConnectorId` matches the
   * connector the user picked. Defaults to 5000ms. Raise this for slow
   * networks / wallets that take a long time to surface the account after
   * the user approves the popup. Ignored for non-provider chains (Bitcoin,
   * ICON, Stellar, NEAR, Stacks, Injective) — those return the account
   * directly from `connect()`.
   */
  hydrationTimeoutMs?: number;
};

/**
 * WalletConnect UX caveat
 * -----------------------
 * When the user picks an EVM WalletConnect connector, wagmi opens its own QR
 * modal as a third-party UI. While that QR modal is visible, `useWalletModal`
 * stays in `connecting` — the consumer may prefer to auto-hide the Sodax
 * modal to avoid two dialogs stacking. Detect WC via
 * `state.kind === 'connecting' && state.connector.id === 'walletConnect'`
 * (wagmi's connector id) and conditionally render `null` until the attempt
 * resolves. Not wired into the SDK because partners integrating their own
 * dialog system decide the policy (hide, fade, keep).
 */

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
   * throwing.
   *
   * Concurrency:
   * - Same connector already in flight → returns the same promise (dedupes
   *   double-clicks).
   * - Different connector clicked before the previous attempt settles → starts
   *   a new attempt; the previous attempt's late resolution is dropped and
   *   does not overwrite the current state.
   * - User calls `back()` / `close()` mid-connect → the in-flight attempt's
   *   late resolution is dropped and does not transition to `success`/`error`.
   *
   * `back()` / `close()` mid-connect caveat: if the wallet already approved
   * before the transition, `xConnections` is populated by `useXConnect` /
   * the Hydrator independently of the modal state machine. Leaving the
   * `connecting` state only drops the pending `success`/`error` transition
   * — the account stays connected. Call `useXDisconnect(chainType)` from
   * the same handler that calls `back()` / `close()` if a full rollback is
   * required.
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
  const { onConnected, hydrationTimeoutMs } = options;

  // Dedupe concurrent `selectWallet` calls for the SAME connector. Calls with
  // a DIFFERENT connector are allowed to start a new attempt — the previous
  // attempt is cancelled via the `isStillCurrent` state check below.
  const inFlightRef = useRef<{ connector: XConnector; promise: Promise<XAccount | undefined> } | null>(null);

  const selectWallet = useCallback(
    async (connector: XConnector): Promise<XAccount | undefined> => {
      // Same connector already in flight → return the existing promise so
      // double-clicks don't open two popups or race two state writes.
      if (inFlightRef.current?.connector === connector) {
        return inFlightRef.current.promise;
      }

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

      // Read the store directly (not the React snapshot) so `isStillCurrent`
      // sees user-driven transitions — `back()` / `close()` / a subsequent
      // `selectWallet(otherConnector)` — that happen while the connect promise
      // is in flight. Without this, a late-resolving connect would overwrite
      // the user's cancel and the modal would jump to `success` / `error`
      // (and `onConnected` would fire) for a flow the user walked away from.
      const isStillCurrent = (): boolean => {
        const current = useWalletModalStore.getState().walletModal;
        return current.kind === 'connecting' && current.connector === connector;
      };

      const promise = (async (): Promise<XAccount | undefined> => {
        setConnecting(connector.xChainType, connector);
        try {
          // Non-provider-managed chains (Bitcoin, ICON, Stellar, NEAR, Stacks,
          // Injective) return the account directly. Provider-managed chains
          // (EVM, Solana, Sui) resolve with `undefined` and populate
          // xConnections via their Hydrator — wait for that, scoped to this
          // connector's id so a residual connection from a previously-connected
          // wallet on the same chain doesn't satisfy the wait.
          const direct = await connect(connector);
          if (!isStillCurrent()) return undefined;

          const account = direct?.address
            ? direct
            : await waitForXConnection(connector.xChainType, connector.id, hydrationTimeoutMs);
          if (!isStillCurrent()) return undefined;

          if (account?.address) {
            setSuccess(connector.xChainType, connector, account);
            // `onConnected` runs app-side effects (registration check, ToS,
            // routing). A throw here must NOT downgrade a successful connect
            // to `error` — the connection is already persisted in the store
            // and the user is really connected. Log and keep `success`.
            try {
              await onConnected?.(connector.xChainType, account);
            } catch (callbackError) {
              console.error('[useWalletModal] onConnected threw — connection is still successful:', callbackError);
            }
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
          if (!isStillCurrent()) return undefined;
          const error = raw instanceof Error ? raw : new Error(String(raw));
          setError(connector.xChainType, connector, error);
          return undefined;
        } finally {
          // Only clear the slot if it still holds this connector's promise —
          // a `selectWallet(otherConnector)` call mid-flight reassigns it, and
          // we mustn't clobber the new entry on our late finally.
          if (inFlightRef.current?.connector === connector) {
            inFlightRef.current = null;
          }
        }
      })();

      inFlightRef.current = { connector, promise };
      return promise;
    },
    [connect, onConnected, hydrationTimeoutMs, setConnecting, setError, setSuccess],
  );

  const retry = useCallback(async (): Promise<XAccount | undefined> => {
    if (state.kind !== 'error') return undefined;
    return selectWallet(state.connector);
  }, [state, selectWallet]);

  return { state, open, close, back, selectChain, selectWallet, retry };
}
