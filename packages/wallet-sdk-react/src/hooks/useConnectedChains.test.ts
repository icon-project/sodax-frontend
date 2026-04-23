import { describe, it, expect } from 'vitest';
import type { ChainType } from '@sodax/types';
import { buildConnectedChains } from './useConnectedChains.js';
import type { XConnector } from '@/core/index.js';

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
  it('filters out chains with empty address', () => {
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

  it('enriches each chain with connectorName + connectorIcon from xConnectorsByChain', () => {
    const result = buildConnectedChains(
      { BITCOIN: { xAccount: { address: 'bc1q', xChainType: 'BITCOIN' }, xConnectorId: 'unisat' } },
      {
        BITCOIN: [fakeConnector({ id: 'unisat', name: 'Unisat', xChainType: 'BITCOIN', icon: 'https://u.img' })],
      } as Partial<Record<ChainType, XConnector[]>>,
    );
    expect(result.chains[0]?.connectorName).toBe('Unisat');
    expect(result.chains[0]?.connectorIcon).toBe('https://u.img');
  });

  it('leaves connectorName/Icon undefined when connector id is not in store', () => {
    const result = buildConnectedChains(
      { BITCOIN: { xAccount: { address: 'bc1q', xChainType: 'BITCOIN' }, xConnectorId: 'unknown' } },
      { BITCOIN: [] } as Partial<Record<ChainType, XConnector[]>>,
    );
    expect(result.chains[0]?.connectorName).toBeUndefined();
    expect(result.chains[0]?.connectorIcon).toBeUndefined();
  });

  it('status reflects isReady (defaults to ready when omitted)', () => {
    expect(buildConnectedChains({}, {}).status).toBe('ready');
    expect(buildConnectedChains({}, {}, false).status).toBe('loading');
    expect(buildConnectedChains({}, {}, true).status).toBe('ready');
  });
});
