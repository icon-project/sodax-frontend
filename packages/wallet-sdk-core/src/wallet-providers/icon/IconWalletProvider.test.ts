import { describe, it, expect, vi } from 'vitest';

const mockLoadPrivateKey = vi.fn().mockReturnValue({ getAddress: () => 'hxabc' });

vi.mock('icon-sdk-js', () => {
  class IconService {
    static HttpProvider = class {};
    static SignedTransaction = class {};
    sendTransaction() {
      return { execute: vi.fn() };
    }
    waitTransactionResult() {
      return { execute: vi.fn() };
    }
  }
  const Wallet = { loadPrivateKey: mockLoadPrivateKey };
  const Converter = { toHex: (n: number | string) => `0x${Number(n).toString(16)}` };
  class CallTransactionBuilder {
    from() {
      return this;
    }
    to() {
      return this;
    }
    stepLimit() {
      return this;
    }
    nid() {
      return this;
    }
    version() {
      return this;
    }
    timestamp() {
      return this;
    }
    value() {
      return this;
    }
    method() {
      return this;
    }
    params() {
      return this;
    }
    build() {
      return {};
    }
  }
  const sdk = { IconService, Wallet, Converter, CallTransactionBuilder };
  return { ...sdk, default: sdk };
});

const { IconWalletProvider } = await import('./IconWalletProvider.js');

describe('IconWalletProvider', () => {
  const PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const;
  const RPC_URL = 'https://ctz.solidwallet.io/api/v3' as const;

  describe('constructor', () => {
    it('initializes with private-key config', () => {
      const provider = new IconWalletProvider({ privateKey: PRIVATE_KEY, rpcUrl: RPC_URL });
      expect(provider.chainType).toBe('ICON');
      expect(provider.iconService).toBeDefined();
    });

    it('initializes with browser-extension config', () => {
      const provider = new IconWalletProvider({
        walletAddress: 'hx1234567890abcdef1234567890abcdef12345678',
        rpcUrl: RPC_URL,
      });
      expect(provider.chainType).toBe('ICON');
    });

    it('throws on invalid config', () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid config rejection
      expect(() => new IconWalletProvider({} as any)).toThrow('Invalid Icon wallet config');
    });

    it('accepts defaults without throwing', () => {
      const provider = new IconWalletProvider({
        privateKey: PRIVATE_KEY,
        rpcUrl: RPC_URL,
        defaults: { stepLimit: 5_000_000, version: '0x4', jsonRpcId: 42 },
      });
      expect(provider.chainType).toBe('ICON');
    });
  });
});
