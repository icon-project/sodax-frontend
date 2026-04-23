import { describe, it, expect } from 'vitest';
import type { ChainType } from '@sodax/types';
import { buildChainGroups } from './useChainGroups.js';
import type { ChainServiceFactory } from '@/chainRegistry.js';

const registry = {
  EVM: { displayName: 'EVM' },
  ICON: {},
} as unknown as Record<string, ChainServiceFactory>;

describe('buildChainGroups', () => {
  it('EVM group collapses every EVM network into chainIds', () => {
    const groups = buildChainGroups(['EVM'] as ChainType[], {}, registry);
    const evm = groups[0];
    expect(evm?.chainType).toBe('EVM');
    expect(evm?.chainIds.length).toBeGreaterThan(1);
    expect(evm?.chainIds).toContain('sonic');
  });

  it('isConnected reflects whether xAccount.address is non-empty', () => {
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

  it('displayName falls back to chainType when registry has none', () => {
    const groups = buildChainGroups(['EVM', 'ICON'] as ChainType[], {}, registry);
    const byType = Object.fromEntries(groups.map(g => [g.chainType, g.displayName]));
    expect(byType).toEqual({ EVM: 'EVM', ICON: 'ICON' });
  });
});
