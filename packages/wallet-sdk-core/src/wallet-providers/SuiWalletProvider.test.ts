import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Transaction } from '@mysten/sui/transactions';
import { SuiWalletProvider } from './SuiWalletProvider.js';

const TX_BYTES = new Uint8Array([1, 2, 3, 4]);
const TEST_ADDRESS = '0xabc';
const TEST_DIGEST = '0xdeadbeef';
const TEST_TOJSON = '{"version":2,"sender":"0xabc"}';

const dryRunTransactionBlock = vi.fn();
const signAndExecuteTransaction = vi.fn();
const getCoins = vi.fn();

vi.mock('@mysten/sui/client', () => ({
  SuiClient: vi.fn().mockImplementation(() => ({
    dryRunTransactionBlock,
    signAndExecuteTransaction,
    getCoins,
  })),
}));

vi.mock('@mysten/sui/keypairs/ed25519', () => ({
  Ed25519Keypair: {
    deriveKeypair: vi.fn().mockReturnValue({ toSuiAddress: () => TEST_ADDRESS }),
  },
}));

vi.mock('@mysten/sui/transactions', () => {
  class MockTransaction {
    setSenderIfNotSet = vi.fn();
    build = vi.fn().mockResolvedValue(TX_BYTES);
    toJSON = vi.fn().mockResolvedValue(TEST_TOJSON);
    static from = vi.fn();
  }
  return { Transaction: MockTransaction };
});

function makeProvider(defaults?: ConstructorParameters<typeof SuiWalletProvider>[0]['defaults']) {
  return new SuiWalletProvider({
    rpcUrl: 'https://sui.example/rpc',
    mnemonics: 'test test test test test test test test test test test junk',
    defaults,
  });
}

function makeTransaction(): Transaction {
  return new Transaction();
}

beforeEach(() => {
  dryRunTransactionBlock.mockReset();
  signAndExecuteTransaction.mockReset();
  getCoins.mockReset();
  // Default behavior: dry-run + submit succeed
  dryRunTransactionBlock.mockResolvedValue({ effects: { status: { status: 'success' } } });
  signAndExecuteTransaction.mockResolvedValue({
    digest: TEST_DIGEST,
    effects: { status: { status: 'success' } },
  });
});

describe('SuiWalletProvider.signAndExecuteTxn — dry-run + submit (private-key path)', () => {
  it('builds the transaction once and submits the dry-run bytes', async () => {
    const tx = makeTransaction();
    const provider = makeProvider();

    const digest = await provider.signAndExecuteTxn(tx);

    expect(tx.setSenderIfNotSet).toHaveBeenCalledWith(TEST_ADDRESS);
    expect(tx.build).toHaveBeenCalledTimes(1);
    expect(dryRunTransactionBlock).toHaveBeenCalledWith({ transactionBlock: TX_BYTES });
    expect(signAndExecuteTransaction).toHaveBeenCalledTimes(1);

    const submitArgs = signAndExecuteTransaction.mock.calls[0]?.[0];
    expect(submitArgs.transaction).toBe(TX_BYTES);
    expect(submitArgs.options).toEqual({ showEffects: true });
    expect(digest).toBe(TEST_DIGEST);
  });

  it('throws on dry-run failure without submitting', async () => {
    dryRunTransactionBlock.mockResolvedValue({
      effects: { status: { status: 'failure', error: 'InsufficientGas' } },
    });
    const provider = makeProvider();

    await expect(provider.signAndExecuteTxn(makeTransaction())).rejects.toThrow(/InsufficientGas/);
    expect(signAndExecuteTransaction).not.toHaveBeenCalled();
  });

  it('throws on post-submit on-chain failure', async () => {
    signAndExecuteTransaction.mockResolvedValue({
      digest: TEST_DIGEST,
      effects: { status: { status: 'failure', error: 'MoveAbort' } },
    });
    const provider = makeProvider();

    await expect(provider.signAndExecuteTxn(makeTransaction())).rejects.toThrow(/MoveAbort/);
  });
});

