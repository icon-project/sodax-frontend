import { useCallback, useRef, useState } from 'react';
import type { ChainType } from '@sodax/types';
import type { XConnector } from '@/core/XConnector.js';
import type { XAccount } from '@/types/index.js';
import { assert } from '@/shared/guards.js';
import { useXWalletStore } from '@/useXWalletStore.js';
import { matchesConnectorIdentifier } from '@/utils/matchConnectorIdentifier.js';
import { useXConnect } from './useXConnect.js';

/**
 * Per-target event emitted by `onProgress` as the batch advances. Lets consumers
 * render a live "EVM: connecting… done; ICON: skipped; SUI: connecting…" log
 * instead of waiting for the final `run()` promise.
 */
export type BatchConnectProgressEvent =
  | { chainType: ChainType; outcome: 'success' }
  | { chainType: ChainType; outcome: 'failure'; error: Error }
  | { chainType: ChainType; outcome: 'skipped' };

export type BatchConnectResult = {
  /** Chain types where the connect attempt succeeded. */
  successful: ChainType[];
  /** Chain types where the connect attempt threw, paired with the raw error. */
  failed: Array<{ chainType: ChainType; error: Error }>;
  /** Chain types skipped because `{ skipConnected: true }` and an account was already present. */
  skipped: ChainType[];
};

export type UseBatchConnectOptions = {
  /**
   * Wallet brand identifiers (e.g. `'hana'`, `'phantom'`). Matched via
   * case-insensitive substring against `connector.id` and `connector.name` —
   * see {@link matchesConnectorIdentifier}. For each enabled chain, the first
   * identifier that resolves to an installed connector wins; later identifiers
   * act as fallbacks.
   *
   * To target a specific connector (not a brand), use
   * `useXConnectors(chainType).find(c => c.id === '...')` directly instead of
   * this API.
   *
   * @example ['hana']            // Hana across every chain it supports
   * @example ['hana', 'phantom']  // prefer Hana, fall back to Phantom (e.g. Solana)
   */
  connectors: readonly string[];
  /** Skip chains whose account is already connected at `run()` time. */
  skipConnected?: boolean;
  /**
   * Fires once per target as the batch progresses. Useful for live progress UI
   * (a spinner-per-chain list). Errors thrown from `onProgress` are caught and
   * logged — they do NOT fail the batch.
   */
  onProgress?: (event: BatchConnectProgressEvent) => void;
};

export type UseBatchConnectResult = {
  run: () => Promise<BatchConnectResult>;
  status: 'idle' | 'running' | 'done';
  result: BatchConnectResult | null;
  reset: () => void;
};

type BatchConnectTarget = {
  chainType: ChainType;
  connector: XConnector;
};

/**
 * Pure helper — resolves user-supplied wallet identifiers to concrete
 * `{ chainType, connector }` targets across every chain the wallet is
 * available on. First matching identifier wins per chain.
 * Extracted for testability without mounting React.
 */
export function resolveBatchTargets(
  connectors: readonly string[],
  connectorsByChain: Partial<Record<ChainType, XConnector[]>>,
): BatchConnectTarget[] {
  const targets: BatchConnectTarget[] = [];
  for (const [chainType, chainConnectors] of Object.entries(connectorsByChain)) {
    if (!chainConnectors?.length) continue;
    for (const identifier of connectors) {
      const match = chainConnectors.find(c => matchesConnectorIdentifier(c, identifier));
      if (match) {
        targets.push({ chainType: chainType as ChainType, connector: match });
        break;
      }
    }
  }
  return targets;
}

/**
 * Pure helper — runs the batch sequentially over resolved `targets`, calling
 * `connect` per target. `isConnected` is queried per chain when `skipConnected`
 * is on. `onProgress` fires per target and is isolated from the batch result —
 * a throwing callback is logged, never propagated.
 * Extracted for testability without mounting React.
 */
export async function runBatchConnect(
  targets: readonly BatchConnectTarget[],
  helpers: {
    connect: (connector: XConnector) => Promise<XAccount | undefined>;
    isConnected: (chainType: ChainType) => boolean;
    skipConnected: boolean;
    onProgress?: (event: BatchConnectProgressEvent) => void;
  },
): Promise<BatchConnectResult> {
  const successful: ChainType[] = [];
  const failed: BatchConnectResult['failed'] = [];
  const skipped: ChainType[] = [];

  const emit = (event: BatchConnectProgressEvent): void => {
    if (!helpers.onProgress) return;
    try {
      helpers.onProgress(event);
    } catch (err) {
      console.error('[useBatchConnect] onProgress threw:', err);
    }
  };

  for (const target of targets) {
    if (helpers.skipConnected && helpers.isConnected(target.chainType)) {
      skipped.push(target.chainType);
      emit({ chainType: target.chainType, outcome: 'skipped' });
      continue;
    }
    try {
      await helpers.connect(target.connector);
      successful.push(target.chainType);
      emit({ chainType: target.chainType, outcome: 'success' });
    } catch (raw) {
      const error = raw instanceof Error ? raw : new Error(String(raw));
      failed.push({ chainType: target.chainType, error });
      emit({ chainType: target.chainType, outcome: 'failure', error });
    }
  }

  return { successful, failed, skipped };
}

/**
 * Connect every chain where one of the supplied wallet identifiers matches
 * an available connector. Sequential (safe for extensions that share popup
 * singletons); errors never throw from `run()` — failures are collected into
 * `result.failed`.
 *
 * Replaces the apps/web-era per-wallet wrappers
 * (`useConnectAllWithHana`, `useConnectRestWithHana`): pass the wallet name(s)
 * and the hook discovers all compatible chains from the registry.
 *
 * @example
 * // Connect Hana on every chain it supports (EVM, ICON, Solana, Sui, Stellar...)
 * const { run, status, result } = useBatchConnect({ connectors: ['hana'] });
 * await run();
 *
 * @example
 * // Only connect chains not already connected
 * const { run } = useBatchConnect({ connectors: ['hana'], skipConnected: true });
 * await run();
 */
export function useBatchConnect(options: UseBatchConnectOptions): UseBatchConnectResult {
  assert(Array.isArray(options.connectors), 'useBatchConnect: options.connectors must be an array');
  const { connectors, skipConnected = false, onProgress } = options;
  const { mutateAsync: connect } = useXConnect();
  const xConnectorsByChain = useXWalletStore(s => s.xConnectorsByChain);
  const xConnections = useXWalletStore(s => s.xConnections);

  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [result, setResult] = useState<BatchConnectResult | null>(null);
  const inFlightRef = useRef<Promise<BatchConnectResult> | null>(null);

  // Keep `onProgress` in a ref so `run` doesn't need to list it as a dep —
  // consumers typically pass an inline function (new ref every render) and
  // rebuilding `run` each render would invalidate downstream `useEffect` deps.
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const run = useCallback(async (): Promise<BatchConnectResult> => {
    // Concurrent-run guard — extensions share popup singletons, so a second
    // batch while one is in flight would race the first. Return the existing
    // promise so callers that double-click still get a result.
    if (inFlightRef.current) return inFlightRef.current;

    const batchPromise = (async () => {
      setStatus('running');
      const targets = resolveBatchTargets(connectors, xConnectorsByChain);
      const finalResult = await runBatchConnect(targets, {
        connect,
        isConnected: chainType => !!xConnections[chainType]?.xAccount.address,
        skipConnected,
        onProgress: event => onProgressRef.current?.(event),
      });
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
  }, [connect, connectors, xConnectorsByChain, xConnections, skipConnected]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);

  return { run, status, result, reset };
}
