import { describe, it, expect, vi } from 'vitest';

vi.mock('@stellar/stellar-sdk', () => ({
  Networks: { TESTNET: 'TESTNET_PASS', PUBLIC: 'PUBLIC_PASS' },
  Horizon: {
    Server: class {
      constructor(_url: string) {}
      transactions() {
        return { transaction: () => ({ call: vi.fn() }) };
      }
    },
  },
  Transaction: class {
    constructor(_xdr: string, _passphrase: string) {}
    sign() {}
    toXDR() {
      return 'signed-xdr';
    }
  },
  Keypair: {
    fromSecret: vi.fn().mockReturnValue({ publicKey: () => 'GABC' }),
  },
}));

const { StellarWalletProvider } = await import('./StellarWalletProvider.js');

describe('StellarWalletProvider', () => {
  // Valid Stellar S-key (test key, 56 chars after S)
  const PRIVATE_KEY = '0xS1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890AB' as `0x${string}`;

  describe('constructor', () => {
    it('initializes with private-key config', () => {
      const provider = new StellarWalletProvider({
        type: 'PRIVATE_KEY',
        privateKey: PRIVATE_KEY,
        network: 'PUBLIC',
      });
      expect(provider.chainType).toBe('STELLAR');
    });

    it('initializes with browser-extension config', () => {
      const walletsKit = {
        getAddress: vi.fn(),
        signTransaction: vi.fn(),
      };
      const provider = new StellarWalletProvider({
        type: 'BROWSER_EXTENSION',
        walletsKit,
        network: 'PUBLIC',
      });
      expect(provider.chainType).toBe('STELLAR');
    });

    it('accepts defaults without throwing', () => {
      const provider = new StellarWalletProvider({
        type: 'PRIVATE_KEY',
        privateKey: PRIVATE_KEY,
        network: 'PUBLIC',
        defaults: { pollInterval: 1000, pollTimeout: 90_000 },
      });
      expect(provider.chainType).toBe('STELLAR');
    });
  });
});
