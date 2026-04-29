import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PublicKey as PublicKeyType } from '@solana/web3.js';

const sendRawTransaction = vi.fn().mockResolvedValue('sig-123');
const confirmTransaction = vi.fn().mockResolvedValue({ value: { err: null }, context: { slot: 1 } });
const getLatestBlockhash = vi
  .fn()
  .mockResolvedValue({ blockhash: 'blockhash-1', lastValidBlockHeight: 1000 });
const ConnectionCtorArgs: Array<{ endpoint: string; config: unknown }> = [];

vi.mock('@solana/web3.js', () => {
  class PublicKey {
    constructor(public readonly key: string | Uint8Array) {}
    toBase58() {
      return typeof this.key === 'string' ? this.key : 'base58key';
    }
  }
  class Keypair {
    public publicKey = new PublicKey('keypair-pk');
    static fromSecretKey(_: Uint8Array) {
      return new Keypair();
    }
  }
  class Connection {
    public readonly sendRawTransaction = sendRawTransaction;
    public readonly getLatestBlockhash = getLatestBlockhash;
    public readonly confirmTransaction = confirmTransaction;
    public readonly getBalance = vi.fn();
    public readonly getTokenAccountBalance = vi.fn();
    constructor(endpoint: string, config: unknown) {
      ConnectionCtorArgs.push({ endpoint, config });
    }
  }
  class TransactionInstruction {}
  class TransactionMessage {
    compileToV0Message() {
      return {};
    }
  }
  class VersionedTransaction {
    sign() {}
    serialize() {
      return new Uint8Array();
    }
  }
  return { PublicKey, Keypair, Connection, TransactionInstruction, TransactionMessage, VersionedTransaction };
});

vi.mock('@solana/spl-token', () => ({
  getAssociatedTokenAddress: vi.fn(),
}));

const { SolanaWalletProvider } = await import('./SolanaWalletProvider.js');

const PRIVATE_KEY = new Uint8Array(64);
const ENDPOINT = 'https://api.mainnet-beta.solana.com';
const RAW_TX = new Uint8Array([1, 2, 3]);

