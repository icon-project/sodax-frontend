import { describe, it, expect, vi } from 'vitest';
import type { ChainType } from '@sodax/types';
import { resolveBatchTargets, runBatchConnect } from './useBatchConnect.js';
import type { XConnector } from '../core/XConnector.js';

function fakeConnector(id: string, name: string, xChainType: ChainType): XConnector {
  return {
    xChainType,
    name,
    id,
    icon: undefined,
    isInstalled: true,
    connect: async () => undefined,
    disconnect: async () => undefined,
  } as XConnector;
}

describe('resolveBatchTargets', () => {
  it('empty connectors → empty targets', () => {
    const connectorsByChain = {
      EVM: [fakeConnector('hana', 'Hana Wallet', 'EVM' as ChainType)],
    } satisfies Partial<Record<ChainType, XConnector[]>>;

    expect(resolveBatchTargets([], connectorsByChain)).toEqual([]);
  });

  it('matches by id (case-insensitive, substring)', () => {
    const hana = fakeConnector('hana', 'Hana Wallet', 'ICON' as ChainType);
    const connectorsByChain = { ICON: [hana] } satisfies Partial<Record<ChainType, XConnector[]>>;

    const targets = resolveBatchTargets(['HANA'], connectorsByChain);
    expect(targets).toEqual([{ chainType: 'ICON', connector: hana }]);
  });

  it('matches by name substring', () => {
    const hana = fakeConnector('h', 'Hana Wallet', 'ICON' as ChainType);
    const connectorsByChain = { ICON: [hana] } satisfies Partial<Record<ChainType, XConnector[]>>;

    const targets = resolveBatchTargets(['hana'], connectorsByChain);
    expect(targets).toEqual([{ chainType: 'ICON', connector: hana }]);
  });

  it('first matching identifier per chain wins (fallback order)', () => {
    const hana = fakeConnector('hana', 'Hana Wallet', 'SOLANA' as ChainType);
    const phantom = fakeConnector('phantom', 'Phantom', 'SOLANA' as ChainType);
    const connectorsByChain = {
      SOLANA: [phantom, hana],
    } satisfies Partial<Record<ChainType, XConnector[]>>;

    const targets = resolveBatchTargets(['hana', 'phantom'], connectorsByChain);
    expect(targets).toEqual([{ chainType: 'SOLANA', connector: hana }]);
  });

  it('falls back to next identifier when first has no match on a chain', () => {
    const phantom = fakeConnector('phantom', 'Phantom', 'SOLANA' as ChainType);
    const connectorsByChain = {
      SOLANA: [phantom],
    } satisfies Partial<Record<ChainType, XConnector[]>>;

    const targets = resolveBatchTargets(['hana', 'phantom'], connectorsByChain);
    expect(targets).toEqual([{ chainType: 'SOLANA', connector: phantom }]);
  });

  it('spans every chain where a match exists', () => {
    const hanaEvm = fakeConnector('hana', 'Hana', 'EVM' as ChainType);
    const hanaIcon = fakeConnector('hana', 'Hana', 'ICON' as ChainType);
    const metamask = fakeConnector('metamask', 'MetaMask', 'EVM' as ChainType);
    const connectorsByChain = {
      EVM: [metamask, hanaEvm],
      ICON: [hanaIcon],
      BITCOIN: [fakeConnector('unisat', 'Unisat', 'BITCOIN' as ChainType)],
    } satisfies Partial<Record<ChainType, XConnector[]>>;

    const targets = resolveBatchTargets(['hana'], connectorsByChain);
    expect(targets.map(t => t.chainType).sort()).toEqual(['EVM', 'ICON']);
  });

  it('skips chains with no connectors', () => {
    const connectorsByChain = {
      EVM: undefined,
      ICON: [fakeConnector('hana', 'Hana', 'ICON' as ChainType)],
    } satisfies Partial<Record<ChainType, XConnector[]>>;

    const targets = resolveBatchTargets(['hana'], connectorsByChain);
    expect(targets).toHaveLength(1);
    expect(targets[0]?.chainType).toBe('ICON');
  });
});

