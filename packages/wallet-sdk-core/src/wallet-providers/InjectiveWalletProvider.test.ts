import { describe, it, expect, vi } from 'vitest';

vi.mock('@injectivelabs/sdk-ts', () => {
  return {
    MsgExecuteContract: { fromJSON: vi.fn() },
    MsgExecuteContractCompat: { fromJSON: vi.fn() },
    createTransaction: vi.fn().mockReturnValue({ txRaw: { bodyBytes: new Uint8Array(), authInfoBytes: new Uint8Array() } }),
    PrivateKey: {
      fromPrivateKey: vi.fn().mockReturnValue({
        toAddress: () => ({ toBech32: () => 'inj1abc' }),
        toPublicKey: () => ({ toString: () => 'pubkey' }),
      }),
      fromMnemonic: vi.fn(),
    },
    getInjectiveSignerAddress: (s: string) => s,
    MsgBroadcasterWithPk: class {
      privateKey: unknown;
      constructor({ privateKey }: { privateKey: unknown }) {
        this.privateKey = privateKey;
      }
    },
  };
});

vi.mock('@injectivelabs/networks', () => ({ Network: { Mainnet: 'mainnet' } }));
vi.mock('@injectivelabs/wallet-core', () => ({}));
vi.mock('@injectivelabs/ts-types', () => ({}));

const { InjectiveWalletProvider } = await import('./InjectiveWalletProvider.js');

describe('InjectiveWalletProvider', () => {
  describe('constructor', () => {
    it('initializes with secret (private key) config', () => {
      const provider = new InjectiveWalletProvider({
        secret: { privateKey: 'pk' },
        // biome-ignore lint/suspicious/noExplicitAny: mocked Network type
        network: 'mainnet' as any,
        // biome-ignore lint/suspicious/noExplicitAny: mocked ChainId type
        chainId: 'injective-1' as any,
      });
      expect(provider.chainType).toBe('INJECTIVE');
      expect(provider.wallet.msgBroadcaster).toBeDefined();
    });

    it('initializes with browser-extension config', () => {
      // biome-ignore lint/suspicious/noExplicitAny: mocked broadcaster
      const msgBroadcaster: any = { walletStrategy: { getAddresses: vi.fn() } };
      const provider = new InjectiveWalletProvider({ msgBroadcaster });
      expect(provider.chainType).toBe('INJECTIVE');
    });

    it('throws on invalid config', () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid config rejection
      expect(() => new InjectiveWalletProvider({} as any)).toThrow('Invalid Injective wallet config');
    });

    it('accepts defaults without throwing', () => {
      const provider = new InjectiveWalletProvider({
        secret: { privateKey: 'pk' },
        // biome-ignore lint/suspicious/noExplicitAny: mocked Network
        network: 'mainnet' as any,
        // biome-ignore lint/suspicious/noExplicitAny: mocked ChainId
        chainId: 'injective-1' as any,
        defaults: {
          defaultMemo: 'sodax',
          defaultFunds: [{ amount: '100', denom: 'inj' }],
          sequence: 5,
          accountNumber: 10,
        },
      });
      expect(provider.chainType).toBe('INJECTIVE');
    });
  });
});
