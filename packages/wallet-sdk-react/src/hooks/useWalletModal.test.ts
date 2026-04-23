import { beforeEach, describe, expect, it } from 'vitest';
import type { ChainType } from '@sodax/types';
import { useWalletModalStore } from '@/useWalletModalStore.js';
import type { XConnector } from '@/core/XConnector.js';
import type { XAccount } from '@/types/index.js';

function fakeConnector(id: string, xChainType: ChainType = 'EVM'): XConnector {
  return {
    xChainType,
    name: id,
    id,
    icon: undefined,
    isInstalled: true,
    connect: async () => undefined,
    disconnect: async () => undefined,
  } as XConnector;
}

function fakeAccount(address: string, xChainType: ChainType = 'EVM'): XAccount {
  return { address, xChainType };
}

beforeEach(() => {
  useWalletModalStore.getState().close();
});

describe('useWalletModalStore', () => {
  it('initial state is closed', () => {
    expect(useWalletModalStore.getState().walletModal).toEqual({ kind: 'closed' });
  });

  it('open() transitions closed → chainSelect', () => {
    useWalletModalStore.getState().open();
    expect(useWalletModalStore.getState().walletModal.kind).toBe('chainSelect');
  });

  it('selectChain() carries chainType into walletSelect', () => {
    useWalletModalStore.getState().open();
    useWalletModalStore.getState().selectChain('ICON');
    const state = useWalletModalStore.getState().walletModal;
    expect(state.kind).toBe('walletSelect');
    if (state.kind === 'walletSelect') expect(state.chainType).toBe('ICON');
  });

  it('setConnecting → setSuccess preserves chainType + connector and adds account', () => {
    const c = fakeConnector('hana', 'ICON');
    const a = fakeAccount('hx123', 'ICON');
    useWalletModalStore.getState().setConnecting('ICON', c);
    expect(useWalletModalStore.getState().walletModal.kind).toBe('connecting');

    useWalletModalStore.getState().setSuccess('ICON', c, a);
    const state = useWalletModalStore.getState().walletModal;
    expect(state.kind).toBe('success');
    if (state.kind === 'success') {
      expect(state.chainType).toBe('ICON');
      expect(state.connector).toBe(c);
      expect(state.account).toBe(a);
    }
  });

  it('setError carries the error and connector', () => {
    const c = fakeConnector('metamask', 'EVM');
    const err = new Error('user rejected');
    useWalletModalStore.getState().setError('EVM', c, err);
    const state = useWalletModalStore.getState().walletModal;
    expect(state.kind).toBe('error');
    if (state.kind === 'error') {
      expect(state.error).toBe(err);
      expect(state.connector).toBe(c);
    }
  });

  describe('back() transition table', () => {
    it('walletSelect → chainSelect', () => {
      useWalletModalStore.getState().open();
      useWalletModalStore.getState().selectChain('EVM');
      useWalletModalStore.getState().back();
      expect(useWalletModalStore.getState().walletModal.kind).toBe('chainSelect');
    });

    it('connecting → walletSelect (preserves chainType)', () => {
      const c = fakeConnector('m', 'EVM');
      useWalletModalStore.getState().setConnecting('EVM', c);
      useWalletModalStore.getState().back();
      const state = useWalletModalStore.getState().walletModal;
      expect(state.kind).toBe('walletSelect');
      if (state.kind === 'walletSelect') expect(state.chainType).toBe('EVM');
    });

    it('error → walletSelect (clear error, preserve chainType)', () => {
      const c = fakeConnector('m', 'EVM');
      useWalletModalStore.getState().setError('EVM', c, new Error('boom'));
      useWalletModalStore.getState().back();
      const state = useWalletModalStore.getState().walletModal;
      expect(state.kind).toBe('walletSelect');
      if (state.kind === 'walletSelect') expect(state.chainType).toBe('EVM');
    });

    it('success → closed', () => {
      const c = fakeConnector('m', 'EVM');
      useWalletModalStore.getState().setSuccess('EVM', c, fakeAccount('0x'));
      useWalletModalStore.getState().back();
      expect(useWalletModalStore.getState().walletModal.kind).toBe('closed');
    });

    it('closed and chainSelect are no-ops', () => {
      useWalletModalStore.getState().back();
      expect(useWalletModalStore.getState().walletModal.kind).toBe('closed');

      useWalletModalStore.getState().open();
      useWalletModalStore.getState().back();
      expect(useWalletModalStore.getState().walletModal.kind).toBe('chainSelect');
    });
  });

  it('close() resets from any state', () => {
    const c = fakeConnector('m', 'EVM');
    useWalletModalStore.getState().setConnecting('EVM', c);
    useWalletModalStore.getState().close();
    expect(useWalletModalStore.getState().walletModal.kind).toBe('closed');
  });
});
