import { describe, it, expect } from 'vitest';
import type { ChainType } from '@sodax/types';
import { buildChainGroups } from './useChainGroups.js';
import type { ChainServiceFactory } from '../chainRegistry.js';

const registry = {
  EVM: { displayName: 'EVM', iconUrl: 'https://example.com/evm.png' },
  ICON: { displayName: 'ICON' },
  BITCOIN: { displayName: 'Bitcoin' },
} as unknown as Record<string, ChainServiceFactory>;

describe('buildChainGroups', () => {
  it('returns empty array when no chains enabled', () => {
    expect(buildChainGroups([], {}, registry)).toEqual([]);
  });

  it('returns one group per enabled chain', () => {
    const groups = buildChainGroups(['EVM', 'ICON'] as ChainType[], {}, registry);
    expect(groups.map(g => g.chainType)).toEqual(['EVM', 'ICON']);
  });

  it('populates displayName from registry; falls back to chainType', () => {
    const groups = buildChainGroups(['EVM', 'ICON', 'NEAR'] as ChainType[], {}, registry);
    const byType = Object.fromEntries(groups.map(g => [g.chainType, g.displayName]));
    expect(byType).toEqual({ EVM: 'EVM', ICON: 'ICON', NEAR: 'NEAR' });
  });

  it('populates iconUrl from registry (undefined when not provided)', () => {
    const groups = buildChainGroups(['EVM', 'ICON'] as ChainType[], {}, registry);
    const byType = Object.fromEntries(groups.map(g => [g.chainType, g.iconUrl]));
    expect(byType.EVM).toBe('https://example.com/evm.png');
    expect(byType.ICON).toBeUndefined();
  });

  it('EVM group collapses multiple networks into chainIds', () => {
    const groups = buildChainGroups(['EVM'] as ChainType[], {}, registry);
    const evm = groups[0];
    expect(evm?.chainType).toBe('EVM');
    expect(evm?.chainIds.length).toBeGreaterThan(1);
    expect(evm?.chainIds).toContain('sonic');
  });

  it('isConnected reflects xConnections.xAccount.address', () => {
    const groups = buildChainGroups(
      ['EVM', 'ICON'] as ChainType[],
      {
        EVM: { xAccount: { address: '0xABC', xChainType: 'EVM' }, xConnectorId: 'metamask' },
        ICON: { xAccount: { address: undefined, xChainType: 'ICON' }, xConnectorId: 'hana' },
      },
      registry,
    );
    const byType = Object.fromEntries(groups.map(g => [g.chainType, g.isConnected]));
    expect(byType).toEqual({ EVM: true, ICON: false });
  });

  it('populates account + connectorId for connected chains', () => {
    const groups = buildChainGroups(
      ['EVM'] as ChainType[],
      { EVM: { xAccount: { address: '0xABC', xChainType: 'EVM' }, xConnectorId: 'metamask' } },
      registry,
    );
    expect(groups[0]?.account?.address).toBe('0xABC');
    expect(groups[0]?.connectorId).toBe('metamask');
  });
});
