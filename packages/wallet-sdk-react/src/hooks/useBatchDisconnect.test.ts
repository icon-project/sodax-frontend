import { describe, it, expect, vi } from 'vitest';
import type { ChainType } from '@sodax/types';
import { runBatchDisconnect } from './useBatchDisconnect.js';

describe('runBatchDisconnect', () => {
  it('empty chainTypes → empty result', async () => {
    const result = await runBatchDisconnect([], vi.fn());
    expect(result).toEqual({ successful: [], failed: [] });
  });

  it('runs sequentially and collects successful', async () => {
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const result = await runBatchDisconnect(['EVM', 'ICON', 'SOLANA'] as ChainType[], disconnect);

    expect(result.successful).toEqual(['EVM', 'ICON', 'SOLANA']);
    expect(result.failed).toEqual([]);
    expect(disconnect).toHaveBeenCalledTimes(3);
    expect(disconnect).toHaveBeenNthCalledWith(1, 'EVM');
    expect(disconnect).toHaveBeenNthCalledWith(2, 'ICON');
    expect(disconnect).toHaveBeenNthCalledWith(3, 'SOLANA');
  });

  it('best-effort — continues batch after per-chain failures', async () => {
    const disconnect = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('disconnect failed'))
      .mockResolvedValueOnce(undefined);

    const result = await runBatchDisconnect(['EVM', 'ICON', 'SOLANA'] as ChainType[], disconnect);

    expect(result.successful).toEqual(['EVM', 'SOLANA']);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.chainType).toBe('ICON');
    expect(result.failed[0]?.error.message).toBe('disconnect failed');
    expect(disconnect).toHaveBeenCalledTimes(3);
  });

  it('wraps non-Error thrown values into Error', async () => {
    const disconnect = vi.fn().mockRejectedValue('raw string');
    const result = await runBatchDisconnect(['EVM'] as ChainType[], disconnect);

    expect(result.failed[0]?.error).toBeInstanceOf(Error);
    expect(result.failed[0]?.error.message).toBe('raw string');
  });
});