describe('SolanaWalletProvider', () => {
  describe('constructor', () => {
    it('initializes with private-key config', () => {
      const provider = new SolanaWalletProvider({ privateKey: PRIVATE_KEY, endpoint: ENDPOINT });
      expect(provider.chainType).toBe('SOLANA');
      expect(provider.connection).toBeDefined();
    });

    it('initializes with browser-extension config', () => {
      const wallet = {
        publicKey: { toBase58: () => 'pk' } as unknown as PublicKeyType,
        signTransaction: vi.fn(),
      };
      const provider = new SolanaWalletProvider({ wallet, endpoint: ENDPOINT });
      expect(provider.chainType).toBe('SOLANA');
    });

    it('accepts defaults without throwing', () => {
      const provider = new SolanaWalletProvider({
        privateKey: PRIVATE_KEY,
        endpoint: ENDPOINT,
        defaults: {
          connectionCommitment: 'processed',
          confirmCommitment: 'finalized',
          sendOptions: { skipPreflight: true, maxRetries: 5 },
        },
      });
      expect(provider.chainType).toBe('SOLANA');
    });
  });

  describe('constructor — Connection config forwarding', () => {
    beforeEach(() => {
      ConnectionCtorArgs.length = 0;
    });

    it("falls back to commitment: 'confirmed' when no defaults", () => {
      const provider = new SolanaWalletProvider({ privateKey: PRIVATE_KEY, endpoint: ENDPOINT });
      expect(provider.chainType).toBe('SOLANA');
      expect(ConnectionCtorArgs[0]).toEqual({ endpoint: ENDPOINT, config: { commitment: 'confirmed' } });
    });

    it('forwards defaults.connectionCommitment to Connection ctor', () => {
      const provider = new SolanaWalletProvider({
        privateKey: PRIVATE_KEY,
        endpoint: ENDPOINT,
        defaults: { connectionCommitment: 'processed' },
      });
      expect(provider.chainType).toBe('SOLANA');
      expect(ConnectionCtorArgs[0]).toEqual({ endpoint: ENDPOINT, config: { commitment: 'processed' } });
    });

    it('defaults.connectionConfig overrides connectionCommitment', () => {
      const provider = new SolanaWalletProvider({
        privateKey: PRIVATE_KEY,
        endpoint: ENDPOINT,
        defaults: {
          connectionCommitment: 'processed',
          connectionConfig: { commitment: 'finalized', wsEndpoint: 'wss://x' },
        },
      });
      expect(provider.chainType).toBe('SOLANA');
      expect(ConnectionCtorArgs[0]).toEqual({
        endpoint: ENDPOINT,
        config: { commitment: 'finalized', wsEndpoint: 'wss://x' },
      });
    });
  });

  describe('sendTransaction — option merge (PK path)', () => {
    beforeEach(() => {
      sendRawTransaction.mockClear();
      sendRawTransaction.mockResolvedValue('sig-123');
    });

    it('passes empty merged options when no defaults nor per-call options', async () => {
      const provider = new SolanaWalletProvider({ privateKey: PRIVATE_KEY, endpoint: ENDPOINT });

      await provider.sendTransaction(RAW_TX);

      expect(sendRawTransaction).toHaveBeenCalledWith(RAW_TX, {});
    });

    it('applies defaults.sendOptions when no per-call options', async () => {
      const provider = new SolanaWalletProvider({
        privateKey: PRIVATE_KEY,
        endpoint: ENDPOINT,
        defaults: { sendOptions: { skipPreflight: true, maxRetries: 5 } },
      });

      await provider.sendTransaction(RAW_TX);

      expect(sendRawTransaction).toHaveBeenCalledWith(RAW_TX, { skipPreflight: true, maxRetries: 5 });
    });

    it('per-call options shallow-merge over defaults; per-call wins on overlap', async () => {
      const provider = new SolanaWalletProvider({
        privateKey: PRIVATE_KEY,
        endpoint: ENDPOINT,
        defaults: { sendOptions: { skipPreflight: true, maxRetries: 5 } },
      });

      await provider.sendTransaction(RAW_TX, { skipPreflight: false });

      expect(sendRawTransaction).toHaveBeenCalledWith(RAW_TX, { skipPreflight: false, maxRetries: 5 });
    });
  });

  describe('waitForConfirmation — commitment merge', () => {
    beforeEach(() => {
      confirmTransaction.mockClear();
      confirmTransaction.mockResolvedValue({ value: { err: null }, context: { slot: 1 } });
    });

    it("falls back to DEFAULT_CONFIRM_COMMITMENT='finalized' when no defaults nor arg", async () => {
      const provider = new SolanaWalletProvider({ privateKey: PRIVATE_KEY, endpoint: ENDPOINT });

      await provider.waitForConfirmation('sig-1');

      expect(confirmTransaction).toHaveBeenCalledWith(expect.objectContaining({ signature: 'sig-1' }), 'finalized');
    });

    it('applies defaults.confirmCommitment when commitment arg omitted', async () => {
      const provider = new SolanaWalletProvider({
        privateKey: PRIVATE_KEY,
        endpoint: ENDPOINT,
        defaults: { confirmCommitment: 'confirmed' },
      });

      await provider.waitForConfirmation('sig-1');

      expect(confirmTransaction).toHaveBeenCalledWith(expect.objectContaining({ signature: 'sig-1' }), 'confirmed');
    });

    it('explicit commitment arg wins over defaults', async () => {
      const provider = new SolanaWalletProvider({
        privateKey: PRIVATE_KEY,
        endpoint: ENDPOINT,
        defaults: { confirmCommitment: 'confirmed' },
      });

      await provider.waitForConfirmation('sig-1', 'processed');

      expect(confirmTransaction).toHaveBeenCalledWith(expect.objectContaining({ signature: 'sig-1' }), 'processed');
    });
  });

  describe('sendTransaction — option merge (browser-extension path)', () => {
    beforeEach(() => {
      sendRawTransaction.mockClear();
      sendRawTransaction.mockResolvedValue('sig-123');
    });

    it('applies defaults.sendOptions in browser-extension mode', async () => {
      const wallet = {
        publicKey: { toBase58: () => 'pk' } as unknown as PublicKeyType,
        signTransaction: vi.fn(),
      };
      const provider = new SolanaWalletProvider({
        wallet,
        endpoint: ENDPOINT,
        defaults: { sendOptions: { maxRetries: 3 } },
      });

      await provider.sendTransaction(RAW_TX);

      expect(sendRawTransaction).toHaveBeenCalledWith(RAW_TX, { maxRetries: 3 });
    });
  });
});
