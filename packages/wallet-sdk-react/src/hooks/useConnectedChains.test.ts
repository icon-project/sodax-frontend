import { describe, it, expect } from 'vitest';
import type { ChainType } from '@sodax/types';
import { buildConnectedChains } from './useConnectedChains.js';
import type { XConnector } from '../core/index.js';

function fakeConnector(overrides: Partial<XConnector> & { id: string }): XConnector {
  return {
    xChainType: 'BITCOIN',
    name: overrides.id,
    icon: undefined,
    isInstalled: true,
    connect: async () => undefined,
    disconnect: async () => undefined,
    ...overrides,
  } as XConnector;
}

describe('buildConnectedChains', () => {
  it('empty connections → empty chains, total 0', () => {
    const result = buildConnectedChains({}, {});
    expect(result.chains).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('only counts chains with non-empty address', () => {
    const result = buildConnectedChains(
      {
        EVM: { xAccount: { address: '0xABC', xChainType: 'EVM' }, xConnectorId: 'metamask' },
        ICON: { xAccount: { address: undefined, xChainType: 'ICON' }, xConnectorId: 'hana' },
        SOLANA: { xAccount: { address: 'SoL123', xChainType: 'SOLANA' }, xConnectorId: 'phantom' },
      },
      {},
    );
    expect(result.chains.map(c => c.chainType).sort()).toEqual(['EVM', 'SOLANA']);
    expect(result.total).toBe(2);
  });

  it('exposes per-chain address via chains array', () => {
    const result = buildConnectedChains(
      { EVM: { xAccount: { address: '0xABC', xChainType: 'EVM' }, xConnectorId: 'metamask' } },
      {},
    );
    expect(result.chains.find(c => c.chainType === 'EVM')?.account.address).toBe('0xABC');
  });

  it('connectorName + connectorIcon looked up from xConnectorsByChain', () => {
    const result = buildConnectedChains(
      { BITCOIN: { xAccount: { address: 'bc1q', xChainType: 'BITCOIN' }, xConnectorId: 'unisat' } },
      {
        BITCOIN: [
          fakeConnector({ id: 'unisat', name: 'Unisat', xChainType: 'BITCOIN', iconUrl: 'https://u.img' }),
        ],
      } as Partial<Record<ChainType, XConnector[]>>,
    );
    expect(result.chains[0]?.connectorName).toBe('Unisat');
    expect(result.chains[0]?.connectorIcon).toBe('https://u.img');
  });

  it('connectorName/Icon undefined when connector not found in store', () => {
    const result = buildConnectedChains(
      { BITCOIN: { xAccount: { address: 'bc1q', xChainType: 'BITCOIN' }, xConnectorId: 'unknown' } },
      { BITCOIN: [] } as Partial<Record<ChainType, XConnector[]>>,
    );
    expect(result.chains[0]?.connectorName).toBeUndefined();
    expect(result.chains[0]?.connectorIcon).toBeUndefined();
  });

  it('status defaults to ready when isReady arg omitted', () => {
    const result = buildConnectedChains({}, {});
    expect(result.status).toBe('ready');
  });

  it('status = loading when isReady false', () => {
    const result = buildConnectedChains({}, {}, false);
    expect(result.status).toBe('loading');
  });

  it('status = ready when isReady true', () => {
    const result = buildConnectedChains({}, {}, true);
    expect(result.status).toBe('ready');
  });

  it('falls back to connector.icon when iconUrl not set', () => {
    const result = buildConnectedChains(
      { BITCOIN: { xAccount: { address: 'bc1q', xChainType: 'BITCOIN' }, xConnectorId: 'legacy' } },
      {
        BITCOIN: [
          fakeConnector({ id: 'legacy', icon: 'https://legacy.icon', iconUrl: undefined }),
        ],
      } as Partial<Record<ChainType, XConnector[]>>,
    );
    expect(result.chains[0]?.connectorIcon).toBe('https://legacy.icon');
  });
});
