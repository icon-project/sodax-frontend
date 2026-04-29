import { describe, it, expect, vi } from 'vitest';
import type { PublicKey as PublicKeyType } from '@solana/web3.js';

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
    constructor(_endpoint: string, _config?: unknown) {}
    sendRawTransaction = vi.fn();
    getLatestBlockhash = vi.fn();
    confirmTransaction = vi.fn();
    getBalance = vi.fn();
    getTokenAccountBalance = vi.fn();
  }
  class TransactionInstruction {
    constructor(_: unknown) {}
  }
  class TransactionMessage {
    constructor(_: unknown) {}
    compileToV0Message() {
      return {};
    }
  }
  class VersionedTransaction {
    constructor(_: unknown) {}
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

describe('SolanaWalletProvider', () => {
  const PRIVATE_KEY = new Uint8Array(64);
  const ENDPOINT = 'https://api.mainnet-beta.solana.com';

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
});
