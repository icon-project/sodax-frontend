import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NearRawTransaction, TransferArgs } from '@sodax/types';

const signAndSendTransaction = vi.fn().mockResolvedValue({ transaction_outcome: { id: 'near-tx-id' } });
const functionCall = vi.fn().mockReturnValue({ kind: 'functionCall' });

const TRANSFER_ARGS: TransferArgs = { token: 't', to: [], amount: '0', data: [] };

vi.mock('near-api-js', () => ({
  Account: class {
    public readonly signAndSendTransaction = signAndSendTransaction;
    constructor(
      public readonly accountId: string,
      _provider: unknown,
      _signer: unknown,
    ) {}
  },
  JsonRpcProvider: class {},
  KeyPairSigner: { fromSecretKey: vi.fn().mockReturnValue({}) },
  actions: { functionCall },
}));

const { NearWalletProvider } = await import('./NearWalletProvider.js');

const RPC_URL = 'https://rpc.mainnet.near.org';
const ACCOUNT_ID = 'alice.near';
const PRIVATE_KEY = 'ed25519:abc';
const CONTRACT_ID = 'contract.near';

function makeTransaction(overrides?: Partial<{ gas: bigint; deposit: bigint }>): NearRawTransaction {
  return {
    signerId: ACCOUNT_ID,
    params: {
      contractId: CONTRACT_ID,
      method: 'do_thing',
      args: TRANSFER_ARGS,
      gas: overrides?.gas,
      deposit: overrides?.deposit,
    },
  };
}

function makeProvider(defaults?: ConstructorParameters<typeof NearWalletProvider>[0]['defaults']) {
  return new NearWalletProvider({
    rpcUrl: RPC_URL,
    accountId: ACCOUNT_ID,
    privateKey: PRIVATE_KEY,
    defaults,
  });
}

describe('NearWalletProvider', () => {
  describe('constructor', () => {
    it('initializes with private-key config', () => {
      const provider = new NearWalletProvider({
        rpcUrl: RPC_URL,
        accountId: ACCOUNT_ID,
        privateKey: PRIVATE_KEY,
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
      expect(() => new NearWalletProvider({} as never)).toThrow('Invalid Near wallet config');
    });

    it('accepts defaults without throwing', () => {
      const provider = new NearWalletProvider({
        rpcUrl: RPC_URL,
        accountId: ACCOUNT_ID,
        privateKey: PRIVATE_KEY,
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

  describe('signAndSubmitTxn — option merge (PK path)', () => {
    beforeEach(() => {
      signAndSendTransaction.mockClear();
      functionCall.mockClear();
    });

    it('uses DEFAULT_THROW_ON_FAILURE=true and DEFAULT_WAIT_UNTIL=FINAL when no defaults nor options', async () => {
      const provider = makeProvider();

      await provider.signAndSubmitTxn(makeTransaction());

      const call = signAndSendTransaction.mock.calls[0]?.[0];
      expect(call.throwOnFailure).toBe(true);
      expect(call.waitUntil).toBe('FINAL');
    });

    it('applies defaults.throwOnFailure / waitUntil when no per-call options', async () => {
      const provider = makeProvider({ throwOnFailure: false, waitUntil: 'INCLUDED' });

      await provider.signAndSubmitTxn(makeTransaction());

      const call = signAndSendTransaction.mock.calls[0]?.[0];
      expect(call.throwOnFailure).toBe(false);
      expect(call.waitUntil).toBe('INCLUDED');
    });

    it('per-call options override defaults', async () => {
      const provider = makeProvider({ throwOnFailure: false, waitUntil: 'INCLUDED' });

      await provider.signAndSubmitTxn(makeTransaction(), { throwOnFailure: true, waitUntil: 'EXECUTED' });

      const call = signAndSendTransaction.mock.calls[0]?.[0];
      expect(call.throwOnFailure).toBe(true);
      expect(call.waitUntil).toBe('EXECUTED');
    });

    it('forwards defaults.gasDefault / depositDefault to functionCall when transaction omits them', async () => {
      const provider = makeProvider({
        gasDefault: 100_000_000_000_000n,
        depositDefault: 7n,
      });

      await provider.signAndSubmitTxn(makeTransaction());

      // functionCall(method, args, gas, deposit)
      const args = functionCall.mock.calls[0];
      expect(args?.[2]).toBe(100_000_000_000_000n);
      expect(args?.[3]).toBe(7n);
    });

    it('transaction.params.gas / deposit win over defaults', async () => {
      const provider = makeProvider({
        gasDefault: 100_000_000_000_000n,
        depositDefault: 7n,
      });

      await provider.signAndSubmitTxn(makeTransaction({ gas: 1n, deposit: 2n }));

      const args = functionCall.mock.calls[0];
      expect(args?.[2]).toBe(1n);
      expect(args?.[3]).toBe(2n);
    });

    it('passes undefined gas/deposit through to near-api-js when neither tx nor defaults specify', async () => {
      const provider = makeProvider();

      await provider.signAndSubmitTxn(makeTransaction());

      const args = functionCall.mock.calls[0];
      expect(args?.[2]).toBeUndefined();
      expect(args?.[3]).toBeUndefined();
    });
  });
});
