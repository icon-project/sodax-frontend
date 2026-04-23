import { useCallback, useState } from 'react';
import type { ChainType } from '@sodax/types';
import { useXWalletStore } from '../useXWalletStore.js';
import { useXDisconnect } from './useXDisconnect.js';

export type BatchDisconnectResult = {
  /** Chain types where disconnect succeeded. */
  successful: ChainType[];
  /** Chain types where disconnect threw, paired with the raw error. */
  failed: Array<{ chainType: ChainType; error: Error }>;
};

export type UseBatchDisconnectResult = {
  /**
   * Disconnect the given chains sequentially. If `chainTypes` is omitted,
   * disconnects every chain that currently holds a connected account.
   */
  run: (chainTypes?: readonly ChainType[]) => Promise<BatchDisconnectResult>;
  status: 'idle' | 'running' | 'done';
  result: BatchDisconnectResult | null;
  reset: () => void;
};

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
 * Disconnect multiple chains sequentially with a shared result accumulator.
 * Generalizes apps/web's `useDisconnectAllWithHana` into a wallet-agnostic
 * primitive.
 *
 * Best-effort by default — errors are collected, not thrown. Every chain
 * in the target list is attempted regardless of earlier failures.
 *
 * @example
 * const { run, status, result } = useBatchDisconnect();
 *
 * // Disconnect every currently-connected chain
 * await run();
 *
 * // Disconnect specific chains
 * await run(['EVM', 'ICON']);
 */
export function useBatchDisconnect(): UseBatchDisconnectResult {
  const disconnect = useXDisconnect();
  const xConnections = useXWalletStore(s => s.xConnections);

  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [result, setResult] = useState<BatchDisconnectResult | null>(null);

  const run = useCallback(
    async (chainTypes?: readonly ChainType[]): Promise<BatchDisconnectResult> => {
      setStatus('running');
      const targets =
        chainTypes ??
        (Object.keys(xConnections) as ChainType[]).filter(ct => xConnections[ct]?.xAccount.address);
      const finalResult = await runBatchDisconnect(targets, disconnect);
      setResult(finalResult);
      setStatus('done');
      return finalResult;
    },
    [disconnect, xConnections],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);

  return { run, status, result, reset };
}
