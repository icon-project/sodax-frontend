import { describe, it, expect, vi } from 'vitest';

vi.mock('near-api-js', () => ({
  Account: class {
    constructor(
      public readonly accountId: string,
      _provider: unknown,
      _signer: unknown,
    ) {}
    signAndSendTransaction = vi.fn();
  },
  JsonRpcProvider: class {
  },
  KeyPairSigner: { fromSecretKey: vi.fn().mockReturnValue({}) },
  actions: { functionCall: vi.fn() },
}));

const { NearWalletProvider } = await import('./NearWalletProvider.js');

describe('NearWalletProvider', () => {
  describe('constructor', () => {
    it('initializes with private-key config', () => {
      const provider = new NearWalletProvider({
        rpcUrl: 'https://rpc.mainnet.near.org',
        accountId: 'alice.near',
        privateKey: 'ed25519:abc',
      });
      expect(provider.chainType).toBe('NEAR');
      expect(provider.account).toBeDefined();
    });

    it('initializes with browser-extension config', () => {
      // biome-ignore lint/suspicious/noExplicitAny: mocked NearConnector
      const wallet: any = { getConnectedWallet: vi.fn() };
      const provider = new NearWalletProvider({ wallet });
      expect(provider.chainType).toBe('NEAR');
    });

    it('throws on invalid config', () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid config rejection
      expect(() => new NearWalletProvider({} as any)).toThrow('Invalid Near wallet config');
    });

    it('accepts defaults without throwing', () => {
      const provider = new NearWalletProvider({
        rpcUrl: 'https://rpc.mainnet.near.org',
        accountId: 'alice.near',
        privateKey: 'ed25519:abc',
        defaults: {
          throwOnFailure: false,
          waitUntil: 'INCLUDED',
          gasDefault: 100_000_000_000_000n,
          depositDefault: 1n,
        },
      });
      expect(provider.chainType).toBe('NEAR');
    });
  });
});
