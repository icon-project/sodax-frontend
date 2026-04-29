import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const transactionCall = vi.fn();
const transactionLookup = vi.fn().mockReturnValue({ call: transactionCall });
const transactions = vi.fn().mockReturnValue({ transaction: transactionLookup });

vi.mock('@stellar/stellar-sdk', () => ({
  Networks: { TESTNET: 'TESTNET_PASS', PUBLIC: 'PUBLIC_PASS' },
  Horizon: {
    Server: class {
      public readonly transactions = transactions;
    },
  },
  Transaction: class {
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

const PRIVATE_KEY = '0xS1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890AB' as `0x${string}`;
const TX_HASH = 'tx-hash-123';
const RECEIPT_RAW = { hash: TX_HASH, _links: { self: { href: 'https://h/tx' } } };

describe('StellarWalletProvider', () => {
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

  describe('waitForTransactionReceipt — option merge (PK path)', () => {
    beforeEach(() => {
      transactionCall.mockReset();
      transactionLookup.mockClear();
      transactions.mockClear();
    });

    it('looks up the txHash on Horizon and resolves on first call when receipt is available', async () => {
      transactionCall.mockResolvedValue(RECEIPT_RAW);
      const provider = new StellarWalletProvider({
        type: 'PRIVATE_KEY',
        privateKey: PRIVATE_KEY,
        network: 'PUBLIC',
      });

      const receipt = await provider.waitForTransactionReceipt(TX_HASH);

      expect(transactionLookup).toHaveBeenCalledWith(TX_HASH);
      expect(receipt.hash).toBe(TX_HASH);
    });

    it('uses defaults.pollInterval to space retries and respects defaults.pollTimeout', async () => {
      vi.useFakeTimers();
      // Fail first 2 lookups, succeed on 3rd
      transactionCall
        .mockRejectedValueOnce(new Error('not found'))
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce(RECEIPT_RAW);

      const provider = new StellarWalletProvider({
        type: 'PRIVATE_KEY',
        privateKey: PRIVATE_KEY,
        network: 'PUBLIC',
        defaults: { pollInterval: 100, pollTimeout: 10_000 },
      });

      const promise = provider.waitForTransactionReceipt(TX_HASH);
      await vi.advanceTimersByTimeAsync(250);
      await promise;

      expect(transactionCall).toHaveBeenCalledTimes(3);
      vi.useRealTimers();
    });

    it('per-call options.pollInterval/pollTimeout override defaults', async () => {
      vi.useFakeTimers();
      transactionCall.mockRejectedValueOnce(new Error('not found')).mockResolvedValueOnce(RECEIPT_RAW);

      const provider = new StellarWalletProvider({
        type: 'PRIVATE_KEY',
        privateKey: PRIVATE_KEY,
        network: 'PUBLIC',
        defaults: { pollInterval: 5_000, pollTimeout: 60_000 },
      });

      const promise = provider.waitForTransactionReceipt(TX_HASH, { pollInterval: 50, pollTimeout: 1_000 });
      await vi.advanceTimersByTimeAsync(75);
      await promise;

      expect(transactionCall).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it('throws TX_RECEIPT_TIMEOUT when pollTimeout elapses before receipt is available', async () => {
      vi.useFakeTimers();
      transactionCall.mockRejectedValue(new Error('not found'));

      const provider = new StellarWalletProvider({
        type: 'PRIVATE_KEY',
        privateKey: PRIVATE_KEY,
        network: 'PUBLIC',
        defaults: { pollInterval: 50, pollTimeout: 200 },
      });

      const promise = provider.waitForTransactionReceipt(TX_HASH).catch(error => error);
      await vi.advanceTimersByTimeAsync(500);
      const error = await promise;

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/Transaction receipt not found/);
      vi.useRealTimers();
    });
  });

  describe('waitForTransactionReceipt — option merge (browser-extension path)', () => {
    beforeEach(() => {
      transactionCall.mockReset();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('applies defaults.pollInterval/pollTimeout in browser-extension mode', async () => {
      vi.useFakeTimers();
      transactionCall.mockRejectedValueOnce(new Error('not found')).mockResolvedValueOnce(RECEIPT_RAW);

      const provider = new StellarWalletProvider({
        type: 'BROWSER_EXTENSION',
        walletsKit: { getAddress: vi.fn(), signTransaction: vi.fn() },
        network: 'PUBLIC',
        defaults: { pollInterval: 75, pollTimeout: 5_000 },
      });

      const promise = provider.waitForTransactionReceipt(TX_HASH);
      await vi.advanceTimersByTimeAsync(150);
      await promise;

      expect(transactionCall).toHaveBeenCalledTimes(2);
    });
  });
});
