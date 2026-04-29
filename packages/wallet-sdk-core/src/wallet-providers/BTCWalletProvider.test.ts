import { describe, it, expect, vi } from 'vitest';

vi.mock('bitcoinjs-lib', () => ({
  initEccLib: vi.fn(),
  networks: {
    bitcoin: { messagePrefix: 'mainnet' },
    testnet: { messagePrefix: 'testnet' },
  },
  payments: {
    p2wpkh: vi.fn().mockReturnValue({ address: 'bc1abc' }),
    p2pkh: vi.fn().mockReturnValue({ address: '1abc' }),
    p2sh: vi.fn().mockReturnValue({ address: '3abc' }),
    p2tr: vi.fn().mockReturnValue({ address: 'bc1pabc' }),
  },
  Psbt: { fromBase64: vi.fn(), fromHex: vi.fn() },
  crypto: { taggedHash: vi.fn() },
}));

vi.mock('@bitcoinerlab/secp256k1', () => ({}));

vi.mock('ecpair', () => ({
  ECPairFactory: () => ({
    fromPrivateKey: vi.fn().mockReturnValue({
      publicKey: Buffer.from(new Uint8Array(33)),
      privateKey: Buffer.from(new Uint8Array(32)),
    }),
  }),
}));

vi.mock('viem', () => ({ keccak256: vi.fn() }));
vi.mock('secp256k1', () => ({ default: { ecdsaSign: vi.fn() } }));
vi.mock('bip322-js', () => ({ Signer: { sign: vi.fn() } }));

vi.mock('@sodax/types', async () => {
  const actual = await vi.importActual<typeof import('@sodax/types')>('@sodax/types');
  return { ...actual, detectBitcoinAddressType: vi.fn().mockReturnValue('P2WPKH') };
});

const { BitcoinWalletProvider } = await import('./BTCWalletProvider.js');

describe('BitcoinWalletProvider', () => {
  const PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as const;

  describe('constructor', () => {
    it('initializes with private-key config', () => {
      const provider = new BitcoinWalletProvider({
        type: 'PRIVATE_KEY',
        privateKey: PRIVATE_KEY,
        network: 'MAINNET',
      });
      expect(provider.chainType).toBe('BITCOIN');
    });

    it('initializes with browser-extension config', () => {
      // biome-ignore lint/suspicious/noExplicitAny: mocked walletsKit
      const walletsKit: any = { getAccounts: vi.fn(), signPsbt: vi.fn() };
      const provider = new BitcoinWalletProvider({
        type: 'BROWSER_EXTENSION',
        walletsKit,
        network: 'MAINNET',
      });
      expect(provider.chainType).toBe('BITCOIN');
    });

    it('accepts defaults without throwing', () => {
      const provider = new BitcoinWalletProvider({
        type: 'PRIVATE_KEY',
        privateKey: PRIVATE_KEY,
        network: 'MAINNET',
        defaults: { addressType: 'P2TR', defaultFinalize: false },
      });
      expect(provider.chainType).toBe('BITCOIN');
    });
  });
});
