import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuiWalletProvider } from './SuiWalletProvider.js';

const TX_BYTES = new Uint8Array([1, 2, 3, 4]);
const TEST_ADDRESS = '0xabc';
const TEST_DIGEST = '0xdeadbeef';

const dryRunTransactionBlock = vi.fn();
const signAndExecuteTransaction = vi.fn();

vi.mock('@mysten/sui/client', () => {
  return {
    SuiClient: vi.fn().mockImplementation(() => ({
      dryRunTransactionBlock,
      signAndExecuteTransaction,
    })),
  };
});

vi.mock('@mysten/sui/keypairs/ed25519', () => {
  return {
    Ed25519Keypair: {
      deriveKeypair: vi.fn().mockReturnValue({ toSuiAddress: () => TEST_ADDRESS }),
    },
  };
});

function makeMockTransaction() {
  const setSenderIfNotSet = vi.fn();
  const build = vi.fn().mockResolvedValue(TX_BYTES);
  return { setSenderIfNotSet, build } as const;
}

describe('SuiWalletProvider.signAndExecuteTxn (private-key path)', () => {
  beforeEach(() => {
    dryRunTransactionBlock.mockReset();
    signAndExecuteTransaction.mockReset();
  });

  function makeProvider() {
    return new SuiWalletProvider({
      rpcUrl: 'https://sui.example/rpc',
      mnemonics: 'test test test test test test test test test test test junk',
    });
  }

  it('builds the transaction once and submits the dry-run bytes', async () => {
    dryRunTransactionBlock.mockResolvedValue({ effects: { status: { status: 'success' } } });
    signAndExecuteTransaction.mockResolvedValue({
      digest: TEST_DIGEST,
      effects: { status: { status: 'success' } },
    });

    const tx = makeMockTransaction();
    const provider = makeProvider();
    // biome-ignore lint/suspicious/noExplicitAny: SuiTransaction nominal alias mismatches the mock shape
    const digest = await provider.signAndExecuteTxn(tx as any);

    expect(tx.setSenderIfNotSet).toHaveBeenCalledTimes(1);
    expect(tx.setSenderIfNotSet).toHaveBeenCalledWith(TEST_ADDRESS);
    expect(tx.build).toHaveBeenCalledTimes(1);
    expect(dryRunTransactionBlock).toHaveBeenCalledTimes(1);
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

    const tx = makeMockTransaction();
    const provider = makeProvider();
    // biome-ignore lint/suspicious/noExplicitAny: SuiTransaction nominal alias mismatches the mock shape
    await expect(provider.signAndExecuteTxn(tx as any)).rejects.toThrow(/InsufficientGas/);

    expect(signAndExecuteTransaction).not.toHaveBeenCalled();
  });

  it('throws on post-submit on-chain failure', async () => {
    dryRunTransactionBlock.mockResolvedValue({ effects: { status: { status: 'success' } } });
    signAndExecuteTransaction.mockResolvedValue({
      digest: TEST_DIGEST,
      effects: { status: { status: 'failure', error: 'MoveAbort' } },
    });

    const tx = makeMockTransaction();
    const provider = makeProvider();
    // biome-ignore lint/suspicious/noExplicitAny: SuiTransaction nominal alias mismatches the mock shape
    await expect(provider.signAndExecuteTxn(tx as any)).rejects.toThrow(/MoveAbort/);
  });
});
