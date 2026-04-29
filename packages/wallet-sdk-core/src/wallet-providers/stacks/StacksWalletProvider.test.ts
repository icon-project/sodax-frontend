import { describe, it, expect, vi } from 'vitest';

vi.mock('@stacks/network', () => ({
  networkFrom: vi.fn().mockReturnValue({ client: { baseUrl: 'https://stacks.example' } }),
}));

vi.mock('@stacks/transactions', () => ({
  broadcastTransaction: vi.fn(),
  fetchCallReadOnlyFunction: vi.fn(),
  getAddressFromPrivateKey: vi.fn().mockReturnValue('SP1ADDR'),
  makeContractCall: vi.fn(),
  PostConditionMode: { Allow: 0x01, Deny: 0x02 },
  privateKeyToPublic: vi.fn().mockReturnValue('pub'),
  publicKeyToHex: vi.fn().mockReturnValue('hex'),
}));

vi.mock('@stacks/connect', () => ({ request: vi.fn() }));

const { StacksWalletProvider } = await import('./StacksWalletProvider.js');

describe('StacksWalletProvider', () => {
  describe('constructor', () => {
    it('initializes with private-key config', () => {
      const provider = new StacksWalletProvider({ privateKey: 'pk' });
      expect(provider.chainType).toBe('STACKS');
    });

    it('initializes with browser-extension config', () => {
      const provider = new StacksWalletProvider({ address: 'SP1ADDR' });
      expect(provider.chainType).toBe('STACKS');
    });

    it('throws on invalid config', () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid config rejection
      expect(() => new StacksWalletProvider({} as any)).toThrow('Invalid Stacks wallet configuration');
    });

    it('accepts defaults without throwing', () => {
      const provider = new StacksWalletProvider({
        privateKey: 'pk',
        defaults: { network: 'testnet' },
      });
      expect(provider.chainType).toBe('STACKS');
    });
  });
});
