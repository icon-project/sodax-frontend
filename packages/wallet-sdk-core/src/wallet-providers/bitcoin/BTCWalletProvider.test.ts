import { describe, it, expect, vi, beforeEach } from 'vitest';

const signAllInputs = vi.fn();
const finalizeAllInputs = vi.fn();
const extractTransactionToHex = vi.fn().mockReturnValue('extracted-tx-hex');
const extractTransaction = vi.fn().mockReturnValue({ toHex: extractTransactionToHex });
const psbtToBase64 = vi.fn().mockReturnValue('signed-psbt-base64');
const psbtFromBase64 = vi.fn().mockReturnValue({
  signAllInputs,
  finalizeAllInputs,
  extractTransaction,
  toBase64: psbtToBase64,
});

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
  Psbt: { fromBase64: psbtFromBase64, fromHex: vi.fn() },
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
  const PSBT_BASE64 = 'cHNidP8AAA==';

  function makeProvider(defaults?: { defaultFinalize?: boolean }) {
    return new BitcoinWalletProvider({
      type: 'PRIVATE_KEY',
      privateKey: PRIVATE_KEY,
      network: 'MAINNET',
      defaults,
    });
  }

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
        addressType: 'P2TR',
        defaults: { defaultFinalize: false },
      });
      expect(provider.chainType).toBe('BITCOIN');
    });
  });

  describe('signTransaction — finalize merge', () => {
    beforeEach(() => {
      signAllInputs.mockReset();
      finalizeAllInputs.mockReset();
      extractTransaction.mockClear();
      extractTransactionToHex.mockClear();
      psbtToBase64.mockClear();
    });

    it('falls back to DEFAULT_FINALIZE=true and extracts tx when neither defaults nor arg provided', async () => {
      const provider = makeProvider();

      const result = await provider.signTransaction(PSBT_BASE64);

      expect(finalizeAllInputs).toHaveBeenCalledTimes(1);
      expect(extractTransaction).toHaveBeenCalledTimes(1);
      expect(psbtToBase64).not.toHaveBeenCalled();
      expect(result).toBe('extracted-tx-hex');
    });

    it('uses defaults.defaultFinalize=false to skip finalize and return base64 PSBT', async () => {
      const provider = makeProvider({ defaultFinalize: false });

      const result = await provider.signTransaction(PSBT_BASE64);

      expect(finalizeAllInputs).not.toHaveBeenCalled();
      expect(extractTransaction).not.toHaveBeenCalled();
      expect(psbtToBase64).toHaveBeenCalledTimes(1);
      expect(result).toBe('signed-psbt-base64');
    });

    it('explicit finalize=true overrides defaults.defaultFinalize=false', async () => {
      const provider = makeProvider({ defaultFinalize: false });

      const result = await provider.signTransaction(PSBT_BASE64, true);

      expect(finalizeAllInputs).toHaveBeenCalledTimes(1);
      expect(extractTransaction).toHaveBeenCalledTimes(1);
      expect(result).toBe('extracted-tx-hex');
    });

    it('explicit finalize=false overrides defaults.defaultFinalize=true', async () => {
      const provider = makeProvider({ defaultFinalize: true });

      const result = await provider.signTransaction(PSBT_BASE64, false);

      expect(finalizeAllInputs).not.toHaveBeenCalled();
      expect(psbtToBase64).toHaveBeenCalledTimes(1);
      expect(result).toBe('signed-psbt-base64');
    });
  });
});
