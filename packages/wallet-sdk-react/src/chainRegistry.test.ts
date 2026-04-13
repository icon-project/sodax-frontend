import { describe, it, expect, vi } from 'vitest';
import { createChainServices, type StoreAccessor } from './chainRegistry';
import type { XConnector } from './core';
import type { IXConnector } from './types/interfaces';

const makeStore = (): StoreAccessor =>
  vi.fn(() => ({
    xConnections: {},
    xServices: {},
    setXConnectors: vi.fn(),
    unsetXConnection: vi.fn(),
    setWalletProvider: vi.fn(),
  }));

describe('createChainServices', () => {
  it('only initializes chains listed in config', () => {
    const result = createChainServices({ EVM: {}, BITCOIN: {} }, makeStore());

    expect(result.enabledChains).toContain('EVM');
    expect(result.enabledChains).toContain('BITCOIN');
    expect(result.enabledChains).not.toContain('SOLANA');
    expect(result.enabledChains).not.toContain('SUI');
    expect(result.xServices.SOLANA).toBeUndefined();
    expect(result.xServices.SUI).toBeUndefined();
  });

  it('initializes XService instances for enabled chains', () => {
    const result = createChainServices({ BITCOIN: {}, ICON: {} }, makeStore());

    expect(result.xServices.BITCOIN).toBeDefined();
    expect(result.xServices.ICON).toBeDefined();
  });

  it('uses default connectors for non-provider chains when no override is given', () => {
    const result = createChainServices({ BITCOIN: {} }, makeStore());

    // BITCOIN defaults: Unisat, Xverse, OKX
    expect(result.xConnectorsByChain.BITCOIN).toBeDefined();
    expect(result.xConnectorsByChain.BITCOIN?.length).toBe(3);
  });

  it('respects custom connectors override for non-provider chains', () => {
    const fakeConnector: IXConnector = {
      id: 'fake',
      name: 'Fake Wallet',
      icon: undefined,
      xChainType: 'BITCOIN',
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    const result = createChainServices({ BITCOIN: { connectors: [fakeConnector] } }, makeStore());

    expect(result.xConnectorsByChain.BITCOIN).toHaveLength(1);
    expect((result.xConnectorsByChain.BITCOIN?.[0] as XConnector).id).toBe('fake');
  });

  it('does not populate connectors for provider-managed chains', () => {
    // EVM/SOLANA/SUI are provider-managed — connectors are hydrated by their respective Hydrator components
    const result = createChainServices({ EVM: {}, SOLANA: {}, SUI: {} }, makeStore());

    expect(result.xConnectorsByChain.EVM).toBeUndefined();
    expect(result.xConnectorsByChain.SOLANA).toBeUndefined();
    expect(result.xConnectorsByChain.SUI).toBeUndefined();
  });

  it('registers chainActions for non-provider chains only', () => {
    // Provider-managed chains register their ChainActions via Action components,
    // not in createChainServices
    const result = createChainServices({ EVM: {}, BITCOIN: {}, ICON: {} }, makeStore());

    expect(result.chainActions.BITCOIN).toBeDefined();
    expect(result.chainActions.ICON).toBeDefined();
    expect(result.chainActions.EVM).toBeUndefined();
  });

  it('chainActions has connect/disconnect/getConnectors/getConnection by default', () => {
    const result = createChainServices({ ICON: {} }, makeStore());
    const actions = result.chainActions.ICON;

    expect(actions).toBeDefined();
    expect(typeof actions?.connect).toBe('function');
    expect(typeof actions?.disconnect).toBe('function');
    expect(typeof actions?.getConnectors).toBe('function');
    expect(typeof actions?.getConnection).toBe('function');
  });

  it('Bitcoin chainActions exposes signMessage', () => {
    const result = createChainServices({ BITCOIN: {} }, makeStore());

    expect(result.chainActions.BITCOIN?.signMessage).toBeDefined();
  });

  it('Injective chainActions exposes signMessage', () => {
    const result = createChainServices({ INJECTIVE: {} }, makeStore());

    expect(result.chainActions.INJECTIVE?.signMessage).toBeDefined();
  });

  it('Stellar chainActions exposes signMessage', () => {
    const result = createChainServices({ STELLAR: {} }, makeStore());

    expect(result.chainActions.STELLAR?.signMessage).toBeDefined();
  });

  it('ICON chainActions does not expose signMessage (Hana wallet limitation)', () => {
    const result = createChainServices({ ICON: {} }, makeStore());

    expect(result.chainActions.ICON?.signMessage).toBeUndefined();
  });

  it('returns empty result for empty config', () => {
    const result = createChainServices({}, makeStore());

    expect(result.enabledChains).toEqual([]);
    expect(result.xServices).toEqual({});
    expect(result.xConnectorsByChain).toEqual({});
    expect(result.chainActions).toEqual({});
  });
});
