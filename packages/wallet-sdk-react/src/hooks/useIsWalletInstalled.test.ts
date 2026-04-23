import { describe, it, expect } from 'vitest';
import type { ChainType } from '@sodax/types';
import { isAnyConnectorInstalled } from './useIsWalletInstalled.js';
import type { XConnector } from '@/core/XConnector.js';

function fakeConnector(id: string, name: string, xChainType: ChainType, isInstalled = true): XConnector {
  return {
    xChainType,
    name,
    id,
    icon: undefined,
    isInstalled,
    connect: async () => undefined,
    disconnect: async () => undefined,
  } as XConnector;
}

describe('isAnyConnectorInstalled', () => {
  const store = {
    EVM: [fakeConnector('hana', 'Hana Wallet', 'EVM'), fakeConnector('metamask', 'MetaMask', 'EVM', false)],
    ICON: [fakeConnector('hana', 'Hana Wallet', 'ICON')],
    BITCOIN: [fakeConnector('unisat', 'Unisat', 'BITCOIN', false)],
  } satisfies Partial<Record<ChainType, XConnector[]>>;

  it('connectors matches by identifier across chains', () => {
    expect(isAnyConnectorInstalled({ connectors: ['hana'] }, store)).toBe(true);
    expect(isAnyConnectorInstalled({ connectors: ['phantom'] }, store)).toBe(false);
  });

  it('connectors array — matches if ANY identifier matches', () => {
    expect(isAnyConnectorInstalled({ connectors: ['phantom', 'hana'] }, store)).toBe(true);
    expect(isAnyConnectorInstalled({ connectors: ['phantom', 'xverse'] }, store)).toBe(false);
  });

  it('identifier match is case-insensitive substring', () => {
    expect(isAnyConnectorInstalled({ connectors: ['HANA'] }, store)).toBe(true);
    expect(isAnyConnectorInstalled({ connectors: ['na wal'] }, store)).toBe(true);
  });

  it('skips connectors where isInstalled === false', () => {
    expect(isAnyConnectorInstalled({ connectors: ['metamask'] }, store)).toBe(false);
    expect(isAnyConnectorInstalled({ connectors: ['unisat'] }, store)).toBe(false);
  });

  it('chainType only — scans installed connectors on that chain', () => {
    expect(isAnyConnectorInstalled({ chainType: 'BITCOIN' }, store)).toBe(false);
    expect(isAnyConnectorInstalled({ chainType: 'ICON' }, store)).toBe(true);
  });

  it('connectors + chainType — AND semantics', () => {
    expect(isAnyConnectorInstalled({ connectors: ['hana'], chainType: 'EVM' }, store)).toBe(true);
    expect(isAnyConnectorInstalled({ connectors: ['hana'], chainType: 'BITCOIN' }, store)).toBe(false);
    expect(isAnyConnectorInstalled({ connectors: ['unisat'], chainType: 'EVM' }, store)).toBe(false);
  });

  it('chainType not present in store → false', () => {
    expect(isAnyConnectorInstalled({ chainType: 'SOLANA' }, store)).toBe(false);
  });

  it('empty connectors array → false (explicit no-match)', () => {
    expect(isAnyConnectorInstalled({ connectors: [] }, store)).toBe(false);
  });

  it('throws when neither connectors nor chainType is provided', () => {
    expect(() => isAnyConnectorInstalled({}, store)).toThrow(
      /requires at least one of `connectors` or `chainType`/,
    );
  });
});
