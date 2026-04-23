import { useCallback, useRef, useState } from 'react';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '@/core/XConnector.js';
import type { XConnection } from '@/types/index.js';
import { matchesConnectorIdentifier } from '@/utils/matchConnectorIdentifier.js';
import { useXWalletStore } from '@/useXWalletStore.js';
import { useXDisconnect } from './useXDisconnect.js';

export type BatchDisconnectResult = {
  /** Chain types where disconnect succeeded. */
  successful: ChainType[];
  /** Chain types where disconnect threw, paired with the raw error. */
  failed: Array<{ chainType: ChainType; error: Error }>;
};

export type UseBatchDisconnectOptions = {
  /**
   * Wallet identifiers to scope the disconnect. Each entry is compared
   * case-insensitively against `connector.id` and `connector.name` (substring
   * match). Only chains whose *currently active* connector matches at least
   * one identifier are disconnected.
   *
   * Omit this field to disconnect every currently-connected chain regardless
   * of which wallet is active.
   *
   * @example ['hana']           // disconnect every chain Hana is connected on
   * @example ['hana', 'xverse'] // disconnect chains with Hana OR Xverse active
   */
  connectors?: readonly string[];
};

export type UseBatchDisconnectResult = {
  run: () => Promise<BatchDisconnectResult>;
  status: 'idle' | 'running' | 'done';
  result: BatchDisconnectResult | null;
  reset: () => void;
};

/**
 * Pure helper — returns the list of currently-connected chains whose active
 * connector matches at least one supplied identifier. When `connectors` is
 * `undefined`, every currently-connected chain is returned.
 * Extracted for testability without mounting React.
 */
export function resolveDisconnectTargets(
  connectors: readonly string[] | undefined,
  xConnections: Partial<Record<ChainType, XConnection>>,
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>,
): ChainType[] {
  const targets: ChainType[] = [];
  for (const [chainType, connection] of Object.entries(xConnections)) {
    if (!connection?.xAccount.address) continue;
    if (!connectors) {
      targets.push(chainType as ChainType);
      continue;
    }
    const activeConnector = xConnectorsByChain[chainType as ChainType]?.find(
      c => c.id === connection.xConnectorId,
    );
    if (!activeConnector) continue;
    if (connectors.some(identifier => matchesConnectorIdentifier(activeConnector, identifier))) {
      targets.push(chainType as ChainType);
    }
  }
  return targets;
}

/**
 * Pure helper — runs disconnect sequentially over `chainTypes`.
 * Extracted for testability.
 */
export async function runBatchDisconnect(
  chainTypes: readonly ChainType[],
  disconnect: (chainType: ChainType) => Promise<void>,
): Promise<BatchDisconnectResult> {
  const successful: ChainType[] = [];
  const failed: BatchDisconnectResult['failed'] = [];

  for (const chainType of chainTypes) {
    try {
      await disconnect(chainType);
      successful.push(chainType);
    } catch (raw) {
      failed.push({
        chainType,
        error: raw instanceof Error ? raw : new Error(String(raw)),
      });
    }
  }

  return { successful, failed };
}

/**
 * Disconnect chains sequentially, optionally scoped to a specific wallet.
 * Mirrors {@link useBatchConnect}'s identifier-based API:
 *
 * @example
 * // Disconnect every chain Hana is currently connected on
 * const { run } = useBatchDisconnect({ connectors: ['hana'] });
 * await run();
 *
 * @example
 * // Disconnect every currently-connected chain regardless of wallet
 * const { run } = useBatchDisconnect();
 * await run();
 *
 * Best-effort: errors are collected, not thrown. `run()` is idempotent — a
 * double-invocation while one batch is in flight returns the same promise.
 */
export function useBatchDisconnect(options: UseBatchDisconnectOptions = {}): UseBatchDisconnectResult {
  const { connectors } = options;
  const disconnect = useXDisconnect();
  const xConnections = useXWalletStore(s => s.xConnections);
  const xConnectorsByChain = useXWalletStore(s => s.xConnectorsByChain);

  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [result, setResult] = useState<BatchDisconnectResult | null>(null);
  const inFlightRef = useRef<Promise<BatchDisconnectResult> | null>(null);

  const run = useCallback(async (): Promise<BatchDisconnectResult> => {
    if (inFlightRef.current) return inFlightRef.current;

    const batchPromise = (async () => {
      setStatus('running');
      const targets = resolveDisconnectTargets(connectors, xConnections, xConnectorsByChain);
      const finalResult = await runBatchDisconnect(targets, disconnect);
      setResult(finalResult);
      setStatus('done');
      return finalResult;
    })();

    inFlightRef.current = batchPromise;
    try {
      return await batchPromise;
    } finally {
      inFlightRef.current = null;
    }
  }, [connectors, disconnect, xConnections, xConnectorsByChain]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);

  return { run, status, result, reset };
}