describe('runBatchConnect', () => {
  it('empty targets → empty result', async () => {
    const result = await runBatchConnect([], {
      connect: vi.fn(),
      isConnected: () => false,
      skipConnected: false,
    });
    expect(result).toEqual({ successful: [], failed: [], skipped: [] });
  });

  it('runs sequentially and collects successful', async () => {
    const connect = vi.fn().mockResolvedValue({ address: '0xABC', xChainType: 'EVM' });
    const targets = [
      { chainType: 'EVM' as ChainType, connector: fakeConnector('m', 'MetaMask', 'EVM') },
      { chainType: 'ICON' as ChainType, connector: fakeConnector('h', 'Hana', 'ICON') },
    ];

    const result = await runBatchConnect(targets, {
      connect,
      isConnected: () => false,
      skipConnected: false,
    });

    expect(result.successful).toEqual(['EVM', 'ICON']);
    expect(result.failed).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it('collects per-target failures without stopping the batch', async () => {
    const connect = vi.fn()
      .mockResolvedValueOnce({ address: '0xABC', xChainType: 'EVM' })
      .mockRejectedValueOnce(new Error('user rejected'))
      .mockResolvedValueOnce({ address: 'SoL', xChainType: 'SOLANA' });

    const targets = [
      { chainType: 'EVM' as ChainType, connector: fakeConnector('m', 'MetaMask', 'EVM') },
      { chainType: 'ICON' as ChainType, connector: fakeConnector('h', 'Hana', 'ICON') },
      { chainType: 'SOLANA' as ChainType, connector: fakeConnector('p', 'Phantom', 'SOLANA') },
    ];

    const result = await runBatchConnect(targets, {
      connect,
      isConnected: () => false,
      skipConnected: false,
    });

    expect(result.successful).toEqual(['EVM', 'SOLANA']);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.chainType).toBe('ICON');
    expect(result.failed[0]?.error.message).toBe('user rejected');
    expect(connect).toHaveBeenCalledTimes(3);
  });

  it('wraps non-Error thrown values into Error', async () => {
    const connect = vi.fn().mockRejectedValue('plain string');
    const targets = [{ chainType: 'EVM' as ChainType, connector: fakeConnector('m', 'MetaMask', 'EVM') }];

    const result = await runBatchConnect(targets, {
      connect,
      isConnected: () => false,
      skipConnected: false,
    });

    expect(result.failed[0]?.error).toBeInstanceOf(Error);
    expect(result.failed[0]?.error.message).toBe('plain string');
  });

  it('skipConnected: false → attempts every target even if already connected', async () => {
    const connect = vi.fn().mockResolvedValue({ address: '0x', xChainType: 'EVM' });
    const targets = [{ chainType: 'EVM' as ChainType, connector: fakeConnector('m', 'MetaMask', 'EVM') }];

    const result = await runBatchConnect(targets, {
      connect,
      isConnected: () => true,
      skipConnected: false,
    });

    expect(result.skipped).toEqual([]);
    expect(result.successful).toEqual(['EVM']);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('skipConnected: true → skips already-connected chains', async () => {
    const connect = vi.fn().mockResolvedValue({ address: '0x', xChainType: 'SOLANA' });
    const targets = [
      { chainType: 'EVM' as ChainType, connector: fakeConnector('m', 'MetaMask', 'EVM') },
      { chainType: 'SOLANA' as ChainType, connector: fakeConnector('p', 'Phantom', 'SOLANA') },
    ];

    const result = await runBatchConnect(targets, {
      connect,
      isConnected: ct => ct === 'EVM',
      skipConnected: true,
    });

    expect(result.skipped).toEqual(['EVM']);
    expect(result.successful).toEqual(['SOLANA']);
    expect(connect).toHaveBeenCalledTimes(1);
  });
});
