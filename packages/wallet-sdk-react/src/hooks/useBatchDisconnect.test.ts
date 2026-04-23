import { describe, it, expect, vi } from 'vitest';
import type { ChainType } from '@sodax/types';
import { resolveDisconnectTargets, runBatchDisconnect } from './useBatchDisconnect.js';
import type { XConnector } from '@/core/XConnector.js';
import type { XConnection } from '@/types/index.js';

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

function fakeConnection(xConnectorId: string, xChainType: ChainType, address = '0xABC'): XConnection {
  return {
    xAccount: { address, xChainType },
    xConnectorId,
  } as XConnection;
}

describe('resolveDisconnectTargets', () => {
  it('returns every connected chain when connectors is undefined', () => {
    const xConnections = {
      EVM: fakeConnection('metamask', 'EVM'),
      ICON: fakeConnection('hana', 'ICON'),
      BITCOIN: fakeConnection('unisat', 'BITCOIN'),
    } as Partial<Record<ChainType, XConnection>>;

    const targets = resolveDisconnectTargets(undefined, xConnections, {});
    expect(targets.sort()).toEqual(['BITCOIN', 'EVM', 'ICON']);
  });

  it('filters chains with empty address', () => {
    const xConnections = {
      EVM: fakeConnection('metamask', 'EVM'),
      ICON: { xAccount: { address: undefined, xChainType: 'ICON' }, xConnectorId: 'hana' },
    } as Partial<Record<ChainType, XConnection>>;

    expect(resolveDisconnectTargets(undefined, xConnections, {})).toEqual(['EVM']);
  });

  it('identifier match — returns only chains whose active connector matches', () => {
    const xConnections = {
      EVM: fakeConnection('hana-evm', 'EVM'),
      ICON: fakeConnection('hana-icon', 'ICON'),
      BITCOIN: fakeConnection('unisat', 'BITCOIN'),
    } as Partial<Record<ChainType, XConnection>>;
    const xConnectorsByChain = {
      EVM: [fakeConnector('hana-evm', 'Hana Wallet', 'EVM')],
      ICON: [fakeConnector('hana-icon', 'Hana Wallet', 'ICON')],
      BITCOIN: [fakeConnector('unisat', 'Unisat', 'BITCOIN')],
    } as Partial<Record<ChainType, XConnector[]>>;

    const targets = resolveDisconnectTargets(['hana'], xConnections, xConnectorsByChain);
    expect(targets.sort()).toEqual(['EVM', 'ICON']);
  });

  it('identifier match is case-insensitive and substring', () => {
    const xConnections = { ICON: fakeConnection('hana-icon', 'ICON') } as Partial<Record<ChainType, XConnection>>;
    const xConnectorsByChain = {
      ICON: [fakeConnector('hana-icon', 'Hana Wallet', 'ICON')],
    } as Partial<Record<ChainType, XConnector[]>>;

    expect(resolveDisconnectTargets(['HANA'], xConnections, xConnectorsByChain)).toEqual(['ICON']);
    expect(resolveDisconnectTargets(['na-ic'], xConnections, xConnectorsByChain)).toEqual(['ICON']);
  });

  it('skips chain when active connector is not in xConnectorsByChain (no lookup possible)', () => {
    const xConnections = { EVM: fakeConnection('unknown', 'EVM') } as Partial<Record<ChainType, XConnection>>;
    expect(resolveDisconnectTargets(['hana'], xConnections, { EVM: [] })).toEqual([]);
  });
});

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
    expect(disconnect).toHaveBeenNthCalledWith(1, 'EVM');
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
  });

  it('wraps non-Error thrown values into Error', async () => {
    const disconnect = vi.fn().mockRejectedValue('raw string');
    const result = await runBatchDisconnect(['EVM'] as ChainType[], disconnect);

    expect(result.failed[0]?.error).toBeInstanceOf(Error);
    expect(result.failed[0]?.error.message).toBe('raw string');
  });
});
