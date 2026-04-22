import { useCallback, useRef, useState } from 'react';
import type { ChainType } from '@sodax/types';
import type { XAccount } from '../types/index.js';
import type { XConnector } from '../core/XConnector.js';
import { useXConnect } from './useXConnect.js';
import { useXDisconnect } from './useXDisconnect.js';

export type ConnectionStatus = 'idle' | 'connecting' | 'success' | 'error';

export type UseConnectionFlowResult = {
  /** `'idle' | 'connecting' | 'success' | 'error'` — reflects the last attempt. */
  status: ConnectionStatus;
  /** Raw error from the last failed attempt; null when no error. Inspect `activeConnector.isInstalled` for the install-CTA branch. */
  error: Error | null;
  /** Connector the current / last attempt targeted. */
  activeConnector: XConnector | null;
  /** Chain the current / last attempt targeted. */
  activeChainType: ChainType | null;
  /** Connect and return the resolved account. Errors populate `error` instead of throwing. */
  connect: (connector: XConnector) => Promise<XAccount | undefined>;
  /** Disconnect a specific chain. Matches `useXDisconnect` semantics. */
  disconnect: (chainType: ChainType) => Promise<void>;
  /** Re-runs the last attempted `connect(connector)`. No-op if no prior attempt. */
  retry: () => Promise<XAccount | undefined>;
  /** Clears `status`, `error`, and `activeConnector`. */
  reset: () => void;
};

/**
 * Wrapper around `useXConnect` + `useXDisconnect` that surfaces the raw error
 * on state instead of throwing, plus tracks the active connector and exposes
 * `retry()`. Unlike calling `useXConnect` directly, `connect()` here never
 * throws — errors flow into `error` so render code stays linear.
 *
 * For the "install CTA" branch, read `activeConnector.isInstalled` and
 * `activeConnector.installUrl` (populated by Phase 1). No error classification
 * is done here — consumers log the raw error for unrecognized cases.
 *
 * @example
 * const { status, error, connect, retry, activeConnector } = useConnectionFlow();
 *
 * if (status === 'error' && error) {
 *   if (activeConnector && !activeConnector.isInstalled) {
 *     return <a href={activeConnector.installUrl}>Install →</a>;
 *   }
 *   return <button onClick={retry}>Failed — retry</button>;
 * }
 *
 * return (
 *   <button onClick={() => connect(connector)} disabled={status === 'connecting'}>
 *     {status === 'connecting' ? 'Waiting for wallet…' : 'Connect'}
 *   </button>
 * );
 */
export function useConnectionFlow(): UseConnectionFlowResult {
  const mutation = useXConnect();
  const disconnect = useXDisconnect();

  const [error, setError] = useState<Error | null>(null);
  const [activeConnector, setActiveConnector] = useState<XConnector | null>(null);
  const lastConnectorRef = useRef<XConnector | null>(null);

  const connect = useCallback(
    async (connector: XConnector) => {
      lastConnectorRef.current = connector;
      setActiveConnector(connector);
      setError(null);
      try {
        return await mutation.mutateAsync(connector);
      } catch (raw) {
        setError(raw instanceof Error ? raw : new Error(String(raw)));
        return undefined;
      }
    },
    [mutation],
  );

  const retry = useCallback(async () => {
    const last = lastConnectorRef.current;
    if (!last) return undefined;
    return connect(last);
  }, [connect]);

  const reset = useCallback(() => {
    mutation.reset();
    setError(null);
    setActiveConnector(null);
    lastConnectorRef.current = null;
  }, [mutation]);

  const status: ConnectionStatus = error
    ? 'error'
    : mutation.isPending
      ? 'connecting'
      : mutation.isSuccess
        ? 'success'
        : 'idle';

  return {
    status,
    error,
    activeConnector,
    activeChainType: activeConnector?.xChainType ?? null,
    connect,
    disconnect,
    retry,
    reset,
  };
}