describe('SuiWalletProvider.signAndExecuteTxn — dry-run toggle (multi-step config, AC#3)', () => {
  it('skips dry-run when defaults.signAndExecuteTxn.dryRun.enabled is false', async () => {
    const provider = makeProvider({ signAndExecuteTxn: { dryRun: { enabled: false } } });

    await provider.signAndExecuteTxn(makeTransaction());

    expect(dryRunTransactionBlock).not.toHaveBeenCalled();
    expect(signAndExecuteTransaction).toHaveBeenCalledTimes(1);
  });

  it('skips dry-run when per-call options disable it', async () => {
    const provider = makeProvider();

    await provider.signAndExecuteTxn(makeTransaction(), { dryRun: { enabled: false } });

    expect(dryRunTransactionBlock).not.toHaveBeenCalled();
    expect(signAndExecuteTransaction).toHaveBeenCalledTimes(1);
  });

  it('per-call dryRun.enabled=true overrides defaults.dryRun.enabled=false', async () => {
    const provider = makeProvider({ signAndExecuteTxn: { dryRun: { enabled: false } } });

    await provider.signAndExecuteTxn(makeTransaction(), { dryRun: { enabled: true } });

    expect(dryRunTransactionBlock).toHaveBeenCalledTimes(1);
  });
});

describe('SuiWalletProvider.signAndExecuteTxn — response options merge', () => {
  it('merges per-call response options with PK defaults', async () => {
    const provider = makeProvider();

    await provider.signAndExecuteTxn(makeTransaction(), {
      response: { showEvents: true, showObjectChanges: true },
    });

    const submitArgs = signAndExecuteTransaction.mock.calls[0]?.[0];
    expect(submitArgs.options).toEqual({ showEffects: true, showEvents: true, showObjectChanges: true });
  });

  it('applies defaults.signAndExecuteTxn.response when no per-call options', async () => {
    const provider = makeProvider({ signAndExecuteTxn: { response: { showEvents: true } } });

    await provider.signAndExecuteTxn(makeTransaction());

    const submitArgs = signAndExecuteTransaction.mock.calls[0]?.[0];
    expect(submitArgs.options).toEqual({ showEffects: true, showEvents: true });
  });
});

describe('SuiWalletProvider.signAndExecuteTxn — toJSON-shape input (no unknown-as cast)', () => {
  it('reconstructs Transaction from toJSON when input is not a Transaction instance', async () => {
    const reconstructed = new Transaction();
    vi.mocked(Transaction.from).mockReturnValue(reconstructed);

    const provider = makeProvider();
    const lightTxn = { toJSON: vi.fn().mockResolvedValue(TEST_TOJSON) };

    await provider.signAndExecuteTxn(lightTxn);

    expect(lightTxn.toJSON).toHaveBeenCalledTimes(1);
    expect(Transaction.from).toHaveBeenCalledWith(TEST_TOJSON);
    expect(reconstructed.build).toHaveBeenCalledTimes(1);
  });
});

describe('SuiWalletProvider.getCoins — limit policy', () => {
  beforeEach(() => {
    getCoins.mockResolvedValue({ data: [], hasNextPage: false, nextCursor: null });
  });

  it('uses default limit 10 when no defaults and no per-call options', async () => {
    const provider = makeProvider();
    await provider.getCoins(TEST_ADDRESS, '0x2::sui::SUI');

    expect(getCoins).toHaveBeenCalledWith({ owner: TEST_ADDRESS, coinType: '0x2::sui::SUI', limit: 10 });
  });

  it('applies defaults.getCoins.limit when no per-call options', async () => {
    const provider = makeProvider({ getCoins: { limit: 50 } });
    await provider.getCoins(TEST_ADDRESS, '0x2::sui::SUI');

    expect(getCoins).toHaveBeenCalledWith({ owner: TEST_ADDRESS, coinType: '0x2::sui::SUI', limit: 50 });
  });

  it('per-call limit overrides defaults', async () => {
    const provider = makeProvider({ getCoins: { limit: 50 } });
    await provider.getCoins(TEST_ADDRESS, '0x2::sui::SUI', { limit: 5 });

    expect(getCoins).toHaveBeenCalledWith({ owner: TEST_ADDRESS, coinType: '0x2::sui::SUI', limit: 5 });
  });
});
